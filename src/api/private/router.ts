import express from 'express';
import { authenticate } from './middleware';
import { transactionRouter } from './transaction/router.transaction';
import { customersRouter } from './customers/router';
import { disputesRouter } from './disputes/router';
export const privateRouter = express.Router();

// Apply authentication middleware to all routes in this router
privateRouter.use(authenticate);
privateRouter.use('/transaction', transactionRouter);
privateRouter.use('/customer', customersRouter);
privateRouter.use('/disputes', disputesRouter);
//privateRouter.use('/refunds', );