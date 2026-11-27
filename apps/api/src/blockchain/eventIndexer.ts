import { Prisma, TxStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { prisma } from '../config/prisma.js';
import { getProvider, getReadOnlyLibraryContract } from './libraryClient.js';

function serializeArgs(args: ethers.Result): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  args.forEach((value, idx) => {
    const key = String(idx);
    obj[key] = typeof value === 'bigint' ? value.toString() : value;
  });
  return obj;
}

function extractEntityId(eventName: string, parsedArgs: ethers.Result): string | null {
  try {
    if (parsedArgs.length > 0) {
      const first = parsedArgs[0];
      return typeof first === 'bigint' ? first.toString() : String(first);
    }
  } catch {
    return null;
  }
  return eventName;
}

async function syncMetadataFromEvent(eventName: string, parsedArgs: ethers.Result): Promise<void> {
  if (eventName === 'BookRegistered') {
    const chainBookId = Number(parsedArgs[0]);
    const title = String(parsedArgs[1]);
    const author = String(parsedArgs[2]);
    const isbn = String(parsedArgs[3]);

    await prisma.book.upsert({
      where: { chainBookId },
      update: { title, author, isbn },
      create: {
        chainBookId,
        title,
        author,
        isbn,
        category: 'General',
      },
    });
  } else if (eventName === 'BookCopyRegistered') {
    const chainCopyId = Number(parsedArgs[0]);
    const chainBookId = Number(parsedArgs[1]);

    const book = await prisma.book.findUnique({ where: { chainBookId } });
    if (book) {
      await prisma.bookCopy.upsert({
        where: { chainCopyId },
        update: {},
        create: {
          chainCopyId,
          bookId: book.id,
        },
      });
    }
  }
}

export async function indexEventLog(
  contract: ethers.Contract,
  log: ethers.Log,
): Promise<boolean> {
  const provider = getProvider();
  const parsed = contract.interface.parseLog({
    topics: [...log.topics],
    data: log.data,
  });

  if (!parsed) return false;

  const receipt = await provider.getTransactionReceipt(log.transactionHash);
  if (!receipt) return false;

  // Never index reverted/failed transactions as successful business operations
  if (receipt.status !== 1) {
    await prisma.blockchainTransaction.upsert({
      where: { txHash: log.transactionHash },
      update: {
        status: TxStatus.FAILED,
        blockNumber: receipt.blockNumber,
      },
      create: {
        txHash: log.transactionHash,
        blockNumber: receipt.blockNumber,
        fromAddress: receipt.from,
        eventType: parsed.name,
        status: TxStatus.FAILED,
      },
    });
    return false;
  }

  const block = await provider.getBlock(log.blockNumber);
  const blockTimestamp = block ? new Date(Number(block.timestamp) * 1000) : new Date();
  const payload = serializeArgs(parsed.args) as Prisma.InputJsonValue;
  const entityId = extractEntityId(parsed.name, parsed.args);

  await prisma.blockchainTransaction.upsert({
    where: { txHash: log.transactionHash },
    update: {
      status: TxStatus.CONFIRMED,
      blockNumber: receipt.blockNumber,
      fromAddress: receipt.from,
      eventType: parsed.name,
    },
    create: {
      txHash: log.transactionHash,
      blockNumber: receipt.blockNumber,
      fromAddress: receipt.from,
      eventType: parsed.name,
      status: TxStatus.CONFIRMED,
    },
  });

  // Idempotent on (txHash, logIndex)
  await prisma.blockchainEvent.upsert({
    where: {
      txHash_logIndex: {
        txHash: log.transactionHash,
        logIndex: log.index,
      },
    },
    update: {},
    create: {
      txHash: log.transactionHash,
      logIndex: log.index,
      eventName: parsed.name,
      entityId,
      blockNumber: log.blockNumber,
      blockTimestamp,
      payload,
    },
  });

  await syncMetadataFromEvent(parsed.name, parsed.args);
  return true;
}

export async function syncPastEvents(fromBlock = 0): Promise<{ indexed: number; reachable: boolean }> {
  const contract = getReadOnlyLibraryContract();
  if (!contract) {
    return { indexed: 0, reachable: false };
  }

  try {
    const provider = getProvider();
    const latestBlock = await provider.getBlockNumber();
    const address = await contract.getAddress();
    const logs = await provider.getLogs({
      address,
      fromBlock,
      toBlock: latestBlock,
    });

    let indexed = 0;
    for (const log of logs) {
      const ok = await indexEventLog(contract, log);
      if (ok) indexed += 1;
    }

    return { indexed, reachable: true };
  } catch (err) {
    console.warn('Blockchain sync skipped (local node may be offline):', (err as Error).message);
    return { indexed: 0, reachable: false };
  }
}

let indexerStarted = false;
let lastSyncedBlock = 0;
let isSyncing = false;

export function startEventIndexer(): void {
  if (indexerStarted) return;
  const contract = getReadOnlyLibraryContract();
  if (!contract) {
    console.warn('Event indexer waiting: Library contract address/ABI not configured yet.');
    return;
  }

  indexerStarted = true;

  const poll = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const provider = getProvider();
      const latestBlock = await provider.getBlockNumber();
      if (latestBlock < lastSyncedBlock) {
        // Hardhat local chain was restarted
        lastSyncedBlock = 0;
      }
      if (latestBlock >= lastSyncedBlock) {
        const result = await syncPastEvents(lastSyncedBlock);
        if (result.reachable) {
          lastSyncedBlock = latestBlock + 1;
        }
      }
    } catch {
      // Hardhat node may be offline; retry on next poll
    } finally {
      isSyncing = false;
    }
  };

  void poll();
  setInterval(() => {
    void poll();
  }, 4000);

  console.log('Blockchain event indexer initialized (getLogs polling).');
}
