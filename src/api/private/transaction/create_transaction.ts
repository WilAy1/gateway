/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getDepositAddress, generatePaymentUrl, fetchTransaction } from './generate_payment_url';
import { TransactionStatus } from '../../../interfaces/TransactionStatus';

export const createTransactionRouter = express.Router();


// createTransactionRouter.post('/complete', async (req, res) => {
//     const issuer = req['user'];
//     const tDB = new TransactionDB(issuer["userId"]);
//     const { transaction_id } = req.body;
//     tDB.confirmTransaction(transaction_id);

//     return res.status(StatusCodes.OK).json({});
// })


createTransactionRouter.get('/fetch', async (req, res) => {
    try {
        const issuer = req['user'];

        const transaction_params = req.query;

        const response = await fetchTransaction(issuer, transaction_params);

        if(!response.status) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: response.error,
                message: response.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: response.result
        })
        
    }
    catch(error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });    
    }
})


createTransactionRouter.post('/create', async (req, res) => {
    try {
        const issuer = req["user"];
        //const issuerId = issuer.userId;

        const transaction_params = parsePlatformCreateTransaction(req);
        
        const response = await generatePaymentUrl(issuer, transaction_params);
        if(!response.status){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: response.error,
                message: response.message
            })
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: {
                payment_url: response.payment_url,
                id: response.id,
                reference: response.reference
            }
        })
    }
    catch(error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" }); 
    }
});

createTransactionRouter.post('/generate-address', async (req, res) => {
    try {
        const issuer = req["user"];

        const params = req.body;

        const response = await getDepositAddress(issuer, params);

        if(response.status == false) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: response.error, message: response.message });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: response.result
        })

        

    }
    catch {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: "Internal Server Error"});
    }
})

function parsePlatformCreateTransaction(req: Request) : InitTransactionParams {
    const { amount, currency, customer, metadata = {}, callback_url = null, description = null } = req.body;
    
    return {
        amount: amount,
        currency: currency,
        customer: customer,
        metadata: metadata,
        callback_url: callback_url,
        description: description
    }
}



export interface InitTransactionParams {
    amount: number, 
    currency: string,
    customer: Customer
    metadata: object,
    callback_url: string,
    description: string,
}


export interface GenerateAddressParams {
    transaction_id: string,
    reference: string,
    chain: string,
    coin: string,
    rates: Map<string, any>
}



interface ClientCreateTransaction {
    amount: number
    currency: string
    customer: {
        id?: string
        email: string
        refund_address: string
    }
    description?: string
    callback_url?: string
    metadata?: Record<string, unknown>
}

// initialized (tr created) -> waiting (waiting for address generation) -> awaiting_payment -> awaiting_confirmation -> success/cancelled

enum PaymentChannel {
    Transfer = 'deposit',
    Account = 'account'
}

export enum PaymentMethod {
    CLIENT = 'client',
    PLATFORM = 'platform'
}


export interface Customer {
    id: string | null //customer id
    email: string //receipt_email
    refund_address: string | null // address to receive refund
    metadata: Record<string, unknown> | null // any other customer info
}






export interface TransactionObject {
    id: string // transaction_id, format gtr_randomstr
    type: string // type of transaction -> payment, test etc
    amount: number // amount e.g 2000.00, 0
    currency: string // ngn, usd, gbp ethc
    reference: string
    description: string | null
    crypto: {
        chain: string // chain e.g solana, ethereum etc
        coin: string // coin e.g sol, usdc, usdt
        exchange_rate: number // rate of transaction
        transaction_hash: string
        transaction_url: string // url e.g https://solscan.io/account/{hash}
        status: string // waiting, processing, completed, failed
        coin_price_usd: number
        currency_price_usd: number
        deposit_received_at: string
        amount_to_pay: number,
    }
    created: number // timestamp
    created_at: string // datetime
    completed_at: string | null // datetime
    cancelled_at: string | null,
    cancellation_reason: string | null,
    status: TransactionStatus // enum -> succeeded, cancelled, awaiting_payment, awaiting_confirmation
    payment_channel: PaymentChannel // transfer, account
    payment_method: string | null //clent, directc
    customer: Customer,
    application_fee: number // fee collected by us
    fee_in: string // which coin was the fee collected in
    metadata: Record<string, unknown> | null
    callback_url: string | null
}

export interface TransactionObjectList extends Array<TransactionObject> {}

export function isValidTransactionStatus(value: any): value is TransactionStatus {
    return Object.values(TransactionStatus).includes(value);
}

export function isValidPaymentChannel(value: any): value is PaymentChannel {
    return Object.values(PaymentChannel).includes(value);
}

export const parseCreateTransaction = (req: Request) : ClientCreateTransaction => {
    const { amount, currency, customer = {}, description = null, return_url: callback_url = null, metadata = null } = req.body;

    return {
        amount,
        currency,
        customer: {
            id: customer.id ?? null,
            email: customer.email ?? null,
            refund_address: customer.refund_address ?? null,
        },
        description,
        callback_url: callback_url,
        metadata
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// class Transaction {
//     transaction_code: string;
//     constructor(transaction_code?: string){
//         this.transaction_code = transaction_code;
//     }

//     createTransaction(){
        
//     }
    
//     verifyTransaction(){
        
//     }

// }