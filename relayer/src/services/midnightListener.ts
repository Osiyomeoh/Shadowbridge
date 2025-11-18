import { logger } from '../logger';
import { TransferService } from './transferService';
import { config } from '../config';

interface TransferRegisteredEvent {
  messageHash: string;
  senderCommit: string;
  recipientCommit: string;
  amountCommit: string;
  destChainId: number;
  timestamp: number;
}

export class MidnightListener {
  private pollInterval: NodeJS.Timeout | null = null;
  private lastProcessedBlock: number = 0;
  private isRunning = false;

  constructor(
    private readonly transferService: TransferService,
    private readonly contractAddress: string
  ) {}

  start() {
    if (this.isRunning) {
      logger.warn('Midnight listener already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting Midnight event listener', {
      contractAddress: this.contractAddress,
      indexerUrl: config.midnight.indexerUrl,
    });

    // Poll every 10 seconds for new events
    this.pollInterval = setInterval(() => {
      this.pollEvents().catch((error) => {
        logger.error('Error polling Midnight events', { error: error.message });
      });
    }, 10_000);

    // Initial poll
    this.pollEvents().catch((error) => {
      logger.error('Error in initial Midnight poll', { error: error.message });
    });
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    logger.info('Midnight listener stopped');
  }

  private async pollEvents() {
    if (!config.midnight.indexerUrl) {
      logger.warn('Midnight indexer URL not configured');
      return;
    }

    // Note: Midnight indexer GraphQL API format needs to be verified
    // For the hackathon demo, transfers are submitted directly via frontend API
    // This listener can be implemented later once the exact GraphQL schema is known
    logger.debug('Midnight event polling - API format needs verification');
    // TODO: Implement proper GraphQL query once indexer schema is confirmed
  }

  private async processEvent(event: any) {
    try {
      // Parse event data (adjust based on actual indexer response format)
      const eventData = event.eventData || {};
      const messageHash = eventData.messageHash || event.txId;

      // For now, we'll need to reconstruct transfer data from commitments
      // In production, you'd decode the actual event payload
      const transfer = await this.transferService.createTransfer({
        sender: eventData.senderCommit || '0x',
        recipient: eventData.recipientCommit || '0x',
        destinationChain: `ethereum-sepolia`, // Map from destChainId
        amountUsd: 0, // Would need to decode from amountCommit
        proofs: {
          kycProof: '0x',
          amountProof: '0x',
          sanctionsProof: '0x',
        },
        sourceTxHash: event.txId,
        metadata: {
          midnightBlockHeight: event.blockHeight,
          midnightContractAddress: this.contractAddress,
        },
        source: 'midnight',
      });

      logger.info('Enqueued transfer from Midnight event', {
        transferId: transfer.id,
        txId: event.txId,
      });
    } catch (error) {
      logger.error('Failed to process Midnight event', {
        error: (error as Error).message,
        txId: event.txId,
      });
    }
  }
}

