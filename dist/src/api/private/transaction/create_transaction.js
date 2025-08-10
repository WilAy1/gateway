"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateTransaction = exports.isValidPaymentChannel = exports.isValidTransactionStatus = exports.PaymentMethod = exports.fnParticularTransaction = exports.fnAllTransaction = exports.createTransactionRouter = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const generate_payment_url_1 = require("./generate_payment_url");
const TransactionStatus_1 = require("../../../interfaces/TransactionStatus");
const transactions_db_1 = require("../../../db/transactions/transactions.db");
const db_interface_1 = require("../../../interfaces/db.interface");
const customers_1 = __importDefault(require("../../../db/customers/customers"));
exports.createTransactionRouter = express_1.default.Router();
// createTransactionRouter.post('/complete', async (req, res) => {
//     const issuer = req['user'];
//     const tDB = new TransactionDB(issuer["userId"]);
//     const { transaction_id } = req.body;
//     tDB.confirmTransaction(transaction_id);
//     return res.status(StatusCodes.OK).json({});
// })
async function fnAllTransaction(req, res) {
    try {
        const issuer = req['user'];
        const { limit, offset, status, from_customer } = req.query;
        const trasaction = new transactions_db_1.TransactionDB(issuer.userId);
        const conditions = {
            compulsory: [
                {
                    key: "issuer_id",
                    value: issuer.userId
                }
            ],
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0,
            orderBy: ["created_at"],
            orderDir: db_interface_1.OrderDirection.DESCENDING
        };
        if (status) {
            switch (status) {
                case "pending":
                    conditions.optional = [
                        { key: "status", value: "initialized" },
                        { key: "status", value: "awaiting_payment" },
                        { key: "status", value: "awaiting_confirmation" },
                    ];
                    break;
                default:
                    conditions.compulsory.push({ key: "status", value: status });
            }
        }
        if (from_customer) {
            const customer = new customers_1.default(issuer.userId);
            const exists = await customer.customerExists({ id: from_customer.toString() });
            if (!exists) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: "Error fetching transactions",
                });
            }
            conditions.compulsory.push({ key: "customer_id", value: exists });
        }
        const response = await trasaction.fetchTransactions({
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
            conditions: conditions
        });
        if (!response) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Error fetching transactions"
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "success",
            data: response
        });
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
}
exports.fnAllTransaction = fnAllTransaction;
async function fnParticularTransaction(req, res) {
    try {
        const issuer = req['user'];
        const transaction_params = req.query;
        const response = await (0, generate_payment_url_1.fetchTransaction)(issuer, transaction_params);
        if (!response.status) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                error: response.error,
                message: response.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: response.result
        });
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
}
exports.fnParticularTransaction = fnParticularTransaction;
exports.createTransactionRouter.get('/all', fnAllTransaction);
exports.createTransactionRouter.get('/fetch', fnParticularTransaction);
exports.createTransactionRouter.post('/create', async (req, res) => {
    try {
        const issuer = req["user"];
        //const issuerId = issuer.userId;
        const transaction_params = parsePlatformCreateTransaction(req);
        const response = await (0, generate_payment_url_1.generatePaymentUrl)(issuer, transaction_params);
        if (!response.status) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                error: response.error,
                message: response.message
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: {
                payment_url: response.payment_url,
                id: response.id,
                reference: response.reference
            }
        });
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});
exports.createTransactionRouter.post('/cancel', async (req, res) => {
    try {
        const { transaction_id } = req.body;
        const transaction = new transactions_db_1.TransactionDB();
        const response = await transaction.cancelTransaction({ id: transaction_id });
        res.status(response ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.BAD_GATEWAY).json({
            success: response,
            message: response ? "success" : "Failed to cancel transaction",
            data: {}
        });
    }
    catch {
        //
    }
});
exports.createTransactionRouter.post('/generate-address', async (req, res) => {
    try {
        const issuer = req["user"];
        const params = req.body;
        const response = await (0, generate_payment_url_1.getDepositAddress)(issuer, params);
        if (response.status == false) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, error: response.error, message: response.message });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: response.message,
            data: response.result
        });
    }
    catch {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});
function parsePlatformCreateTransaction(req) {
    const { amount, currency, customer, metadata = {}, callback_url = null, description = null } = req.body;
    return {
        amount: amount,
        currency: currency,
        customer: customer,
        metadata: metadata,
        callback_url: callback_url,
        description: description
    };
}
// initialized (tr created) -> waiting (waiting for address generation) -> awaiting_payment -> awaiting_confirmation -> success/cancelled
var PaymentChannel;
(function (PaymentChannel) {
    PaymentChannel["Transfer"] = "deposit";
    PaymentChannel["Account"] = "account";
})(PaymentChannel || (PaymentChannel = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CLIENT"] = "client";
    PaymentMethod["PLATFORM"] = "platform";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
function isValidTransactionStatus(value) {
    return Object.values(TransactionStatus_1.TransactionStatus).includes(value);
}
exports.isValidTransactionStatus = isValidTransactionStatus;
function isValidPaymentChannel(value) {
    return Object.values(PaymentChannel).includes(value);
}
exports.isValidPaymentChannel = isValidPaymentChannel;
const parseCreateTransaction = (req) => {
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
};
exports.parseCreateTransaction = parseCreateTransaction;
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
//# sourceMappingURL=create_transaction.js.map