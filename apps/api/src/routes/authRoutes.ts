import { Router } from 'express';
import { Role } from '@prisma/client';
import { getMe, login } from '../controllers/authController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.get('/admin-check', authenticate, requireRole(Role.ADMIN), (_req, res) => {
  sendSuccess(res, { authorized: true, role: Role.ADMIN });
});
