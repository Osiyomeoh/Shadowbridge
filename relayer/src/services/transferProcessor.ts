import { logger } from '../logger';
import { TransferStore } from '../db/transferStore';
import { ProofVerifier } from './proofVerifier';
import { BridgeClient } from './bridgeClient';
import { TransferRecord } from '../types';

export class TransferProcessor {
  private queue: string[] = [];
  private processing = false;

  constructor(
    private readonly store: TransferStore,
    private readonly verifier: ProofVerifier,
    private readonly bridgeClient: BridgeClient
  ) {}

  enqueue(transferId: string) {
    this.queue.push(transferId);
    this.processQueue();
  }

  pendingJobs() {
    return this.queue.length + (this.processing ? 1 : 0);
  }

  private async processQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;
    while (this.queue.length > 0) {
      const transferId = this.queue.shift();
      if (!transferId) continue;

      try {
        await this.handleTransfer(transferId);
      } catch (error) {
        logger.error('Transfer processing failed', {
          transferId,
          error: (error as Error).message,
        });
      }
    }
    this.processing = false;
  }

  private async handleTransfer(transferId: string) {
    const transfer = await this.store.get(transferId);
    if (!transfer) {
      logger.error('Transfer not found', { transferId });
      return;
    }

    logger.info('Processing transfer', {
      transferId,
      amountUsd: transfer.amountUsd,
    });

    try {
      await this.store.update(transferId, { status: 'PROOF_VERIFYING' });
      await this.verifier.verify(transfer.proofs);

      await this.store.update(transferId, { status: 'PROOF_VERIFIED' });

      await this.store.update(transferId, { status: 'SUBMITTING' });
      const receipt = await this.bridgeClient.submitTransfer(transfer);

      await this.store.update(transferId, {
        status: 'SETTLED',
        txHash: receipt?.hash,
        settledAt: new Date().toISOString(),
      });

      logger.info('Transfer settled', {
        transferId,
        txHash: receipt?.hash,
      });
    } catch (error) {
      const message = (error as Error).message || 'Unknown error';
      await this.store.update(transferId, { status: 'FAILED', error: message });
      throw error;
    }
  }
}

