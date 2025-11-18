import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './logger';
import { InMemoryTransferStore } from './db/transferStore';
import { ProofVerifier } from './services/proofVerifier';
import { BridgeClient } from './services/bridgeClient';
import { TransferProcessor } from './services/transferProcessor';
import { TransferService } from './services/transferService';
import { MidnightListener } from './services/midnightListener';
import { createTransferRouter } from './routes/transfers';

const app = express();
app.use(cors());
app.use(express.json());

const store = new InMemoryTransferStore();
const proofVerifier = new ProofVerifier(4_000);
const bridgeClient = new BridgeClient({
  rpcUrl: config.ethereum.rpcUrl,
  bridgeAddress: config.ethereum.bridgeAddress,
  privateKey: config.ethereum.privateKey,
  decimals: config.usdcDecimals,
});
const processor = new TransferProcessor(store, proofVerifier, bridgeClient);
const transferService = new TransferService(store, processor, {
  minAmount: config.minAmount,
  maxAmount: config.maxAmount,
  feeBps: config.feeBps,
  decimals: config.usdcDecimals,
});

app.get('/health', async (_req, res) => {
  const stats = await transferService.stats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    totalTransfers: stats.totalTransfers,
    pendingJobs: processor.pendingJobs(),
  });
});

app.use('/transfers', createTransferRouter(transferService));

app.get('/stats', async (_req, res) => {
  const stats = await transferService.stats();
  res.json({
    ...stats,
    feeBps: config.feeBps,
  });
});

app.post('/simulate/midnight', async (req, res) => {
  try {
    const transfer = await transferService.createTransfer({
      sender: req.body.sender,
      recipient: req.body.recipient,
      destinationChain: req.body.destinationChain || 'ethereum-sepolia',
      amountUsd: Number(req.body.amountUsd),
      proofs: req.body.proofs,
      sourceTxHash: req.body.sourceTxHash,
      metadata: req.body.metadata,
      source: 'midnight',
    });

    res.status(202).json({
      transferId: transfer.id,
      messageHash: transfer.messageHash,
      status: transfer.status,
    });
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message || 'Unable to enqueue midnight event',
    });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// Start Midnight event listener if configured
let midnightListener: MidnightListener | null = null;
if (config.midnight.contractAddress && config.midnight.indexerUrl) {
  midnightListener = new MidnightListener(
    transferService,
    config.midnight.contractAddress
  );
  midnightListener.start();
} else {
  logger.warn(
    'Midnight listener not started: contract address or indexer URL missing'
  );
}

const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`ShadowBridge Relayer running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (midnightListener) {
    midnightListener.stop();
  }
  process.exit(0);
});
