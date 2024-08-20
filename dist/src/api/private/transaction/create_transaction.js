"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateTransaction = exports.isValidPaymentChannel = exports.isValidTransactionStatus = exports.PaymentMethod = exports.TransactionStatus = exports.createTransactionRouter = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const generate_payment_url_1 = require("./generate_payment_url");
//import { TransactionDB } from '../../../db/transactions/transactions.db';
exports.createTransactionRouter = express_1.default.Router();
// createTransactionRouter.post('/complete', async (req, res) => {
//     const issuer = req['user'];
//     const tDB = new TransactionDB(issuer["userId"]);
//     const { transaction_id } = req.body;
//     tDB.confirmTransaction(transaction_id);
//     return res.status(StatusCodes.OK).json({});
// })
exports.createTransactionRouter.get('/fetch', async (req, res) => {
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
            success: "success",
            message: response.message,
            data: response.result
        });
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});
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
            success: "success",
            message: response.message,
            payment_url: response.payment_url
        });
    }
    catch (error) {
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});
exports.createTransactionRouter.post('/generate-address', async (req, res) => {
    try {
        const issuer = req["user"];
        const params = req.body;
        const response = await (0, generate_payment_url_1.getDepositAddress)(issuer, params);
        if (response.status == false) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: response.error, message: response.message });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: "success",
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
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["AWAITINGPAYMENT"] = "awaiting_payment";
    TransactionStatus["AWAITINGCONFIRMATION"] = "awaiting_confirmation";
    TransactionStatus["INITIALIZED"] = "initialized";
    TransactionStatus["WAITING"] = "waiting";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
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
    return Object.values(TransactionStatus).includes(value);
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