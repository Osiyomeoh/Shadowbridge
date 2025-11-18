import { TransferService } from '../transferService';
import { InMemoryTransferStore } from '../../db/transferStore';
import { TransferProcessor } from '../transferProcessor';
import { ProofVerifier } from '../proofVerifier';
import { BridgeClient } from '../bridgeClient';

describe('TransferService', () => {
  let service: TransferService;
  let store: InMemoryTransferStore;
  let processor: TransferProcessor;

  beforeEach(() => {
    store = new InMemoryTransferStore();
    const proofVerifier = new ProofVerifier(4000);
    const bridgeClient = new BridgeClient({
      rpcUrl: 'http://localhost:8545',
      bridgeAddress: '0x123',
      privateKey: '0x' + '1'.repeat(64),
      decimals: 18,
    });
    processor = new TransferProcessor(store, proofVerifier, bridgeClient);
    service = new TransferService(store, processor, {
      minAmount: 1,
      maxAmount: 10000,
      feeBps: 150,
      decimals: 18,
    });
  });

  describe('createTransfer', () => {
    it('should create transfer with valid input', async () => {
      const input = {
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 100,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
      };

      const result = await service.createTransfer(input);

      expect(result.id).toBeDefined();
      expect(result.sender).toBe(input.sender);
      expect(result.recipient).toBe(input.recipient);
      expect(result.amountUsd).toBe(100);
      expect(result.status).toBe('QUEUED');
      expect(result.feeUsd).toBe(1.5);
    });

    it('should throw error for amount below minimum', async () => {
      const input = {
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 0.5,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
      };

      await expect(service.createTransfer(input)).rejects.toThrow(
        'Amount must be between 1 and 10000'
      );
    });

    it('should throw error for amount above maximum', async () => {
      const input = {
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 20000,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
      };

      await expect(service.createTransfer(input)).rejects.toThrow(
        'Amount must be between 1 and 10000'
      );
    });

    it('should throw error for missing proofs', async () => {
      const input = {
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 100,
        proofs: {
          kycProof: '0xabc',
          amountProof: '',
          sanctionsProof: '0xghi',
        },
      };

      await expect(service.createTransfer(input)).rejects.toThrow('Missing amountProof');
    });

    it('should calculate correct fee', async () => {
      const input = {
        sender: '0x123',
        recipient: '0x456',
        destinationChain: 'ethereum-sepolia',
        amountUsd: 1000,
        proofs: {
          kycProof: '0xabc',
          amountProof: '0xdef',
          sanctionsProof: '0xghi',
        },
      };

      const result = await service.createTransfer(input);
      expect(result.feeUsd).toBe(15);
    });
  });

  describe('listTransfers', () => {
    it('should return empty array initially', async () => {
      const transfers = await service.listTransfers();
      expect(transfers).toEqual([]);
    });

    it('should return all transfers', async () => {
      await service.createTransfer({
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

      const transfers = await service.listTransfers();
      expect(transfers).toHaveLength(1);
    });
  });

  describe('getTransfer', () => {
    it('should return transfer by id', async () => {
      const created = await service.createTransfer({
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

      const retrieved = await service.getTransfer(created.id);
      expect(retrieved).toEqual(created);
    });
  });
});

