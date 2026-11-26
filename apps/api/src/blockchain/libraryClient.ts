import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'ethers';
import { env } from '../config/env.js';

interface DeploymentArtifact {
  address?: string;
  abi: ethers.InterfaceAbi;
}

const DEPLOYMENT_PATH = path.resolve(
  process.cwd(),
  '../../apps/blockchain/deployments/Library.json',
);
const ARTIFACT_PATH = path.resolve(
  process.cwd(),
  '../../apps/blockchain/artifacts/contracts/Library.sol/Library.json',
);

let cachedProvider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(env.blockchainRpcUrl);
  }
  return cachedProvider;
}

export function loadLibraryConfig(): { address: string; abi: ethers.InterfaceAbi } | null {
  let address = env.libraryContractAddress;
  let abi: ethers.InterfaceAbi | null = null;

  if (fs.existsSync(DEPLOYMENT_PATH)) {
    const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, 'utf8')) as DeploymentArtifact;
    if (!address && deployment.address) {
      address = deployment.address;
    }
    if (deployment.abi) {
      abi = deployment.abi;
    }
  }

  if (!abi && fs.existsSync(ARTIFACT_PATH)) {
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8')) as DeploymentArtifact;
    abi = artifact.abi;
  }

  if (!address || !abi) {
    return null;
  }

  return { address, abi };
}

export function getReadOnlyLibraryContract(): ethers.Contract | null {
  const config = loadLibraryConfig();
  if (!config) {
    return null;
  }
  return new ethers.Contract(config.address, config.abi, getProvider());
}

export interface OnChainBookCopy {
  copyId: number;
  bookId: number;
  status: 'AVAILABLE' | 'BORROWED' | 'RESERVED';
  reservedFor: string;
}

const COPY_STATUS_MAP = ['AVAILABLE', 'BORROWED', 'RESERVED'] as const;

export async function fetchOnChainBookCopy(copyId: number): Promise<OnChainBookCopy | null> {
  const contract = getReadOnlyLibraryContract();
  if (!contract) return null;

  try {
    const raw = await contract.getBookCopy(copyId);
    const statusIdx = Number(raw.status);
    return {
      copyId: Number(raw.copyId),
      bookId: Number(raw.bookId),
      status: COPY_STATUS_MAP[statusIdx] ?? 'AVAILABLE',
      reservedFor: String(raw.reservedFor),
    };
  } catch {
    return null;
  }
}

export async function fetchOnChainMember(walletAddress: string) {
  const contract = getReadOnlyLibraryContract();
  if (!contract) return null;

  try {
    const raw = await contract.getMember(walletAddress);
    return {
      registered: Boolean(raw.registered),
      active: Boolean(raw.active),
      outstandingFine: Number(raw.outstandingFine),
      activeLoanCount: Number(raw.activeLoanCount),
    };
  } catch {
    return null;
  }
}
