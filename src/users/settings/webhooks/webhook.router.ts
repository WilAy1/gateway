import express from 'express';
import { fnCreateWebhookEndpoint, fnDeleteWebhookEndpoint, fnUpdateWebhhokEndpoint } from './webhook.fns';

const webhookRouter = express.Router();

webhookRouter.post('/create', fnCreateWebhookEndpoint);
webhookRouter.patch('/update/:id', fnUpdateWebhhokEndpoint);
webhookRouter.delete('/delete/:id', fnDeleteWebhookEndpoint);

export default webhookRouter;