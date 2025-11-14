import express from 'express';
import { fnAddSettlement, fnFetchSettlements, fnUpdateSettlement } from './fn';

export const settlementRouter = express.Router();


settlementRouter.post('/add', fnAddSettlement);
settlementRouter.get('/fetch', fnFetchSettlements);
settlementRouter.patch('/update/:id', fnUpdateSettlement);