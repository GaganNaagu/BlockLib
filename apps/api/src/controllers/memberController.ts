import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { fetchOnChainMember } from '../blockchain/libraryClient.js';

const createMemberSchema = z.object({
  name: z.string().min(1),
  usn: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).default('Student@123'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid Ethereum address required'),
});

export async function listMembers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        usn: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const members = await Promise.all(
      users.map(async (u) => {
        const onChain = u.walletAddress ? await fetchOnChainMember(u.walletAddress) : null;
        return {
          ...u,
          onChain: onChain ?? {
            registered: false,
            active: false,
            outstandingFine: 0,
            activeLoanCount: 0,
          },
        };
      }),
    );

    sendSuccess(res, { members });
  } catch (err) {
    next(err);
  }
}

export async function createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = createMemberSchema.parse(req.body);
    const normalizedEmail = payload.email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { usn: payload.usn.trim() },
          { walletAddress: payload.walletAddress },
        ],
      },
    });

    if (existing) {
      throw new AppError(409, 'MEMBER_EXISTS', 'A member with this email, USN, or wallet already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const member = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        usn: payload.usn.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
        walletAddress: payload.walletAddress,
      },
      select: {
        id: true,
        name: true,
        usn: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    sendSuccess(res, { member }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMemberById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const id = String(req.params.id);
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot view another member profile');
    }

    const member = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        usn: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!member) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found');
    }

    const onChain = member.walletAddress ? await fetchOnChainMember(member.walletAddress) : null;
    sendSuccess(res, { member: { ...member, onChain } });
  } catch (err) {
    next(err);
  }
}
