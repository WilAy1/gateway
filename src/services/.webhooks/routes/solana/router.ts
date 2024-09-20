import express from 'express';
import { SolanaTransactions } from '../../../../db/transactions/transactions.db';

export const solanaWebhookRouter = express.Router();

solanaWebhookRouter.post('/solana/helius-transfer', async (req, res) => {

    res.status(200).send('Transaction processed');


    const payload = req.body;

    const transaction = new SolanaTransactions();
    await transaction.parse(payload);


    // parse payload
    // get deposit address
    // get current balance
    // compare with expected amount
    // 

    return
});

