import { Router } from 'express';
import { Role } from '@prisma/client';
import { createMember, getMemberById, listMembers } from '../controllers/memberController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

export const memberRouter = Router();

memberRouter.get('/', authenticate, requireRole(Role.ADMIN), listMembers);
memberRouter.post('/', authenticate, requireRole(Role.ADMIN), createMember);
memberRouter.get('/:id', authenticate, getMemberById);
