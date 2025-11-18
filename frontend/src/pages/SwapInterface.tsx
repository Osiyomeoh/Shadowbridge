import { useState, useEffect, useRef } from 'react';
import { Shield, ArrowRight, CheckCircle, Wallet, ChevronDown, X, ChevronRight, RefreshCw } from 'lucide-react';
import { generateAllProofs } from '../services/prover';
import { submitTransfer, getTransferStatus, fetchRecentTransfers, type RelayerTransfer } from '../services/relayer';
import { connectLaceWallet, disconnectWallet } from '../services/wallet';
import { getTokenBalance, getTokenAddressFromBridge, type BalanceInfo } from '../services/balance';

type TransferHistoryEntry = {
  id: string;
  amount: number;
  recipient: string;
  status: 'QUEUED' | 'PROOF_VERIFYING' | 'PROOF_VERIFIED' | 'SUBMITTING' | 'SETTLED' | 'FAILED';
  txHash?: string;
  timestamp: string;
};

type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

export default function SwapInterface() {
  const [walletAddress, setWalletAddress] = useState<string>();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDisconnectDropdown, setShowDisconnectDropdown] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'midnight' | 'ethereum'>('midnight');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Balance tracking
  const [recipientBalance, setRecipientBalance] = useState<BalanceInfo | null>(null);
  const [recipientBalanceBefore, setRecipientBalanceBefore] = useState<BalanceInfo | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [history, setHistory] = useState<TransferHistoryEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDisconnectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const connectWallet = async (walletType: 'lace' = 'lace') => {
    console.log('Connect wallet clicked:', walletType);
    setIsConnecting(true);
    setError(undefined);
    setShowWalletModal(false);
    
    try {
      if (walletType === 'lace') {
        console.log('Attempting to connect to Lace wallet...');
        const address = await connectLaceWallet();
        console.log('Connected! Address:', address);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      const errorMessage = (error as Error).message || 'Failed to connect wallet';
      setError(errorMessage);
      alert(`Wallet Connection Error: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletAddress(undefined);
    setError(undefined);
    setTransferStatus(undefined);
    setRecipientBalance(null);
    setRecipientBalanceBefore(null);
  };

  const sortHistoryEntries = (entries: TransferHistoryEntry[]) =>
    entries
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

  const mapTransferToHistory = (transfer: RelayerTransfer): TransferHistoryEntry => ({
    id: transfer.id,
    amount: transfer.amountUsd,
    recipient: transfer.recipient,
    status: (transfer.status as TransferHistoryEntry['status']) || 'QUEUED',
    txHash: transfer.txHash,
    timestamp: transfer.updatedAt || transfer.createdAt,
  });

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const updateHistory = (transferId: string, updates: Partial<TransferHistoryEntry>) => {
    setHistory((prev) =>
      sortHistoryEntries(
        prev.map((entry) =>
          entry.id === transferId
            ? { ...entry, ...updates, timestamp: updates.timestamp ?? entry.timestamp }
            : entry
        )
      )
    );
  };

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const transfers = await fetchRecentTransfers(6);
        if (!isMounted) return;
        const mapped = transfers.map(mapTransferToHistory);
        setHistory((prev) => {
          const merged = new Map<string, TransferHistoryEntry>();
          mapped.forEach((entry) => merged.set(entry.id, entry));
          prev.forEach((entry) => {
            if (!merged.has(entry.id)) {
              merged.set(entry.id, entry);
            }
          });
          return sortHistoryEntries(Array.from(merged.values()));
        });
      } catch (error) {
        console.error('Failed to load transfer history:', error);
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch token address from bridge on mount
  useEffect(() => {
    const bridgeAddress = import.meta.env.VITE_ETHEREUM_BRIDGE_CONTRACT;
    if (bridgeAddress) {
      getTokenAddressFromBridge(bridgeAddress).then((addr) => {
        if (addr) {
          setTokenAddress(addr);
          console.log('Token address:', addr);
        }
      });
    }
  }, []);

  // Fetch recipient balance when recipient address changes
  useEffect(() => {
    if (recipient && recipient.startsWith('0x') && tokenAddress) {
      getTokenBalance(recipient, tokenAddress).then((balance) => {
        if (balance) {
          setRecipientBalance(balance);
          console.log('Recipient balance:', balance);
        }
      });
    } else {
      setRecipientBalance(null);
    }
  }, [recipient, tokenAddress]);

  // Format address for display (truncate long addresses)
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    // If address has | separator, use the first part (coinPublicKey)
    const parts = addr.split('|');
    const displayAddr = parts[0] || addr;
    if (displayAddr.length > 20) {
      return `${displayAddr.slice(0, 10)}...${displayAddr.slice(-8)}`;
    }
    return displayAddr;
  };

  const handleSend = async () => {
    console.log('🚀 Starting payment flow...');
    
    if (!walletAddress || !amount || !recipient) {
      console.error('❌ Validation failed: Missing fields');
      setError('Please fill in all fields');
      return;
    }

    setIsGeneratingProof(true);
    setProofGenerated(false);
    setError(undefined);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 1 || amountNum > 10000) {
        throw new Error('Amount must be between $1 and $10,000');
      }

      console.log('📊 Payment details:', {
        amount: amountNum,
        sender: walletAddress.slice(0, 20) + '...',
        recipient: recipient.slice(0, 20) + '...',
      });

      // Extract coinPublicKey from address (first part before |)
      const senderAddress = walletAddress.split('|')[0] || walletAddress;

      // Save recipient balance before transaction
      if (recipient && recipient.startsWith('0x') && tokenAddress) {
        const beforeBalance = await getTokenBalance(recipient, tokenAddress);
        setRecipientBalanceBefore(beforeBalance);
        console.log('Recipient balance before:', beforeBalance);
      }

      // Generate ZK proofs
      console.log('🔐 Step 1/3: Generating ZK proofs...');
      console.log('  - Generating KYC proof...');
      console.log('  - Generating Amount proof...');
      console.log('  - Generating Sanctions proof...');
      
      const proofs = await generateAllProofs(amountNum, senderAddress, recipient);
      
      console.log('✅ Step 1/3: ZK proofs generated successfully!');
      console.log('  - KYC proof length:', proofs.kycProof.length);
      console.log('  - Amount proof length:', proofs.amountProof.length);
      console.log('  - Sanctions proof length:', proofs.sanctionsProof.length);

      // Submit to relayer
      console.log('📤 Step 2/3: Submitting transfer to relayer...');
      const result = await submitTransfer({
        sender: senderAddress,
        recipient,
        destinationChain: 'ethereum-sepolia',
        amountUsd: amountNum,
        proofs,
      });

      console.log('✅ Step 2/3: Transfer submitted to relayer!');
      console.log('  - Transfer ID:', result.transferId);
      console.log('  - Message Hash:', result.messageHash);
      console.log('  - Status:', result.status);

      setProofGenerated(true);
      setHistory((prev) =>
        sortHistoryEntries([
          {
            id: result.transferId,
            amount: amountNum,
            recipient,
            status: 'QUEUED',
            timestamp: new Date().toISOString(),
          },
          ...prev.filter((entry) => entry.id !== result.transferId),
        ])
      );
      addToast({
        type: 'info',
        title: 'Transfer Submitted',
        message: `Payment to ${recipient.slice(0, 6)}... queued`,
      });

      // Poll for status updates
      console.log('⏳ Step 3/3: Waiting for relayer to process...');
      let pollCount = 0;
      const checkStatus = async () => {
        try {
          pollCount++;
          console.log(`  - Polling status (attempt ${pollCount})...`);
          
          const status = await getTransferStatus(result.transferId);
          console.log('  - Current status:', status.transfer.status);
          
          if (status.transfer.status === 'SETTLED') {
            console.log('🎉 SUCCESS! Payment settled on Ethereum!');
            console.log('  - Transfer ID:', result.transferId);
            console.log('  - Final status:', status.transfer);
            console.log('  - Ethereum TX Hash:', status.transfer.txHash);
            setTransferStatus('SETTLED');
            setIsGeneratingProof(false);
            setProofGenerated(false);
            updateHistory(result.transferId, {
              status: 'SETTLED',
              txHash: status.transfer.txHash,
            });
            addToast({
              type: 'success',
              title: 'Payment Settled',
              message: `Transfer ${result.transferId.slice(0, 6)}... confirmed on Ethereum`,
            });
            
            // Refresh recipient balance after settlement
            if (recipient && recipient.startsWith('0x') && tokenAddress) {
              // Wait a bit for the transaction to be indexed
              setTimeout(async () => {
                const newBalance = await getTokenBalance(recipient, tokenAddress);
                if (newBalance) {
                  setRecipientBalance(newBalance);
                  console.log('Recipient balance after:', newBalance);
                }
              }, 3000);
            }
          } else if (status.transfer.status === 'FAILED') {
            console.error('❌ Transfer failed:', status.transfer.error);
            setIsGeneratingProof(false);
            setProofGenerated(false);
            updateHistory(result.transferId, { status: 'FAILED' });
            addToast({
              type: 'error',
              title: 'Transfer Failed',
              message: status.transfer.error || 'Relayer reported failure',
            });
            throw new Error(status.transfer.error || 'Transfer failed');
          } else if (status.transfer.status === 'PROOF_VERIFIED') {
            console.log('✅ Proofs verified! Submitting to Ethereum...');
            updateHistory(result.transferId, { status: 'PROOF_VERIFYING' });
            setTimeout(checkStatus, 2000);
          } else if (status.transfer.status === 'PROOF_VERIFYING') {
            console.log('⏳ Verifying proofs...');
            setTimeout(checkStatus, 2000);
          } else {
            console.log(`⏳ Status: ${status.transfer.status}, continuing to poll...`);
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          console.error('❌ Status check failed:', err);
        }
      };

      setTimeout(checkStatus, 2000);
    } catch (err) {
      console.error('❌ Payment flow failed:', err);
      setError((err as Error).message || 'Failed to send payment');
      setIsGeneratingProof(false);
      setProofGenerated(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Toasts */}
      <div className="fixed top-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[220px] px-4 py-3 rounded-xl border backdrop-blur shadow-lg ${
              toast.type === 'success'
                ? 'border-neon-green bg-green-900/20'
                : toast.type === 'error'
                ? 'border-red-500 bg-red-900/20'
                : 'border-neon-cyan bg-black/60'
            }`}
          >
            <p className="text-sm font-semibold mb-1">{toast.title}</p>
            <p className="text-xs text-gray-300">{toast.message}</p>
          </div>
        ))}
      </div>
      {/* Animated background lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ opacity: 0.7 }}>
          <defs>
            <linearGradient id="appLineGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.6;1.2;0.6" dur="4s" begin="0.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" begin="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <linearGradient id="appLineGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.6;1.2;0.6" dur="4s" begin="0.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" begin="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          <g>
            {[100,200,300,400,500,600,700,800,900,1000].map((y, idx) => (
              <line key={`h-${y}`} x1="0" y1={y} x2="1920" y2={y} stroke="url(#appLineGradientH)" strokeWidth="1.5" className="animated-line-h" style={{ animationDelay: `${idx * 0.2}s` }} />
            ))}
          </g>
          <g>
            {[200,400,600,800,1000,1200,1400,1600,1720].map((x, idx) => (
              <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="1080" stroke="url(#appLineGradientV)" strokeWidth="1.5" className="animated-line-v" style={{ animationDelay: `${idx * 0.3}s` }} />
            ))}
          </g>
        </svg>
      </div>

      {/* Floating glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-16 left-12 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-12 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-16 left-1/3 w-80 h-80 bg-neon-green/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
      {/* Header */}
      <header className="backdrop-blur-lg sticky top-0 z-50 bg-black/80 relative px-2">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-neon-cyan" />
              <div>
                <h1 className="text-xl font-bold">ShadowBridge</h1>
                <p className="text-xs text-gray-400">Private Payments. Public Trust.</p>
              </div>
            </div>

            {!walletAddress ? (
              <button 
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold shadow-lg shadow-[#00ff88]/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDisconnectDropdown(!showDisconnectDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg border border-white/10 hover:border-white/30 transition-all backdrop-blur"
                >
                  <div className="text-left">
                    <p className="text-xs text-gray-400 mb-0.5">Connected</p>
                    <p className="text-sm font-mono text-neon-green">
                      {formatAddress(walletAddress)}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neon-green transition-transform ${showDisconnectDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDisconnectDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/80 border border-white/10 rounded-lg shadow-2xl z-50 animate-fade-in backdrop-blur">
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10 mb-1">
                        {formatAddress(walletAddress)}
                      </div>
                      <button
                        onClick={() => {
                          handleDisconnect();
                          setShowDisconnectDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWalletModal(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="relative w-full max-w-md h-full bg-black/90 border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-up backdrop-blur">
            {/* Header */}
            <div className="sticky top-0 bg-black/80 border-b border-white/10 p-4 flex items-center justify-between z-10 backdrop-blur">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-neon-cyan" />
                <h2 className="text-lg font-semibold">Connect Your Wallet</h2>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Network Selection */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">Networks</h3>
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </div>
              <div className="space-y-2">
                {/* Midnight Network */}
                <button
                  onClick={() => setSelectedNetwork('midnight')}
                  className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                    selectedNetwork === 'midnight'
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-900" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Midnight</div>
                      <div className="text-xs text-gray-400">Use Midnight-compatible wallets</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Ethereum Network */}
                <button
                  onClick={() => setSelectedNetwork('ethereum')}
                  className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between ${
                    selectedNetwork === 'ethereum'
                      ? 'border-neon-purple bg-neon-purple/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white rounded-sm"></div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Ethereum</div>
                      <div className="text-xs text-gray-400">Use EVM-compatible wallets</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Wallet Options */}
            <div className="p-4">
              {selectedNetwork === 'midnight' ? (
                <>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Installed</h3>
                  <div className="space-y-2 mb-6">
                    {/* Lace Wallet */}
                    <button
                      onClick={() => connectWallet('lace')}
                      disabled={isConnecting}
                      className="w-full p-4 rounded-lg border border-white/10 hover:border-neon-cyan/50 transition-all flex items-center justify-between bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary-900" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm">Lace</div>
                          <div className="text-xs text-gray-400">Midnight Preview Extension</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg text-sm font-semibold hover:bg-neon-cyan/30 transition-colors">
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    </button>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Not installed</h3>
                  <div className="space-y-2">
                    <div className="w-full p-4 rounded-lg border border-white/10 flex items-center justify-between bg-white/5 opacity-60 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm text-gray-500">Other Midnight Wallets</div>
                          <div className="text-xs text-gray-600">Coming soon</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/10 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                        Install
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Installed</h3>
                  <div className="space-y-2 mb-6">
                    <div className="w-full p-4 rounded-lg border border-white/10 flex items-center justify-between bg-white/5 opacity-60 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">🦊</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm text-gray-500">MetaMask</div>
                          <div className="text-xs text-gray-600">EVM wallet</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/10 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                        Connect
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Not installed</h3>
                  <div className="space-y-2">
                    <div className="w-full p-4 rounded-lg border border-white/10 flex items-center justify-between bg-white/5 opacity-60 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">W</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm text-gray-500">WalletConnect</div>
                          <div className="text-xs text-gray-600">Multi-chain wallet</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/10 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                        Install
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto card p-4 shadow-2xl relative z-10 bg-black/70 border border-white/10 backdrop-blur">
            <h2 className="text-lg font-semibold mb-4 text-gradient text-center uppercase tracking-wide">Send Private Payment</h2>

            <div className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (wUSDC)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-lg font-mono text-center focus:outline-none focus:border-neon-green transition-all hover:border-neon-green/50 backdrop-blur"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limits: $1 - $10,000 per transaction
                  <br />
                  <span className="text-gray-600">Using test wUSDC on Sepolia testnet</span>
                </p>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Recipient Address</label>
                <input 
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-2xl text-white font-mono text-sm focus:outline-none focus:border-neon-cyan transition-all hover:border-neon-cyan/50 backdrop-blur"
                />
                {/* Recipient Balance Display */}
                {recipient && recipient.startsWith('0x') && (
                  <div className="mt-2 p-3 bg-black/40 border border-white/10 rounded-lg balance-change backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-neon-cyan animate-pulse" />
                        <span className="text-xs text-gray-400">Recipient Balance:</span>
                      </div>
                      {recipientBalance ? (
                        <div className="text-right">
                          <div className="text-sm font-mono font-semibold text-neon-green">
                            {parseFloat(recipientBalance.formatted).toFixed(2)} {recipientBalance.symbol}
                          </div>
                          {recipientBalanceBefore && transferStatus === 'SETTLED' && (
                            <div className="text-xs text-neon-green mt-0.5 animate-slide-up font-semibold">
                              +{parseFloat(amount).toFixed(2)} {recipientBalance.symbol}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 animate-pulse">Loading...</div>
                      )}
                    </div>
                    {recipientBalanceBefore && transferStatus === 'SETTLED' && (
                      <div className="mt-2 pt-2 border-t border-neon-green/20 animate-fade-in">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Before:</span>
                          <span className="text-gray-400 font-mono">
                            {parseFloat(recipientBalanceBefore.formatted).toFixed(2)} {recipientBalanceBefore.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">After:</span>
                          <span className="text-neon-green font-mono font-semibold animate-pulse-glow">
                            {recipientBalance ? parseFloat(recipientBalance.formatted).toFixed(2) : '...'} {recipientBalance?.symbol || recipientBalanceBefore.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1 pt-1 border-t border-neon-green/20">
                          <span className="text-neon-green">Change:</span>
                          <span className="text-neon-green font-mono font-semibold animate-pulse-glow">
                            +{parseFloat(amount).toFixed(2)} {recipientBalance?.symbol || recipientBalanceBefore.symbol}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Destination Chain */}
              <div>
                <label className="block text-sm font-medium mb-2">Destination Chain</label>
                <select className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neon-purple transition-all hover:border-neon-purple/50 backdrop-blur">
                  <option>Ethereum (Sepolia)</option>
                  <option>Polygon (Mumbai)</option>
                  <option>Arbitrum (Sepolia)</option>
                </select>
              </div>

              {/* ZK Proof Status */}
              {(isGeneratingProof || proofGenerated) && (
                <div className="card border-2 border-neon-cyan/30 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {proofGenerated ? (
                        <CheckCircle className="w-5 h-5 text-neon-green animate-pulse-glow" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="text-sm text-gray-300">
                        {isGeneratingProof ? 'Generating ZK Proof: KYC Verification...' : '✅ KYC Verified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {proofGenerated ? (
                        <CheckCircle className="w-5 h-5 text-neon-green animate-pulse-glow" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="text-sm text-gray-300">
                        {isGeneratingProof ? 'Generating ZK Proof: Amount Range...' : '✅ Amount Within Limits'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {proofGenerated ? (
                        <CheckCircle className="w-5 h-5 text-neon-green animate-pulse-glow" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="text-sm text-gray-300">
                        {isGeneratingProof ? 'Generating ZK Proof: Sanctions Check...' : '✅ Sanctions Cleared'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/20 border-2 border-red-500 rounded-xl p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Balance Comparison (After Settlement) */}
              {transferStatus === 'SETTLED' && recipientBalanceBefore && recipientBalance && (
                <div className="card border-2 border-neon-green/30 p-4 status-settled animate-fade-in">
                  <h3 className="text-sm font-semibold mb-3 text-gradient flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-neon-cyan" />
                    Balance Comparison
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sender (Midnight) */}
                    <div className="bg-black/40 rounded-lg p-3 border border-neon-purple/30 hover:border-neon-purple/50 transition-all backdrop-blur">
                      <div className="text-xs text-gray-500 mb-1">Sender (Midnight)</div>
                      <div className="text-xs font-mono text-neon-purple mb-2">
                        {formatAddress(walletAddress || '')}
                      </div>
                      <div className="text-sm font-semibold text-neon-yellow animate-pulse-glow">
                        -{parseFloat(amount).toFixed(2)} wUSDC
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Private transfer</div>
                    </div>
                    
                    {/* Recipient (Ethereum) */}
                    <div className="bg-black/40 rounded-lg p-3 border border-neon-green/50 hover:border-neon-green transition-all backdrop-blur">
                      <div className="text-xs text-gray-500 mb-1">Recipient (Ethereum)</div>
                      <div className="text-xs font-mono text-neon-cyan mb-2">
                        {recipient.slice(0, 10)}...{recipient.slice(-8)}
                      </div>
                      <div className="text-sm font-semibold text-neon-green animate-pulse-glow">
                        +{parseFloat(amount).toFixed(2)} wUSDC
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {parseFloat(recipientBalanceBefore.formatted).toFixed(2)} → <span className="text-neon-green font-semibold">{parseFloat(recipientBalance.formatted).toFixed(2)}</span> {recipientBalance.symbol}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fee */}
              <div className="flex justify-between items-center py-4 px-6 bg-black/40 rounded-lg border border-white/10 backdrop-blur">
                <div>
                  <div className="text-sm text-gray-400">Estimated Fee</div>
                  <div className="text-xs text-gray-500 mt-0.5">1.5% of transaction</div>
                </div>
                <div className="text-xl font-bold font-mono">
                  ${amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0.00'}
                  <span className="text-sm text-gray-400 ml-1">wUSDC</span>
                </div>
              </div>

              {/* Submit */}
              {!walletAddress ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="btn-primary w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 relative z-10"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!amount || !recipient || isGeneratingProof}
                className="btn-primary w-full py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 relative z-10"
                >
                  {isGeneratingProof ? (
                    <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Proofs...
                    </>
                  ) : proofGenerated ? (
                    <>
                    <CheckCircle className="w-4 h-4" />
                      Transfer Submitted
                    </>
                  ) : (
                    <>
                    <ArrowRight className="w-4 h-4" />
                      Send Payment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="card p-4 bg-black/70 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Recent Transfers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="text-gray-500">
                    <tr>
                      <th className="py-2">Time</th>
                      <th className="py-2">Recipient</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">No transfers yet</td>
                      </tr>
                    ) : (
                      history.slice(0, 5).map((entry) => (
                        <tr key={entry.id} className="border-t border-white/5">
                          <td className="py-2 text-gray-400">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 font-mono text-xs text-gray-300">
                            {entry.recipient.slice(0, 6)}...{entry.recipient.slice(-4)}
                          </td>
                          <td className="py-2 text-right text-white font-semibold">
                            ${entry.amount.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                                entry.status === 'SETTLED'
                                  ? 'bg-green-500/10 text-neon-green border border-green-500/30'
                                  : entry.status === 'FAILED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                  : 'bg-cyan-500/10 text-neon-cyan border border-cyan-500/30'
                              }`}
                            >
                              {entry.status === 'PROOF_VERIFYING' ? 'VERIFYING' : entry.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

