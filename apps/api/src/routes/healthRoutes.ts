import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    sendError(res, 503, 'DATABASE_UNAVAILABLE', 'API is running, but PostgreSQL is unreachable');
  }
});
