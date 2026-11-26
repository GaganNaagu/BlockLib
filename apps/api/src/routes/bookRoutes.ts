import { Router } from 'express';
import { Role } from '@prisma/client';
import { addBookCopy, createBook, getBookById, listBooks } from '../controllers/bookController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

export const bookRouter = Router();

bookRouter.get('/', authenticate, listBooks);
bookRouter.get('/:id', authenticate, getBookById);
bookRouter.post('/', authenticate, requireRole(Role.ADMIN), createBook);
bookRouter.post('/:id/copies', authenticate, requireRole(Role.ADMIN), addBookCopy);
