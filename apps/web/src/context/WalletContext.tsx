import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';
import { EXPECTED_CHAIN_ID } from '../blockchain/libraryContract';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isVerified: boolean;
  isConnecting: boolean;
  walletError: string | null;
  connectAndVerify: () => Promise<void>;
  switchToHardhat: () => Promise<void>;
  matchesProfileWallet: boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const isCorrectNetwork = chainId === EXPECTED_CHAIN_ID;
  const matchesProfileWallet = Boolean(
    account &&
      (!user?.walletAddress || account.toLowerCase() === user.walletAddress.toLowerCase()),
  );

  const syncWalletState = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
      const network = await provider.getNetwork();
      setAccount(accounts[0] ?? null);
      setChainId(Number(network.chainId));
    } catch {
      // Ignore passive sync errors
    }
  }, []);

  useEffect(() => {
    void syncWalletState();

    if (!window.ethereum?.on) return;
    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      setAccount(list[0] ?? null);
      setIsVerified(false);
      setWalletError(null);
    };
    const handleChainChanged = (hexChainId: unknown) => {
      if (typeof hexChainId === 'string') {
        setChainId(parseInt(hexChainId, 16));
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [syncWalletState]);

  useEffect(() => {
    setIsVerified(false);
  }, [user?.id]);

  async function switchToHardhat(): Promise<void> {
    if (!window.ethereum) return;
    const hexChainId = `0x${EXPECTED_CHAIN_ID.toString(16)}`;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: 'Hardhat Local',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          },
        ],
      });
    }
    await syncWalletState();
  }

  async function connectAndVerify(): Promise<void> {
    if (!window.ethereum) {
      setWalletError('MetaMask is not detected. Please install MetaMask extension.');
      return;
    }
    if (!token) {
      setWalletError('Sign in to your BlockLib account first.');
      return;
    }

    setWalletError(null);
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const selected = accounts[0];
      if (!selected) {
        throw new Error('No MetaMask account selected.');
      }
      setAccount(selected);

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChain = Number(network.chainId);
      setChainId(currentChain);

      if (currentChain !== EXPECTED_CHAIN_ID) {
        await switchToHardhat();
      }

      if (
        user?.walletAddress &&
        selected.toLowerCase() !== user.walletAddress.toLowerCase()
      ) {
        throw new Error(
          `Wrong MetaMask account selected. Expected ${user.walletAddress}, got ${selected}.`,
        );
      }

      const { message } = await apiRequest<{ nonce: string; message: string }>(
        '/api/auth/wallet-nonce',
        { method: 'GET' },
        token,
      );

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      await apiRequest<{ verified: boolean; walletAddress: string }>(
        '/api/auth/verify-wallet',
        {
          method: 'POST',
          body: JSON.stringify({ walletAddress: selected, signature }),
        },
        token,
      );

      setIsVerified(true);
    } catch (err) {
      setIsVerified(false);
      setWalletError((err as Error).message || 'Wallet connection failed.');
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork,
        isVerified,
        isConnecting,
        walletError,
        connectAndVerify,
        switchToHardhat,
        matchesProfileWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
