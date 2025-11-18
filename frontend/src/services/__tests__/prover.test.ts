import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProof, generateAllProofs } from '../prover';

global.fetch = vi.fn();

describe('Prover Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProof', () => {
    it('should generate a proof successfully', async () => {
      const mockProof = '0x1234567890abcdef';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ proof: mockProof, publicSignals: [] }),
      });

      const result = await generateProof('kyc', { holderId: '123' });
      expect(result).toBe(mockProof);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/prove/kyc'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return placeholder proof on 400 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid input' }),
      });

      const result = await generateProof('amount', { amount: '100' });
      expect(result).toMatch(/^0x[a-f0-9]{128}$/);
    });

    it('should throw error on non-400 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(generateProof('sanctions', { walletHash: '0x123' })).rejects.toThrow();
    });
  });

  describe('generateAllProofs', () => {
    it('should generate all three proofs in parallel', async () => {
      const mockProof = '0xabcdef123456';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ proof: mockProof, publicSignals: [] }),
      });

      const result = await generateAllProofs(100, '0x1234567890abcdef1234567890abcdef12345678', '0x9876543210fedcba9876543210fedcba98765432');

      expect(result.kycProof).toBe(mockProof);
      expect(result.amountProof).toBe(mockProof);
      expect(result.sanctionsProof).toBe(mockProof);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle proof generation errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Error' }),
      });

      const result = await generateAllProofs(50, '0x123', '0x456');
      expect(result.kycProof).toMatch(/^0x[a-f0-9]{128}$/);
      expect(result.amountProof).toMatch(/^0x[a-f0-9]{128}$/);
      expect(result.sanctionsProof).toMatch(/^0x[a-f0-9]{128}$/);
    });
  });
});

