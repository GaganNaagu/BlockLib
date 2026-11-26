import { Router } from 'express';
import {
  getTransactionByHash,
  listTransactions,
  triggerSync,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const transactionRouter = Router();

transactionRouter.get('/', authenticate, listTransactions);
transactionRouter.post('/sync', authenticate, triggerSync);
transactionRouter.get('/:hash', authenticate, getTransactionByHash);
