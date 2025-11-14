import express from 'express';
import { coinsRouter } from './coins/router';
import { ratesRouter } from './rates/router';
import { handshakeRouter } from './transactions/handshake';
export const publicRouter = express.Router();

publicRouter.use('/', coinsRouter, ratesRouter, handshakeRouter);