import type { NextFunction, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  fetchOnChainBookCopy,
  fetchOnChainMember,
  getReadOnlyLibraryContract,
} from '../blockchain/libraryClient.js';

export async function getAdminDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const [totalBooks, copies, totalMembers, recentTransactions] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.findMany({ select: { chainCopyId: true } }),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.blockchainTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const copyStates = await Promise.all(
      copies.map((c) => fetchOnChainBookCopy(c.chainCopyId)),
    );

    const availableCopies = copyStates.filter((c) => c?.status === 'AVAILABLE').length;
    const borrowedCopies = copyStates.filter((c) => c?.status === 'BORROWED').length;
    const reservedCopies = copyStates.filter((c) => c?.status === 'RESERVED').length;

    sendSuccess(res, {
      stats: {
        totalBooks,
        totalCopies: copies.length,
        totalMembers,
        availableCopies,
        borrowedCopies,
        reservedCopies,
      },
      recentTransactions,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentDashboard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        usn: true,
        email: true,
        walletAddress: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Student not found');
    }

    const onChainMember = user.walletAddress
      ? await fetchOnChainMember(user.walletAddress)
      : null;

    let activeLoans = 0;
    let outstandingFine = 0;
    let activeReservations = 0;

    if (onChainMember) {
      activeLoans = onChainMember.activeLoanCount;
      outstandingFine = onChainMember.outstandingFine;
    }

    const contract = getReadOnlyLibraryContract();
    if (contract && user.walletAddress) {
      try {
        const resIds = (await contract.getMemberReservations(user.walletAddress)) as bigint[];
        for (const id of resIds) {
          const r = await contract.getReservation(id);
          // 0 = WAITING, 1 = ALLOCATED
          if (Number(r.status) === 0 || Number(r.status) === 1) {
            activeReservations += 1;
          }
        }
      } catch {
        activeReservations = 0;
      }
    }

    sendSuccess(res, {
      student: user,
      stats: {
        activeLoans,
        outstandingFine,
        activeReservations,
        registeredOnChain: onChainMember?.registered ?? false,
        activeOnChain: onChainMember?.active ?? false,
      },
    });
  } catch (err) {
    next(err);
  }
}
