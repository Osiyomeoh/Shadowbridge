import type { Wallet } from '@midnight-ntwrk/wallet-api';

let wallet: Wallet | null = null;
let laceAPI: any = null;

// Helper to get address from Lace API if it doesn't follow Wallet API
async function getAddressFromLaceAPI(laceEnabled: any): Promise<string> {
  console.log('Getting address from Lace API:', laceEnabled);
  
  // Try different methods to get address
  if (laceEnabled.getAddress) {
    const address = await laceEnabled.getAddress();
    return address;
  } else if (laceEnabled.getAccounts) {
    const accounts = await laceEnabled.getAccounts();
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
  } else if (laceEnabled.address) {
    return laceEnabled.address;
  } else if (laceEnabled.account) {
    return laceEnabled.account.address || laceEnabled.account;
  } else if (laceEnabled.selectedAddress) {
    return laceEnabled.selectedAddress;
  }
  
  throw new Error('Could not extract address from Lace API');
}

// Wait for Lace wallet to be injected
async function waitForLace(maxWait = 10000): Promise<any> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const laceWindow = window as any;
    
    // Try different possible injection points
    if (laceWindow.lace) {
      console.log('Found window.lace');
      return laceWindow.lace;
    }
    
    // Sometimes it's under cardano namespace
    if (laceWindow.cardano?.lace) {
      console.log('Found window.cardano.lace');
      return laceWindow.cardano.lace;
    }
    
    // Check for Midnight-specific injection
    if (laceWindow.midnight) {
      console.log('Found window.midnight! Properties:', Object.keys(laceWindow.midnight));
      
      // Lace Midnight uses mnLace property
      if (laceWindow.midnight.mnLace) {
        console.log('Found window.midnight.mnLace');
        return laceWindow.midnight.mnLace;
      }
      
      // Check if midnight itself is the wallet or has wallet/lace properties
      if (laceWindow.midnight.lace) {
        console.log('Found window.midnight.lace');
        return laceWindow.midnight.lace;
      }
      
      // Maybe midnight itself is the wallet interface?
      if (typeof laceWindow.midnight === 'object' && ('state' in laceWindow.midnight || 'getWallet' in laceWindow.midnight)) {
        console.log('Using window.midnight directly');
        return laceWindow.midnight;
      }
      
      // Check for wallet property
      if (laceWindow.midnight.wallet) {
        console.log('Found window.midnight.wallet');
        return laceWindow.midnight.wallet;
      }
    }
    
    // Check all top-level properties that might be Lace
    for (const key of Object.keys(laceWindow)) {
      if (key.toLowerCase().includes('lace') && typeof laceWindow[key] === 'object') {
        console.log(`Found potential Lace at window.${key}`);
        return laceWindow[key];
      }
    }
    
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return null;
}

