import { BridgeClient } from '../bridgeClient';
import { TransferRecord } from '../../types';

describe('BridgeClient', () => {
  describe('isReady', () => {
    it('should return false when not configured', () => {
      const client = new BridgeClient({
        rpcUrl: '',
        bridgeAddress: '',
        privateKey: '',
        decimals: 18,
      });

      expect(client.isReady()).toBe(false);
    });

    it('should return true when configured', () => {
      const client = new BridgeClient({
        rpcUrl: 'http://localhost:8545',
        bridgeAddress: '0x123',
        privateKey: '0x' + '1'.repeat(64),
        decimals: 18,
      });

      expect(client.isReady()).toBe(true);
    });
  });

  describe('submitTransfer', () => {
    it('should throw error when not configured', async () => {
      const client = new BridgeClient({
        rpcUrl: '',
        bridgeAddress: '',
        privateKey: '',
        decimals: 18,
      });

      const transfer: TransferRecord = {
        id: 'test-id',
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 100,
        amountWei: BigInt('1000000000000000000'),
        feeUsd: 1.5,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
        messageHash: '0x789' as `0x${string}`,
        status: 'PROOF_VERIFIED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(client.submitTransfer(transfer)).rejects.toThrow(
        'Bridge client not configured'
      );
    });
  });
});

