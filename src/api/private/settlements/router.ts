import express from 'express';

export const settlementRouter = express.Router();


settlementRouter.post('/add', fnAddSettlement);
settlementRouter.get('/fetch', fnFetchSettlements);
settlementRouter.patch('/update:id', fnUpdateSettlement);