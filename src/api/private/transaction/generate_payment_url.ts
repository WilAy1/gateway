/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from "express";
import { Customer, GenerateAddressParams, InitTransactionParams, PaymentMethod, TransactionObject } from "./create_transaction";
import { TransactionStatus } from '../../../interfaces/TransactionStatus';
import Table from "../../../db/query";
import { GWObject, isEmpty, isValidEmail, removeKeys } from "../../../utils/utils";
import { fetchCoin } from "../../../db/crypto/functions.db";
import { ChainTypes } from "../../../enums/chain";
import { getConversionRate } from "../../public/rates/router";
import { QueryResult } from "pg";
import Solana from "../../../services/solana/solana";
import Customers from "../../../db/customers/customers";
import Ethereum from "../../../services/ethereum/ethereum";

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



// no need for issuer
export async function getDepositAddress(issuer: Map<string, unknown>, params: GenerateAddressParams ) {
    //
    try {

        let depositAddress;

        const { transaction_id, reference, chain, coin, rates } = params;

        if(!transaction_id || !reference || !chain || !coin || !rates) {
            return {
                status : false,
                error: "param_error",
                message : "All parameters aren't available",
            }
        }

        const query = new Table("transactions");

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

        if(transaction["status"] !== TransactionStatus.INITIALIZED) return {status: false, message: "Couldn't generate address for transaction"};


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

            const solana = new Solana();
            const etherum = new Ethereum();
            switch(chain) {
                case ChainTypes.SOLANA:
                    depositAddress = await solana.generate({ isToken: coin != "sol" });
                    break;
                case ChainTypes.ETHEREUM:
                    depositAddress = await etherum.generate();
                    break;
                default:
                    break;                    
            }


            if(!depositAddress){
                return { status: false, error: "address_error", message: "Failed to generate deposit address" };
            }

            const coinDetails = await fetchCoin(null, { chainName: chain, coinName: coin });
            if(!coinDetails) return {
                status : false,
                error: "coin_chain_error",
                message : "Invalid coin/chain used",
            }

            const contract_address = coinDetails['contract_address'];
            const coinDecimals = coinDetails['decimals'];

            const amount_to_pay = parseFloat(amount_to.toFixed(coinDecimals));




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
                "address_generated_at",
                "coin_contract_address",
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
                    address_generated_at,
                    contract_address
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

            const merchantTable = new Table("users");
            const merchant = await merchantTable.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: issuer["userId"]
                        }
                    ]
                }
            });


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
                result: {...updatedResult, merchant: { name: merchant[0]["business_name"] }}
            }



    }
    catch(error) {
        console.error(error);
        throw new Error("Failed to create deposit address");
    }
}


export async function fetchTransaction(issuer: Map<string, unknown>, params) {
    try {
        const query = new Table("transactions");
        const merchantTable = new Table("users");

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

        const merchant = await merchantTable.select({
            conditions: {
                compulsory: [
                    {
                        key: "user_id",
                        value: issuer["userId"]
                    }
                ]
            }
        });



        if(!isEmpty(transaction) && !isEmpty(merchant)) {

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
                result: {...updatedResult, merchant: { name: merchant[0]["business_name"] }}
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

// issuer needed
export async function generatePaymentUrl(issuer: Map<string, unknown>, params: InitTransactionParams){
    try {
        // expected params
        // amount, currency, email
        const { amount, currency, customer, callback_url, description, metadata } = params;
        if(!amount || !currency || !customer || (!customer.id && !customer.email)) return { status: false, error: 'invalid_params', message: "Failed to create transaction" }

        if(customer.id) {
            const customerObj = new Customers(issuer['userId']);

            const customerExists = await customerObj.customerExists({id: customer.id});

            if(!customerExists && !isValidEmail(customer.email)){
                return { status: false, error: 'invalid_params', message: "Failed to create transaction - use a valid customer or enter customer id" }
            }

            if(!isValidEmail(customer.email)){
                customer.email = customerExists['email'];
            }
        }


        const currencyCheck = await currencyExists(currency);
        
        if(!currencyCheck) return { status: false, error: 'invalid_currency', message: "Failed to create transaction" }
        

        const query = new Table("transactions");

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
            description || "Payment",
            created_at,
            transaction_status,
            payment_method,
            customer.id,
            customer.email,
            customer.metadata,
            metadata,
            callback_url
        ];

        const result = await query.insert(keys, values, {returnColumn: "id"});


        if(result) {
            return {
                status: true,
                message: "Transaction generated",
                payment_url: `${PLATFORM_PAYMENT_URL}/${transaction_reference}`,
                id: result['id'],
                reference: transaction_reference
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
    const query = new Table("available_currencies");
    query.select({}).then((result)=>{ /*console.log(result)*/ });
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