export async function connectLaceWallet(): Promise<string> {
  try {
    // Check if Lace wallet is available
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    console.log('Waiting for Lace wallet to be injected...');
    
    // Wait for Lace to be available (extensions inject asynchronously)
    // Unpacked extensions may take longer to inject
    const lace = await waitForLace(10000);
    
    if (!lace) {
      console.error('Lace wallet not found after waiting. Checking window properties...');
      const laceWindow = window as any;
      console.log('Has window.lace:', !!laceWindow.lace);
      console.log('Has window.cardano:', !!laceWindow.cardano);
      console.log('Has window.midnight:', !!laceWindow.midnight);
      
      // Inspect window.midnight in detail
      if (laceWindow.midnight) {
        console.log('window.midnight type:', typeof laceWindow.midnight);
        console.log('window.midnight keys:', Object.keys(laceWindow.midnight));
        console.log('window.midnight value:', laceWindow.midnight);
        
        // Check if it has common wallet methods
        const hasState = 'state' in laceWindow.midnight;
        const hasGetWallet = 'getWallet' in laceWindow.midnight;
        const hasWallet = 'wallet' in laceWindow.midnight;
        const hasEnable = 'enable' in laceWindow.midnight;
        console.log('window.midnight has state:', hasState);
        console.log('window.midnight has getWallet:', hasGetWallet);
        console.log('window.midnight has wallet:', hasWallet);
        console.log('window.midnight has enable:', hasEnable);
      }
      
      // Log all properties that might be relevant
      const relevantKeys = Object.keys(laceWindow).filter(key => 
        key.toLowerCase().includes('lace') || 
        key.toLowerCase().includes('midnight') ||
        key.toLowerCase().includes('cardano') ||
        key.toLowerCase().includes('wallet')
      );
      console.log('Relevant window properties:', relevantKeys);
      
      if (laceWindow.cardano) {
        console.log('window.cardano keys:', Object.keys(laceWindow.cardano));
      }
      
      // Try to find any object that might be a wallet
      console.log('All window properties (first 50):', Object.keys(laceWindow).slice(0, 50));
      
      throw new Error(
        'Lace wallet not found. Please ensure:\n' +
        '1. Lace Midnight Preview extension is installed and enabled\n' +
        '2. Extension is unlocked (not password-protected)\n' +
        '3. Refresh this page completely (Ctrl+Shift+R or Cmd+Shift+R)\n' +
        '4. Check the browser console for more details'
      );
    }

    console.log('Lace found! Type:', typeof lace);
    console.log('Lace found! Available methods:', Object.keys(lace));
    console.log('Lace object:', lace);

    // Try different ways to get the wallet
    if (lace.wallet) {
      console.log('Using lace.wallet');
      wallet = lace.wallet;
    } else if (lace.getWallet) {
      console.log('Using lace.getWallet()');
      wallet = await lace.getWallet();
    } else if (typeof lace === 'object' && 'state' in lace) {
      // Maybe lace itself is the wallet?
      console.log('Using lace directly as wallet (has state method)');
      wallet = lace as Wallet;
    } else if (lace.enable) {
      // Some wallet APIs use enable() pattern
      console.log('Using lace.enable() pattern');
      try {
        const enabled = await lace.enable();
        console.log('enable() returned:', enabled);
        console.log('enable() returned type:', typeof enabled);
        console.log('enable() returned keys:', enabled ? Object.keys(enabled) : 'null');
        
        // Store enabled API
        laceAPI = enabled;
        
        // Check if enabled has state method
        if (enabled && 'state' in enabled) {
          console.log('enabled has state method, calling it...');
          try {
            const stateResult = enabled.state();
            console.log('state() returned:', stateResult);
            console.log('state() returned type:', typeof stateResult);
            
            // Check if it's a Promise
            if (stateResult && typeof stateResult.then === 'function') {
              console.log('state() returns Promise - awaiting it...');
              const state = await stateResult;
              console.log('state Promise resolved:', state);
              console.log('state keys:', Object.keys(state));
              
              // Extract address from state
              if (state && state.address) {
                console.log('Found address in state:', state.address);
                return state.address;
              } else if (state && state.coinPublicKey) {
                // Midnight uses coinPublicKey, might need to convert to address
                console.log('Found coinPublicKey in state:', state.coinPublicKey);
                // For now, return the coinPublicKey as address (or convert if needed)
                return typeof state.coinPublicKey === 'string' 
                  ? state.coinPublicKey 
                  : Array.from(state.coinPublicKey).map(b => b.toString(16).padStart(2, '0')).join('');
              } else {
                console.log('State object:', state);
                throw new Error('No address or coinPublicKey found in state');
              }
            } else if (stateResult && typeof stateResult.subscribe === 'function') {
              console.log('state() returns Observable - using as Wallet');
              wallet = enabled as Wallet;
            } else {
              console.log('state() returns unexpected type - using Lace API directly');
              // Get address directly from Lace API
              return await getAddressFromLaceAPI(enabled);
            }
          } catch (stateError) {
            console.log('Error calling state():', stateError);
            // Get address directly from Lace API
            return await getAddressFromLaceAPI(enabled);
          }
        } else if (enabled && enabled.wallet) {
          console.log('Found enabled.wallet');
          wallet = enabled.wallet;
        } else if (enabled && enabled.getWallet) {
          console.log('enabled has getWallet method');
          wallet = await enabled.getWallet();
        } else if (enabled) {
          // Try to get address directly from Lace API
          console.log('Trying to get address directly from Lace API');
          return await getAddressFromLaceAPI(enabled);
        }
      } catch (enableError) {
        console.error('Error calling enable():', enableError);
        throw enableError;
      }
    } else if (typeof lace === 'function') {
      // Maybe it's a function that returns the wallet?
      console.log('Lace is a function, calling it...');
      const result = await lace();
      if (result && 'state' in result) {
        wallet = result as Wallet;
      } else if (result && result.wallet) {
        wallet = result.wallet;
      }
    } else {
      console.error('Lace API structure:', lace);
      console.error('Lace prototype:', Object.getPrototypeOf(lace));
      throw new Error(
        'Lace wallet API not available. Found mnLace but cannot access wallet methods. Please check the console for details.'
      );
    }

    // Get wallet address - try Wallet API first, then Lace API
    if (wallet && 'state' in wallet) {
      console.log('Using Wallet API state() method');
      // Get wallet state to extract address
      const state = await new Promise<any>((resolve, reject) => {
        const subscription = wallet!.state().subscribe({
          next: (state) => {
            subscription.unsubscribe();
            resolve(state);
          },
          error: reject,
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          reject(new Error('Timeout waiting for wallet state'));
        }, 5000);
      });

      // Extract address from wallet state
      const address = state.address;
      if (!address) {
        throw new Error('No address found in wallet state');
      }

      return address;
    } else if (laceAPI) {
      console.log('Using Lace API directly');
      return await getAddressFromLaceAPI(laceAPI);
    } else {
      throw new Error('Wallet not properly initialized');
    }
  } catch (error) {
    throw new Error(
      `Failed to connect to Lace wallet: ${(error as Error).message}`
    );
  }
}

export function getWallet(): Wallet | null {
  return wallet;
}

export function disconnectWallet() {
  console.log('Disconnecting wallet...');
  wallet = null;
  laceAPI = null;
}

export function getLaceAPI() {
  return laceAPI;
}

export async function getWalletAddress(): Promise<string | null> {
  if (!wallet) {
    return null;
  }

  try {
    const state = await new Promise<any>((resolve, reject) => {
      const subscription = wallet!.state().subscribe({
        next: (state) => {
          subscription.unsubscribe();
          resolve(state);
        },
        error: reject,
      });
      
      setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error('Timeout'));
      }, 5000);
    });

    return state.address || null;
  } catch (error) {
    console.error('Failed to get wallet address:', error);
    return null;
  }
}

