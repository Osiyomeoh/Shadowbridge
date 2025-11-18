export type ProofBundle = {
  kycProof: string;
  amountProof: string;
  sanctionsProof: string;
};

export type TransferStatus =
  | 'QUEUED'
  | 'PROOF_VERIFYING'
  | 'PROOF_VERIFIED'
  | 'SUBMITTING'
  | 'SETTLED'
  | 'FAILED';

export type TransferSource = 'api' | 'midnight';

export interface TransferRecord {
  id: string;
  sender: string;
  recipient: string;
  destinationChain: string;
  amountUsd: number;
  amountWei: bigint;
  feeUsd: number;
  sourceTxHash?: string;
  messageHash: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
  status: TransferStatus;
  proofs: ProofBundle;
  txHash?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  source: TransferSource;
}

export interface CreateTransferInput {
  sender: string;
  recipient: string;
  destinationChain: string;
  amountUsd: number;
  proofs: ProofBundle;
  sourceTxHash?: string;
  metadata?: Record<string, unknown>;
  source?: TransferSource;
}

export interface TransferStats {
  totalTransfers: number;
  queued: number;
  inFlight: number;
  settled: number;
  failed: number;
  totalVolumeUsd: number;
}

