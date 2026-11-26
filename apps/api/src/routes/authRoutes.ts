import { Router } from 'express';
import { Role } from '@prisma/client';
import { getMe, getWalletNonce, login, verifyWallet } from '../controllers/authController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.get('/wallet-nonce', authenticate, getWalletNonce);
authRouter.post('/verify-wallet', authenticate, verifyWallet);
authRouter.get('/admin-check', authenticate, requireRole(Role.ADMIN), (_req, res) => {
  sendSuccess(res, { authorized: true, role: Role.ADMIN });
});
