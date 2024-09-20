import express from 'express';
import { solanaWebhookRouter } from './solana/router';

export const webhookRouter = express.Router();

webhookRouter.use(solanaWebhookRouter);