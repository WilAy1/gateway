/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from "express";
import { Customer, GenerateAddressParams, InitTransactionParams, PaymentMethod, TransactionObject, TransactionStatus } from "./create_transaction";
import Query from "../../../db/query";
import { GWObject, isEmpty, isValidEmail, removeKeys } from "../../../utils/utils";
import { fetchCoin } from "../../../db/crypto/functions.db";
import { ChainTypes } from "../../../enums/chain";
import { getConversionRate } from "../../public/rates/router";
import { QueryResult } from "pg";
import generateSolanaWallet from "../../../crypto/solana/generate_addr";
import { startSolanaListening } from "../../../crypto/solana/connection";

const PLATFORM_PAYMENT_URL = "http://localhost:3001/pay";

function initializeDepositTransaction(params){
    const { amount, currency, coin, chain, refund_address, email} = params;

    if (!amount || !currency || !coin || !chain || !refund_address || !email) {
        return { status: false, error: 'invalid_params', message: "Failed to create transaction" }
    }
    


    const customerDetails : Customer = {
        id: params.customer_id,
        email: email,
        refund_address: refund_address,
        metadata: params.metadata
    }

}




export async function getDepositAddress(issuer: Map<string, unknown>, params: GenerateAddressParams ) {
    //
    try {

        let depositAddress;

        const { transaction_id, reference, chain, coin, rates } = params;

        const query = new Query("transactions");

        const transactionResult = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "id",
                        value: transaction_id
                    },
                    {
                        key: "reference",
                        value: reference
                    },        
                ]
            }
        });
        


        

        if(isEmpty(transactionResult)) return { status: false, error: "transaction_unknown", message: "Couldn't find trasaction" }
        const transaction = transactionResult[0];


        const { rate, amount_to, price_from, price_to } = await getConversionRate({
            amount: parseFloat(transaction["amount"]) as number,
            from: transaction["currency"],
            to: coin
        });

        if(String(rate) !== String(rates['rate'])) return {
            status : false,
            error: "rates_error",
            message : "Price updated, try again",
        }

        if(transaction["onchain_status"] == null && transaction["deposit_address"] == null) {


            switch(chain) {
                case ChainTypes.SOLANA:
                    depositAddress = await generateSolanaWallet();
                    break;
                default:
                    break;                    
            }


            if(!depositAddress){
                return { status: false, error: "address_error", message: "Failed to generate deposit address" };
            }



            // change status to  awaiting_payment
            const status = TransactionStatus.AWAITINGPAYMENT;

            const date = new Date();
            const address_generated_at = date.toISOString();


            await query.update([
                "chain", 
                "coin", 
                "exchange_rate", 
                "onchain_status", 
                "coin_price_usd", 
                "currency_price_usd",
                "deposit_address",
                "amount_to_pay",
                "status",
                "address_generated_at"
            ], [
                    chain,
                    coin,
                    rate,
                    "waiting",
                    price_to,
                    price_from,
                    depositAddress,
                    amount_to,
                    status,
                    address_generated_at
                ], {
                    compulsory: [{
                        key: "id",
                        value: transaction_id
                    },
                    {
                        key: "reference",
                        value: reference
                    }]
                });
            }


            const newTransactionResult =await query.select({
                conditions: {
                    compulsory: [
                        {
                            key: "id",
                            value: transaction_id
                        },
                        {
                            key: "reference",
                            value: reference
                        },        
                    ]
                }
            })


            const updatedResult = removeKeys(newTransactionResult[0] as GWObject, 
                [
                'issuer_id',
                'description',
                'customer_id',
                "customer_email",
                "customer_metadata",
                "application_fee",
                "fee_denomination",
                "metadata",
                "device_type",
                "useragent",
                "ipaddress" 
                ]);

            //startSolanaListening(updatedResult['deposit_address'] as string);
                
            return {
                status : true,
                message : "Successfully generated address",
                result: updatedResult
            }



    }
    catch(error) {
        console.error(error);
        throw new Error("Failed to create deposit address");
    }
}


export async function fetchTransaction(issuer: Map<string, unknown>, params) {
    try {
        const query = new Query("transactions");

        const { reference } = params;

        const transaction = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "issuer_id",
                        value: issuer['userId']
                    },
                    {
                        key: "reference",
                        value: reference
                    },        
                ]
            }
        });



        if(!isEmpty(transaction)) {

            const updatedResult = removeKeys(transaction[0] as GWObject, 
                [
                'issuer_id',
                'description',
                'customer_id',
                "customer_email",
                "customer_metadata",
                "application_fee",
                "fee_denomination",
                "metadata",
                "device_type",
                "useragent",
                "ipaddress" 
                ]);

            //startSolanaListening(updatedResult['deposit_address'] as string);

            return {
                status : true,
                message : "Successfully fetched transaction",
                result: updatedResult
            }
        }

        return {
            status: false,
            error: "invalid_params",
            message: "Failed to fetch transaction",
        }

    }
    catch(error) {
        console.error(error);
        throw new Error("Failed to fetch transaction");
    }
}


export async function generatePaymentUrl(issuer: Map<string, unknown>, params: InitTransactionParams){
    try {
        // expected params
        // amount, currency, email
        const { amount, currency, customer, callback_url, description, metadata } = params;
        if(!amount || !currency || !customer || !customer.email || !isValidEmail(customer.email)) return { status: false, error: 'invalid_params', message: "Failed to create transaction" }


        const currencyCheck = await currencyExists(currency);
        
        if(!currencyCheck) return { status: false, error: 'invalid_currency', message: "Failed to create transaction" }
        

        const query = new Query("transactions");

        const date = new Date();
        const created_at = date.toISOString();
        const transaction_reference = generateTransactionReference();
        const transaction_status = TransactionStatus.INITIALIZED;
        const transaction_type = 'payment';
        const payment_method = PaymentMethod.PLATFORM;



        const keys = [
            "issuer_id",
            "type",
            "amount",
            "currency",
            "reference",
            "description",
            "created_at",
            "status",
            "payment_method",
            "customer_id",
            "customer_email",
            "customer_metadata",
            "metadata",
            "callback_url",

        ];
        const values = [
            issuer['userId'],
            transaction_type,
            amount,
            currency.toLowerCase(),
            transaction_reference,
            description,
            created_at,
            transaction_status,
            payment_method,
            customer.id,
            customer.email,
            customer.metadata,
            metadata,
            callback_url
        ];

        const result = await query.insert(keys, values);

        if(result) {
            return {
                status: true,
                message: "Transaction generated",
                payment_url: `${PLATFORM_PAYMENT_URL}/${transaction_reference}`
            }
        }

        return {
            status: false,
            message: "Failed to create transaction."
        }
    }
    catch(error) {
        console.error('Error creating transaction: ', error);
        throw new Error('Error creating transaction');
    }



}



function generateTransactionReference() : string {
    const pool = 'qwertyuiopasdfghjklasdfghjklQWERTYUIOPASDFGHJKLZXCBNM1234567890'.split('');
    let code = "";
    for(let i = 0; i < 21; i++){
        code += pool[Math.floor(Math.random()*pool.length)];
    }
    return `gwp_${code}`;
}



async function currencyExists(currency: string) : Promise<boolean> {
    const query = new Query("available_currencies");
    const result = await query.select({
        conditions: {
            compulsory: [
                {
                    key: "status",
                    value: "active"
                },
                {
                    key: "currency",
                    value: currency.toLowerCase()
                }
            ]
        }
    });

    return !isEmpty(result);
}