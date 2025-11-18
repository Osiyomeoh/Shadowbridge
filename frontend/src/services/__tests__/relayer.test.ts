import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitTransfer, getTransferStatus, fetchRecentTransfers } from '../relayer';

global.fetch = vi.fn();

describe('Relayer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitTransfer', () => {
    it('should submit transfer successfully', async () => {
      const mockResponse = {
        transferId: 'test-id',
        messageHash: '0x123',
        status: 'QUEUED',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await submitTransfer({
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 100,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transfers'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error on failed submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid input' }),
      });

      await expect(
        submitTransfer({
          sender: '0x123',
          recipient: '0x456',
          destinationChain: 'ethereum-sepolia',
          amountUsd: 100,
          proofs: {
            kycProof: '0xabc',
            amountProof: '0xdef',
            sanctionsProof: '0xghi',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('getTransferStatus', () => {
    it('should fetch transfer status successfully', async () => {
      const mockStatus = {
        transfer: {
          id: 'test-id',
          status: 'SETTLED',
          txHash: '0x789',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await getTransferStatus('test-id');
      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transfers/test-id')
      );
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getTransferStatus('test-id')).rejects.toThrow();
    });
  });

  describe('fetchRecentTransfers', () => {
    it('should fetch and sort transfers correctly', async () => {
      const mockData = {
        transfers: [
          {
            id: '1',
            recipient: '0x111',
            amountUsd: 100,
            status: 'SETTLED',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            id: '2',
            recipient: '0x222',
            amountUsd: 200,
            status: 'QUEUED',
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchRecentTransfers(5);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should limit results to specified limit', async () => {
      const mockData = {
        transfers: Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          recipient: `0x${i}`,
          amountUsd: 100,
          status: 'SETTLED',
          createdAt: `2025-01-0${i + 1}T00:00:00Z`,
          updatedAt: `2025-01-0${i + 1}T00:00:00Z`,
        })),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchRecentTransfers(5);
      expect(result).toHaveLength(5);
    });
  });
});

