import { Router } from 'express';
import { TransferService } from '../services/transferService';

export const createTransferRouter = (transferService: TransferService) => {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const transfer = await transferService.createTransfer({
        sender: req.body.sender,
        recipient: req.body.recipient,
        destinationChain: req.body.destinationChain || 'ethereum-sepolia',
        amountUsd: Number(req.body.amountUsd),
        proofs: req.body.proofs,
        sourceTxHash: req.body.sourceTxHash,
        metadata: req.body.metadata,
        source: 'api',
      });

      const response = JSON.parse(JSON.stringify({
        transferId: transfer.id,
        status: transfer.status,
        messageHash: transfer.messageHash,
      }, jsonReplacer));
      res.status(202).json(response);
    } catch (error) {
      res.status(400).json({
        error: (error as Error).message || 'Unable to queue transfer',
      });
    }
  });

  router.get('/', async (_req, res) => {
    const transfers = await transferService.listTransfers();
    const response = JSON.parse(JSON.stringify({ transfers }, jsonReplacer));
    res.json(response);
  });

  router.get('/:id', async (req, res) => {
    const transfer = await transferService.getTransfer(req.params.id);
    if (!transfer) {
      return res.status(404).json({ error: 'Not found' });
    }
    const response = JSON.parse(JSON.stringify({ transfer }, jsonReplacer));
    res.json(response);
  });

  function jsonReplacer(_key: string, value: any) {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }

  return router;
};

