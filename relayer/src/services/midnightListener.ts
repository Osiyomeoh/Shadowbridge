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

    this.pollInterval = setInterval(() => {
      this.pollEvents().catch((error) => {
        logger.error('Error polling Midnight events', { error: error.message });
      });
    }, 10_000);

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
    logger.debug('Midnight event polling');
  }

  private async processEvent(event: any) {
    try {
      const eventData = event.eventData || {};

      const transfer = await this.transferService.createTransfer({
        sender: eventData.senderCommit || '0x',
        recipient: eventData.recipientCommit || '0x',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 0,
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

