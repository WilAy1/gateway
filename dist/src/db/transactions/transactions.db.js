"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionDB = void 0;
const wallet_db_1 = require("../wallet/wallet.db");
const query_1 = __importDefault(require("../query"));
const utils_1 = require("../../utils/utils");
const create_transaction_1 = require("../../api/private/transaction/create_transaction");
class TransactionsDBQueries {
    constructor(issuer) {
        this.transactions = new query_1.default("transactions");
        this.issuer = issuer;
    }
    async fetchTransactions() {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "issuer_id",
                            value: this.issuer
                        }
                    ]
                }
            });
            return transaction;
        }
        catch (error) {
            console.error(error);
            throw new Error("Error fetching transactions");
        }
    }
    async fetchTransaction(transaction_id) {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "issuer_id",
                            value: this.issuer
                        },
                        {
                            key: "id",
                            value: transaction_id
                        },
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(transaction)) {
                return false;
            }
            return transaction[0];
        }
        catch (error) {
            console.error(error);
            throw new Error("Error fetching transaction");
        }
    }
    async updateTransaction(transactionId, keys, values) {
        const transaction = await this.fetchTransaction(transactionId);
        if (transaction) {
            this.transactions.update(keys, values, {
                compulsory: [
                    {
                        key: "id",
                        value: transactionId
                    }
                ]
            });
            return true;
        }
        return false;
    }
}
class TransactionDB extends TransactionsDBQueries {
    constructor(issuer) {
        super(issuer);
    }
    async confirmTransaction(transactionId) {
        try {
            const transaction = await this.fetchTransaction(transactionId);
            if (!transaction) {
                return;
            }
            if (transaction["status"] != create_transaction_1.TransactionStatus.COMPLETED) {
                const date = new Date();
                const isoTime = date.toISOString();
                const status = create_transaction_1.TransactionStatus.COMPLETED;
                const channel = "";
                const application_fee = 0.1 * parseFloat(transaction["amount_to_pay"] || 0);
                const amount_to_credit = parseFloat(transaction["amount_to_pay"]) - application_fee;
                const fees_denomination = transaction["coin"];
                const onchain_status = create_transaction_1.TransactionStatus.COMPLETED;
                const updateObject = {
                    status: status,
                    payment_channel: channel,
                    application_fee: application_fee,
                    fees_denomination: fees_denomination,
                    onchain_status: onchain_status,
                    completed_at: isoTime
                };
                const update = await this.updateTransaction(transactionId, Object.keys(updateObject), Object.values(updateObject));
                if (update) {
                    const wallet = new wallet_db_1.WalletDB({ userId: this.issuer });
                    await wallet.credit(amount_to_credit, wallet_db_1.CREDIT_REASONS.transaction_completed, transactionId);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error("Couldn't complete transaction: ", error);
            return false;
        }
        //update
        /**
         * completed_at
         * status -> completed
         * payment_channel
         * application_fee
         * fees_denomination
         * onchain_status
         *
         */
        // check if deposit is confirmed
    }
}
exports.TransactionDB = TransactionDB;
//# sourceMappingURL=transactions.db.js.map