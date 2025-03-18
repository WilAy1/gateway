import express from 'express';
import { tokenRouter } from './token.router';

export const settingsRouter = express.Router();

settingsRouter.use('/tokens', tokenRouter);