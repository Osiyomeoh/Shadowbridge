const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:3001';

export interface TransferRequest {
  sender: string;
  recipient: string;
  destinationChain: string;
  amountUsd: number;
  proofs: {
    kycProof: string;
    amountProof: string;
    sanctionsProof: string;
  };
  sourceTxHash?: string;
  metadata?: Record<string, any>;
}

export interface TransferResponse {
  transferId: string;
  messageHash: string;
  status: string;
}

export async function submitTransfer(request: TransferRequest): Promise<TransferResponse> {
  const startTime = Date.now();
  console.log('  📤 Submitting to relayer:', {
    sender: request.sender.slice(0, 20) + '...',
    recipient: request.recipient.slice(0, 20) + '...',
    amount: request.amountUsd,
    chain: request.destinationChain,
  });
  
  try {
    const response = await fetch(`${RELAYER_URL}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error('  ❌ Relayer submission failed:', error);
      throw new Error(error.error || 'Failed to submit transfer');
    }

    const result = await response.json();
    const duration = Date.now() - startTime;
    console.log(`  ✅ Relayer accepted transfer in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`  ❌ Relayer submission failed after ${duration}ms:`, error);
    throw error;
  }
}

export async function getTransferStatus(transferId: string) {
  try {
    const response = await fetch(`${RELAYER_URL}/transfers/${transferId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch transfer status');
    }
    const status = await response.json();
    return status;
  } catch (error) {
    console.error('  ❌ Failed to fetch transfer status:', error);
    throw error;
  }
}

export interface RelayerTransfer {
  id: string;
  recipient: string;
  amountUsd: number;
  status: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRecentTransfers(limit = 5): Promise<RelayerTransfer[]> {
  try {
    const response = await fetch(`${RELAYER_URL}/transfers`);
    if (!response.ok) {
      throw new Error('Failed to fetch transfers');
    }
    const data = await response.json();
    const transfers: RelayerTransfer[] = (data?.transfers || []).map((t: any) => ({
      id: t.id,
      recipient: t.recipient,
      amountUsd: t.amountUsd,
      status: t.status,
      txHash: t.txHash,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
    return transfers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('  ❌ Failed to fetch transfers:', error);
    throw error;
  }
}

