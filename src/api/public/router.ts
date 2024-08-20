import express from 'express';
import { coinsRouter } from './crypto/coins/router';
import { ratesRouter } from './rates/router';

export const publicRouter = express.Router();

publicRouter.use('/', coinsRouter, ratesRouter);