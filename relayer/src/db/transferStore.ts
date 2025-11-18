import { TransferRecord, TransferStats, TransferStatus } from '../types';

export interface TransferStore {
  create(record: TransferRecord): Promise<TransferRecord>;
  update(
    id: string,
    updates: Partial<Omit<TransferRecord, 'id' | 'createdAt'>>
  ): Promise<TransferRecord | undefined>;
  get(id: string): Promise<TransferRecord | undefined>;
  list(): Promise<TransferRecord[]>;
  stats(): Promise<TransferStats>;
}

export class InMemoryTransferStore implements TransferStore {
  private transfers = new Map<string, TransferRecord>();

  async create(record: TransferRecord): Promise<TransferRecord> {
    this.transfers.set(record.id, record);
    return record;
  }

  async update(
    id: string,
    updates: Partial<Omit<TransferRecord, 'id' | 'createdAt'>>
  ) {
    const existing = this.transfers.get(id);
    if (!existing) return undefined;

    const updated: TransferRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.transfers.set(id, updated);
    return updated;
  }

  async get(id: string) {
    return this.transfers.get(id);
  }

  async list() {
    return Array.from(this.transfers.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }

  async stats(): Promise<TransferStats> {
    const transferList = Array.from(this.transfers.values());

    const accumulator: TransferStats = {
      totalTransfers: transferList.length,
      queued: 0,
      inFlight: 0,
      settled: 0,
      failed: 0,
      totalVolumeUsd: 0,
    };

    const inFlightStatuses: TransferStatus[] = [
      'PROOF_VERIFYING',
      'PROOF_VERIFIED',
      'SUBMITTING',
    ];

    for (const transfer of transferList) {
      switch (transfer.status) {
        case 'QUEUED':
          accumulator.queued += 1;
          break;
        case 'FAILED':
          accumulator.failed += 1;
          break;
        case 'SETTLED':
          accumulator.settled += 1;
          accumulator.totalVolumeUsd += transfer.amountUsd;
          break;
        default:
          if (inFlightStatuses.includes(transfer.status)) {
            accumulator.inFlight += 1;
          }
          break;
      }
    }

    return accumulator;
  }
}

