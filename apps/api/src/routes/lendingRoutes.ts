import { Router } from 'express';
import { listLendingRecords, listReservations } from '../controllers/lendingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const lendingRouter = Router();

lendingRouter.get('/lending', authenticate, listLendingRecords);
lendingRouter.get('/reservations', authenticate, listReservations);
