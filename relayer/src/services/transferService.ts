import { randomUUID, createHash } from 'crypto';
import { logger } from '../logger';
import { TransferStore } from '../db/transferStore';
import {
  CreateTransferInput,
  TransferRecord,
  TransferSource,
} from '../types';
import { TransferProcessor } from './transferProcessor';
import { parseUnits } from 'ethers';

const BPS_DIVISOR = 10_000;

export interface TransferServiceOptions {
  minAmount: number;
  maxAmount: number;
  feeBps: number;
  decimals: number;
}

export class TransferService {
  constructor(
    private readonly store: TransferStore,
    private readonly processor: TransferProcessor,
    private readonly options: TransferServiceOptions
  ) {}

  async createTransfer(input: CreateTransferInput) {
    this.validateInput(input);
    const record = this.buildRecord(input);
    await this.store.create(record);
    this.processor.enqueue(record.id);
    logger.info('Transfer queued', { transferId: record.id });
    return record;
  }

  async listTransfers() {
    return this.store.list();
  }

  async getTransfer(id: string) {
    return this.store.get(id);
  }

  async stats() {
    return this.store.stats();
  }

  private validateInput(input: CreateTransferInput) {
    if (!input.sender || !input.recipient) {
      throw new Error('Sender and recipient are required');
    }

    if (Number.isNaN(input.amountUsd)) {
      throw new Error('Amount must be a valid number');
    }

    if (
      input.amountUsd < this.options.minAmount ||
      input.amountUsd > this.options.maxAmount
    ) {
      throw new Error(
        `Amount must be between ${this.options.minAmount} and ${this.options.maxAmount}`
      );
    }

    const requiredProofs: Array<keyof CreateTransferInput['proofs']> = [
      'kycProof',
      'amountProof',
      'sanctionsProof',
    ];

    requiredProofs.forEach((field) => {
      if (!input.proofs[field]) {
        throw new Error(`Missing ${field}`);
      }
    });
  }

  private buildRecord(input: CreateTransferInput): TransferRecord {
    const now = new Date().toISOString();
    const id = randomUUID();
    const feeUsd = (input.amountUsd * this.options.feeBps) / BPS_DIVISOR;
    const normalizedSource: TransferSource = input.source || 'api';

    const hashed = createHash('sha256');
    hashed.update(
      [
        input.sender.toLowerCase(),
        input.recipient.toLowerCase(),
        input.amountUsd.toString(),
        input.destinationChain,
        input.sourceTxHash ?? randomUUID(),
      ].join(':')
    );

    const messageHash = (`0x${hashed.digest('hex')}`) as `0x${string}`;
    const amountWei = parseUnits(
      input.amountUsd.toString(),
      this.options.decimals
    );

    return {
      id,
      sender: input.sender,
      recipient: input.recipient,
      destinationChain: input.destinationChain,
      amountUsd: input.amountUsd,
      amountWei,
      feeUsd,
      proofs: input.proofs,
      sourceTxHash: input.sourceTxHash,
      messageHash,
      createdAt: now,
      updatedAt: now,
      status: 'QUEUED',
      metadata: input.metadata,
      source: normalizedSource,
    };
  }
}

