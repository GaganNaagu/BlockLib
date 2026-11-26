import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwtSecret,
      { expiresIn: '12h' },
    );

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        usn: user.usn,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
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
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

const verifyWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid Ethereum address required'),
  signature: z.string().min(1, 'Signature is required'),
});

export async function getWalletNonce(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { walletNonce: nonce },
    });

    const message = `BlockLib wallet verification nonce: ${nonce}`;
    sendSuccess(res, { nonce, message });
  } catch (err) {
    next(err);
  }
}

export async function verifyWallet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { walletAddress, signature } = verifyWalletSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user || !user.walletNonce) {
      throw new AppError(400, 'MISSING_NONCE', 'Request a wallet verification nonce first');
    }

    const message = `BlockLib wallet verification nonce: ${user.walletNonce}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new AppError(401, 'SIGNATURE_MISMATCH', 'Wallet signature does not match address');
    }

    if (
      user.walletAddress &&
      user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      throw new AppError(
        403,
        'WALLET_MISMATCH',
        `Connected wallet does not match your registered profile wallet (${user.walletAddress})`,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletNonce: null,
        walletAddress: user.walletAddress ?? ethers.getAddress(walletAddress),
      },
    });

    sendSuccess(res, {
      verified: true,
      walletAddress: user.walletAddress ?? ethers.getAddress(walletAddress),
    });
  } catch (err) {
    next(err);
  }
}
