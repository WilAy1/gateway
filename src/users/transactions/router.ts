/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import UserTransactions from '../../db/transactions/user.transactions.db';
import { OrderDirection } from '../../interfaces/db.interface';
import { StatusCodes } from 'http-status-codes';
import { removeKeys } from '../../utils/utils';
import { fnAllTransaction, fnParticularTransaction } from '../../api/private/transaction/create_transaction';

export const userTransactionRouter = express.Router();

userTransactionRouter.get('/all', fnAllTransaction)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function asyncd (req, res){

    const { limit, offset } = req.query;

    
    const { userId } = req["user"];

    const userTransactions = new UserTransactions(userId);

    const transactions = await userTransactions.fetchTransactions({
        cols: [
            "id",
            "type",
            "amount",
            "currency",
            "reference",
            "description",
            "created_at",
            "completed_at",
            "cancelled_at",
            "cancellation_reason",
            "status",
            "payment_method",
            "payment_channel",
            "customer_id",
            "customer_email",
            "customer_metadata",
            "metadata",
            "chain",
            "deposit_address",
            "coin",
            "exchange_rate",
            "onchain_transaction_hash",
            "onchain_status",
            "coin_price_usd",
            "currency_price_usd",
            "amount_to_pay",
            "deposit_received_at",
            "address_generated_at"
        ],
        conditions: {
            compulsory: [
                {
                    key: "issuer_id",
                    value: "54c91f1c-9ae9-45aa-9825-c16800f7881f"
                }
            ],
            limit: limit ? parseInt(limit as string) : 100,
            offset: offset ? parseInt(offset as string) : 0,
            orderBy: ["created_at"],
            orderDir: OrderDirection.DESCENDING
        }
    });




    return res.status(200).json(transactions);
}



userTransactionRouter.get("/fetch", fnParticularTransaction);
// userTransactionRouter.get("/fetch:id", async (req, res) => {
//     const { id } = req.params;

//     if(!id){
//         return res.status(StatusCodes.BAD_REQUEST).json({
//             error: "Invalid transaction ID"
//         });
//     }

//     try {
//         const { userId } = req["user"];

//         const userTransactions = new UserTransactions(userId);
//         const transaction = await userTransactions.fetchTransaction(id);

//         if(!transaction){
//             return;
//         }

//         const serializedTransactions = removeKeys(transaction, ["issuer_id", "application_fee", "fees_denomination", "device_type", "useragent", "ipaddress", "callback_url"])

//         return res.status(StatusCodes.OK).json(serializedTransactions);
//     }
//     catch (error){
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//             error: "Server error"
//         });
//     }
// })


//customers, transactions