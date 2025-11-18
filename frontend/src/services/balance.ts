import { ethers } from 'ethers';

// Standard ERC20 ABI (just balanceOf and decimals)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const SEPOLIA_RPC = import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const TOKEN_ADDRESS = import.meta.env.VITE_WUSDC_TOKEN_ADDRESS || '';

export interface BalanceInfo {
  balance: string;
  formatted: string;
  symbol: string;
  decimals: number;
}

export async function getTokenBalance(address: string, tokenAddress?: string): Promise<BalanceInfo | null> {
  if (!address || !address.startsWith('0x')) {
    console.warn('Invalid Ethereum address:', address);
    return null;
  }

  const tokenAddr = tokenAddress || TOKEN_ADDRESS;
  if (!tokenAddr) {
    console.warn('Token address not configured');
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);

    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals(),
      tokenContract.symbol(),
    ]);

    const formatted = ethers.formatUnits(balance, decimals);

    return {
      balance: balance.toString(),
      formatted,
      symbol,
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    return null;
  }
}

export async function getTokenAddressFromBridge(bridgeAddress: string): Promise<string | null> {
  if (!bridgeAddress || !bridgeAddress.startsWith('0x')) {
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    // BridgeReceiver has wrappedToken() public view function
    const bridgeABI = ['function wrappedToken() view returns (address)'];
    const bridgeContract = new ethers.Contract(bridgeAddress, bridgeABI, provider);
    const tokenAddress = await bridgeContract.wrappedToken();
    return tokenAddress;
  } catch (error) {
    console.error('Failed to get token address from bridge:', error);
    return null;
  }
}

