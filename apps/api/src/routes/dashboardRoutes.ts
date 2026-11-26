import { Router } from 'express';
import { Role } from '@prisma/client';
import { getAdminDashboard, getStudentDashboard } from '../controllers/dashboardController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

export const dashboardRouter = Router();

dashboardRouter.get('/admin', authenticate, requireRole(Role.ADMIN), getAdminDashboard);
dashboardRouter.get('/student', authenticate, requireRole(Role.STUDENT), getStudentDashboard);
