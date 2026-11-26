import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../blockchain/libraryClient.js';
import { syncPastEvents } from '../blockchain/eventIndexer.js';

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const wallet = typeof req.query.wallet === 'string' ? req.query.wallet.trim() : '';
    const eventType = typeof req.query.eventType === 'string' ? req.query.eventType.trim() : '';

    const transactions = await prisma.blockchainTransaction.findMany({
      where: {
        ...(wallet ? { fromAddress: { equals: wallet, mode: 'insensitive' } } : {}),
        ...(eventType ? { eventType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const events = await prisma.blockchainEvent.findMany({
      where: {
        ...(eventType ? { eventName: eventType } : {}),
      },
      orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }],
      take: 100,
    });

    sendSuccess(res, { transactions, events });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionByHash(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const hash = String(req.params.hash);

    const transaction = await prisma.blockchainTransaction.findUnique({
      where: { txHash: hash },
    });

    const events = await prisma.blockchainEvent.findMany({
      where: { txHash: hash },
      orderBy: { logIndex: 'asc' },
    });

    let onChainReceipt: { blockNumber: number; status: number | null; from: string } | null = null;
    try {
      const receipt = await getProvider().getTransactionReceipt(hash);
      if (receipt) {
        onChainReceipt = {
          blockNumber: receipt.blockNumber,
          status: receipt.status,
          from: receipt.from,
        };
      }
    } catch {
      onChainReceipt = null;
    }

    if (!transaction && events.length === 0 && !onChainReceipt) {
      throw new AppError(404, 'TX_NOT_FOUND', 'Transaction not found');
    }

    sendSuccess(res, { transaction, events, onChainReceipt });
  } catch (err) {
    next(err);
  }
}

export async function triggerSync(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await syncPastEvents(0);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
