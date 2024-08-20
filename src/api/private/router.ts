import express from 'express';
import { authenticate } from './middleware';
import { transactionRouter } from './transaction/router.transaction';
export const privateRouter = express.Router();

// Apply authentication middleware to all routes in this router
privateRouter.use(authenticate);
privateRouter.use('/transaction', transactionRouter);
