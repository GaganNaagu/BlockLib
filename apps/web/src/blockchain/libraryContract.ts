import { BrowserProvider, Contract } from 'ethers';
import libraryAbi from './libraryAbi.json';

export const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID ?? 31337);
export const LIBRARY_CONTRACT_ADDRESS = import.meta.env.VITE_LIBRARY_CONTRACT_ADDRESS ?? '';

export async function getSignerLibraryContract(): Promise<Contract> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }
  if (!LIBRARY_CONTRACT_ADDRESS) {
    throw new Error(
      'VITE_LIBRARY_CONTRACT_ADDRESS is not set in .env. Deploy Library.sol and update .env.',
    );
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(LIBRARY_CONTRACT_ADDRESS, libraryAbi, signer);
}

export function extractEthersError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { reason?: string; shortMessage?: string; message?: string; code?: string };
    if (e.code === 'ACTION_REJECTED') {
      return 'Transaction was rejected in MetaMask.';
    }
    if (e.reason) return e.reason;
    if (e.shortMessage) return e.shortMessage;
    if (e.message) return e.message;
  }
  return 'Blockchain transaction failed.';
}

export function shortenAddress(address?: string | null): string {
  if (!address) return 'Not linked';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
