import express from 'express';
import { fnCreateRefund, fnFetchAllRefunds, fnFetchRefund, fnUpdateRefund } from './refunds';

export const refundsRouter = express.Router();

refundsRouter.get('/fetch/:id', fnFetchRefund);
refundsRouter.get('/all', fnFetchAllRefunds);
refundsRouter.post('create', fnCreateRefund);
refundsRouter.patch('/update/:id', fnUpdateRefund)