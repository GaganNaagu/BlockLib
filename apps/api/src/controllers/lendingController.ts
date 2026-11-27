import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider, getReadOnlyLibraryContract } from '../blockchain/libraryClient.js';

const LENDING_STATUS_MAP = ['ACTIVE', 'RETURNED'] as const;
const RESERVATION_STATUS_MAP = ['WAITING', 'ALLOCATED', 'CANCELLED', 'FULFILLED'] as const;

async function ensureContractDeployed(
  contract: NonNullable<ReturnType<typeof getReadOnlyLibraryContract>>,
): Promise<void> {
  const address = await contract.getAddress();
  const code = await getProvider().getCode(address);
  if (code === '0x') {
    throw new AppError(
      503,
      'CONTRACT_NOT_DEPLOYED',
      `Library contract is not deployed at ${address} on the running Hardhat node. Run "npm run deploy:blockchain" and ensure .env matches.`,
    );
  }
}

export async function listLendingRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const walletFilter =
      typeof req.query.wallet === 'string' ? req.query.wallet.trim().toLowerCase() : '';
    const contract = getReadOnlyLibraryContract();
    if (!contract) {
      sendSuccess(res, { records: [] });
      return;
    }
    await ensureContractDeployed(contract);

    const nextLendingId = Number(await contract.nextLendingId());
    const [users, copies] = await Promise.all([
      prisma.user.findMany({ select: { name: true, usn: true, email: true, walletAddress: true } }),
      prisma.bookCopy.findMany({ include: { book: true } }),
    ]);

    const userByWallet = new Map(
      users
        .filter((u) => u.walletAddress)
        .map((u) => [u.walletAddress!.toLowerCase(), u]),
    );
    const copyById = new Map(copies.map((c) => [c.chainCopyId, c]));

    const records = [];
    for (let id = nextLendingId - 1; id >= 1; id--) {
      const r = await contract.getLendingRecord(id);
      const borrower = String(r.borrower);
      if (walletFilter && borrower.toLowerCase() !== walletFilter) continue;

      const copyId = Number(r.copyId);
      const copyInfo = copyById.get(copyId);
      const student = userByWallet.get(borrower.toLowerCase());

      records.push({
        lendingId: Number(r.lendingId),
        copyId,
        bookTitle: copyInfo?.book.title ?? `Copy #${copyId}`,
        chainBookId: copyInfo?.book.chainBookId ?? null,
        borrowerWallet: borrower,
        borrowerName: student?.name ?? 'Unknown Member',
        borrowerUsn: student?.usn ?? null,
        borrowedAt: Number(r.borrowedAt),
        dueAt: Number(r.dueAt),
        returnedAt: Number(r.returnedAt),
        fine: Number(r.fine),
        status: LENDING_STATUS_MAP[Number(r.status)] ?? 'ACTIVE',
      });
    }

    sendSuccess(res, { records });
  } catch (err) {
    next(err);
  }
}

export async function listReservations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const walletFilter =
      typeof req.query.wallet === 'string' ? req.query.wallet.trim().toLowerCase() : '';
    const contract = getReadOnlyLibraryContract();
    if (!contract) {
      sendSuccess(res, { reservations: [] });
      return;
    }
    await ensureContractDeployed(contract);

    const nextReservationId = Number(await contract.nextReservationId());
    const [users, books] = await Promise.all([
      prisma.user.findMany({ select: { name: true, usn: true, walletAddress: true } }),
      prisma.book.findMany(),
    ]);

    const userByWallet = new Map(
      users
        .filter((u) => u.walletAddress)
        .map((u) => [u.walletAddress!.toLowerCase(), u]),
    );
    const bookByChainId = new Map(books.map((b) => [b.chainBookId, b]));

    const reservations = [];
    for (let id = 1; id < nextReservationId; id++) {
      const r = await contract.getReservation(id);
      const member = String(r.member);
      if (walletFilter && member.toLowerCase() !== walletFilter) continue;

      const chainBookId = Number(r.bookId);
      const book = bookByChainId.get(chainBookId);
      const student = userByWallet.get(member.toLowerCase());

      reservations.push({
        reservationId: Number(r.reservationId),
        chainBookId,
        bookTitle: book?.title ?? `Book #${chainBookId}`,
        memberWallet: member,
        memberName: student?.name ?? 'Unknown Member',
        memberUsn: student?.usn ?? null,
        createdAt: Number(r.createdAt),
        status: RESERVATION_STATUS_MAP[Number(r.status)] ?? 'WAITING',
      });
    }

    sendSuccess(res, { reservations });
  } catch (err) {
    next(err);
  }
}
