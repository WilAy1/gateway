import express from 'express';
import { tokenRouter } from './token.router';
import webhookRouter from './webhooks/webhook.router';

export const settingsRouter = express.Router();

settingsRouter.use('/tokens', tokenRouter);
settingsRouter.use('/webhook', webhookRouter);