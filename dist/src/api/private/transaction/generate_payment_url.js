"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePaymentUrl = exports.fetchTransaction = exports.getDepositAddress = void 0;
const create_transaction_1 = require("./create_transaction");
const query_1 = __importDefault(require("../../../db/query"));
const utils_1 = require("../../../utils/utils");
const chain_1 = require("../../../enums/chain");
const router_1 = require("../../public/rates/router");
const generate_addr_1 = __importDefault(require("../../../crypto/solana/generate_addr"));
const PLATFORM_PAYMENT_URL = "http://localhost:3001/pay";
function initializeDepositTransaction(params) {
    const { amount, currency, coin, chain, refund_address, email } = params;
    if (!amount || !currency || !coin || !chain || !refund_address || !email) {
        return { status: false, error: 'invalid_params', message: "Failed to create transaction" };
    }
    const customerDetails = {
        id: params.customer_id,
        email: email,
        refund_address: refund_address,
        metadata: params.metadata
    };
}
async function getDepositAddress(issuer, params) {
    //
    try {
        let depositAddress;
        const { transaction_id, reference, chain, coin } = params;
        const query = new query_1.default("transactions");
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
        if ((0, utils_1.isEmpty)(transactionResult))
            return { status: false, error: "transaction_unknown", message: "Couldn't find trasaction" };
        const transaction = transactionResult[0];
        if (transaction["onchain_status"] == null && transaction["deposit_address"] == null) {
            switch (chain) {
                case chain_1.ChainTypes.SOLANA:
                    depositAddress = await (0, generate_addr_1.default)();
                    break;
                default:
                    break;
            }
            if (!depositAddress) {
                return { status: false, error: "address_error", message: "Failed to generate deposit address" };
            }
            const { rate, amount_to, price_from, price_to } = (0, router_1.getRate)({
                amount: parseFloat(transaction["amount"]),
                from: transaction["currency"],
                to: coin
            });
            // change status to  awaiting_payment
            const status = create_transaction_1.TransactionStatus.AWAITINGPAYMENT;
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
        const newTransactionResult = await query.select({
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
        const updatedResult = (0, utils_1.removeKeys)(newTransactionResult[0], [
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
            status: true,
            message: "Successfully generated address",
            result: updatedResult
        };
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to create deposit address");
    }
}
exports.getDepositAddress = getDepositAddress;
async function fetchTransaction(issuer, params) {
    try {
        const query = new query_1.default("transactions");
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
        if (!(0, utils_1.isEmpty)(transaction)) {
            const updatedResult = (0, utils_1.removeKeys)(transaction[0], [
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
                status: true,
                message: "Successfully fetched transaction",
                result: updatedResult
            };
        }
        return {
            status: false,
            error: "invalid_params",
            message: "Failed to fetch transaction",
        };
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to fetch transaction");
    }
}
exports.fetchTransaction = fetchTransaction;
async function generatePaymentUrl(issuer, params) {
    try {
        // expected params
        // amount, currency, email
        const { amount, currency, customer, callback_url, description, metadata } = params;
        if (!amount || !currency || !customer || !customer.email || !(0, utils_1.isValidEmail)(customer.email))
            return { status: false, error: 'invalid_params', message: "Failed to create transaction" };
        const currencyCheck = await currencyExists(currency);
        if (!currencyCheck)
            return { status: false, error: 'invalid_currency', message: "Failed to create transaction" };
        const query = new query_1.default("transactions");
        const date = new Date();
        const created_at = date.toISOString();
        const transaction_reference = generateTransactionReference();
        const transaction_status = create_transaction_1.TransactionStatus.INITIALIZED;
        const transaction_type = 'payment';
        const payment_method = create_transaction_1.PaymentMethod.PLATFORM;
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
        if (result) {
            return {
                status: true,
                message: "Transaction generated",
                payment_url: `${PLATFORM_PAYMENT_URL}/${transaction_reference}`
            };
        }
        return {
            status: false,
            message: "Failed to create transaction."
        };
    }
    catch (error) {
        console.error('Error creating transaction: ', error);
        throw new Error('Error creating transaction');
    }
}
exports.generatePaymentUrl = generatePaymentUrl;
function generateTransactionReference() {
    const pool = 'qwertyuiopasdfghjklasdfghjklQWERTYUIOPASDFGHJKLZXCBNM1234567890'.split('');
    let code = "";
    for (let i = 0; i < 21; i++) {
        code += pool[Math.floor(Math.random() * pool.length)];
    }
    return `gwp_${code}`;
}
async function currencyExists(currency) {
    const query = new query_1.default("available_currencies");
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
    return !(0, utils_1.isEmpty)(result);
}
//# sourceMappingURL=generate_payment_url.js.map