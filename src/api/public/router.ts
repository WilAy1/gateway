import express from 'express';
import { coinsRouter } from './crypto/coins/router';

export const publicRouter = express.Router();

publicRouter.use('/', coinsRouter);