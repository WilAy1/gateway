"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsDBQueries = exports.TransactionDB = void 0;
const wallet_db_1 = require("../wallet/wallet.db");
const query_1 = __importDefault(require("../query"));
const utils_1 = require("../../utils/utils");
const TransactionStatus_1 = require("../../interfaces/TransactionStatus");
const chain_1 = require("../../enums/chain");
const functions_db_1 = require("../crypto/functions.db");
const settlement_1 = __importDefault(require("../../services/solana/settlement"));
const settlements_1 = __importDefault(require("../settlements/settlements"));
const connect_1 = __importDefault(require("../connect"));
const webhook_1 = require("../../interfaces/webhook");
const webhook_2 = require("../../services/webhook/webhook");
class TransactionsDBQueries {
    constructor(issuer) {
        this.transactions = new query_1.default("transactions");
        if (issuer)
            this.issuer = issuer;
    }
    async fetchTransactions(params, useStats) {
        console.log(useStats);
        try {
            const transaction = await this.transactions.select(params || {
                conditions: {
                    compulsory: [
                        {
                            key: "issuer_id",
                            value: this.issuer
                        }
                    ]
                }
            });
            if (!useStats)
                return transaction;
            const stats = await this.transactions.customQuery(`SELECT COUNT(*) AS total_txn, 
                                    COUNT(CASE WHEN status='completed' THEN 1 END) AS completed_txn, 
                                    COUNT(CASE WHEN status IN ('awaiting_payment', 'awaiting_confirmation') THEN 1 END) AS pending_txn,
                                    COUNT(CASE WHEN status='cancelled' THEN 1 END) AS cancelled_txn FROM transactions`, []);
            return { txns: transaction, stats: stats['rows'][0] };
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
                return;
            }
            return transaction[0];
        }
        catch (error) {
            console.error(error);
            throw new Error("Error fetching transaction");
        }
    }
    async fetchWithoutIssuer(transaction_id) {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "id",
                            value: transaction_id
                        },
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(transaction)) {
                return;
            }
            return transaction[0];
        }
        catch (error) {
            console.error(error);
            throw new Error("Error fetching transaction");
        }
    }
    async transactionExists(transactionId) {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "id",
                            value: transactionId
                        },
                    ]
                }
            });
            return !(0, utils_1.isEmpty)(transaction);
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async updateTransaction(transactionId, keys, values, conditions) {
        const transaction = await this.transactionExists(transactionId);
        if (transaction) {
            this.transactions.update(keys, values, {
                compulsory: [
                    {
                        key: "id",
                        value: transactionId
                    }
                ].concat(conditions?.compulsory || []),
                optional: conditions?.optional || null
            });
            return true;
        }
        return false;
    }
}
exports.TransactionsDBQueries = TransactionsDBQueries;
class TransactionDB extends TransactionsDBQueries {
    constructor(issuer) {
        super(issuer);
    }
    async cancelTransaction({ id }) {
        if (!(0, utils_1.isValidUUID)(id))
            return false;
        try {
            const date = new Date();
            const isoTime = date.toISOString();
            const conditions = {
                optional: [
                    {
                        key: "status",
                        value: TransactionStatus_1.TransactionStatus.AWAITINGPAYMENT
                    },
                    {
                        key: "status",
                        value: TransactionStatus_1.TransactionStatus.INITIALIZED
                    },
                ]
            };
            const update = await this.updateTransaction(id, ['cancelled_at', 'status'], [isoTime, TransactionStatus_1.TransactionStatus.CANCELLED], conditions);
            if (update) {
                const transaction = await this.fetchWithoutIssuer(id);
                const webhook = new webhook_2.Webhook(transaction["issuer_id"]);
                webhook.sendTransaction(id, webhook_1.WebhookEvent.TRANSACTION_CANCELLED);
            }
            return update;
        }
        catch {
            return false;
        }
    }
    async confirmTransaction(transactionParam) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Webhook, WebhookEvent } = require("../../services/webhook/webhook");
        const { transactionId, transactionHash, status: transactionStatus, depositReceived } = transactionParam;
        const client = await connect_1.default.connect();
        try {
            await client.query("BEGIN");
            const transaction = await this.fetchTransaction(transactionId);
            if (!transaction) {
                return false;
            }
            if (transaction["status"] != TransactionStatus_1.TransactionStatus.COMPLETED &&
                transaction["status"] != TransactionStatus_1.TransactionStatus.INITIALIZED &&
                transaction["status"] != TransactionStatus_1.TransactionStatus.CANCELLED) {
                const date = new Date();
                const isoTime = date.toISOString();
                const status = transactionStatus;
                const channel = "";
                const application_fee = 0.1 * parseFloat(transaction["amount_to_pay"] || 0);
                const amount_to_credit = parseFloat(transaction["amount_to_pay"]) - application_fee;
                const fees_denomination = transaction["coin"];
                const onchain_status = transactionStatus;
                const updateObject = {
                    status: status,
                    payment_channel: channel,
                    application_fee: application_fee,
                    fees_denomination: fees_denomination,
                    onchain_status: onchain_status,
                    completed_at: isoTime,
                    onchain_transaction_hash: transactionHash,
                    deposit_received_at: depositReceived
                };
                const coinDetails = await (0, functions_db_1.fetchCoin)(null, {
                    coinName: transaction["coin"],
                    chainName: transaction["chain"]
                });
                if (!coinDetails) {
                    console.error("Coin details not found for transaction: ", transactionId);
                    return false;
                }
                const update = await this.updateTransaction(transactionId, Object.keys(updateObject), Object.values(updateObject));
                //await subscribe();
                if (!update) {
                    await client.query("ROLLBACK");
                    return false;
                }
                // credit based on settlement fallback to credit if failed  
                const wallet = new wallet_db_1.WalletDB({ userId: this.issuer });
                const creditStatus = await wallet.credit(coinDetails.coin_id, amount_to_credit, wallet_db_1.CREDIT_REASONS.transaction_completed, transactionId);
                if (!creditStatus) {
                    await client.query("ROLLBACK");
                    return false;
                }
                await client.query("COMMIT");
                const webhook = new Webhook(this.issuer);
                webhook.sendTransaction(transactionId, WebhookEvent.TRANSACTION_COMPLETED);
                // start settlement
                if (transaction.chain == chain_1.ChainTypes.SOLANA) {
                    const settlement = new settlements_1.default(this.issuer);
                    const settlementAddress = await settlement.get({ byChainId: coinDetails.chain_id });
                    if (settlementAddress.length > 0) {
                        const solanaSettlement = new settlement_1.default();
                        solanaSettlement.settle({ transaction: transaction, amount: amount_to_credit, fee: application_fee, tokenAddress: coinDetails.contract_address, settlementAddress: settlementAddress[0]["address"], coinDetails: coinDetails });
                        //if(settled) wallet.debit(coinDetails.coin_id, amount_to_credit, DEBIT_REASONS.settlement_completed, transactionId);
                    }
                }
                return creditStatus ?? false;
            }
            return false;
        }
        catch (error) {
            await client.query("ROLLBACK");
            console.error("Couldn't complete transaction: ", error);
            return false;
        }
        finally {
            client.release();
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