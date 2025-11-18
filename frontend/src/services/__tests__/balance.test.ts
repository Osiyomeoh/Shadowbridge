import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  const mockContract = {
    balanceOf: vi.fn().mockResolvedValue('1000000000000000000'),
    decimals: vi.fn().mockResolvedValue(18),
    symbol: vi.fn().mockResolvedValue('wUSDC'),
    wrappedToken: vi.fn().mockResolvedValue('0xTokenAddress'),
  };

  return {
    ...actual,
    ethers: {
      ...(actual as any).ethers,
      JsonRpcProvider: vi.fn(() => ({})),
      Contract: vi.fn(() => mockContract),
      formatUnits: vi.fn((value: string, decimals: number) => {
        return (Number(value) / Math.pow(10, Number(decimals))).toString();
      }),
    },
  };
});

describe('Balance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTokenBalance', () => {
    it('should return null for invalid address', async () => {
      const { getTokenBalance } = await import('../balance');
      const result = await getTokenBalance('invalid');
      expect(result).toBeNull();
    });

    it('should return null when token address not configured', async () => {
      const { getTokenBalance } = await import('../balance');
      const result = await getTokenBalance('0x1234567890123456789012345678901234567890');
      expect(result).toBeNull();
    });
  });

  describe('getTokenAddressFromBridge', () => {
    it('should return null for invalid bridge address', async () => {
      const { getTokenAddressFromBridge } = await import('../balance');
      const result = await getTokenAddressFromBridge('invalid');
      expect(result).toBeNull();
    });
  });
});

