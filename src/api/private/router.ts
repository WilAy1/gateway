import express from 'express';
import { authenticate } from './middleware';
import { transactionRouter } from './transaction/router.transaction';
import { customersRouter } from './customers/router';
export const privateRouter = express.Router();

// Apply authentication middleware to all routes in this router
privateRouter.use(authenticate);
privateRouter.use('/transaction', transactionRouter);
privateRouter.use('/customer', customersRouter);