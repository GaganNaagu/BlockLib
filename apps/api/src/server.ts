import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/healthRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { bookRouter } from './routes/bookRoutes.js';
import { memberRouter } from './routes/memberRoutes.js';
import { transactionRouter } from './routes/transactionRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { lendingRouter } from './routes/lendingRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startEventIndexer } from './blockchain/eventIndexer.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/members', memberRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', lendingRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`BlockLib API listening on http://localhost:${env.port}`);
  startEventIndexer();
});
