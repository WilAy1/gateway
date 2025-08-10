"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsDBQueries = exports.SolanaTransactions = exports.TransactionDB = void 0;
const wallet_db_1 = require("../wallet/wallet.db");
const query_1 = __importDefault(require("../query"));
const utils_1 = require("../../utils/utils");
const TransactionStatus_1 = require("../../interfaces/TransactionStatus");
const chain_1 = require("../../enums/chain");
const solana_1 = __importDefault(require("../../services/solana/solana"));
class TransactionsDBQueries {
    constructor(issuer) {
        this.transactions = new query_1.default("transactions");
        if (issuer)
            this.issuer = issuer;
    }
    async fetchTransactions(params) {
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
            return update;
        }
        catch {
            return false;
        }
    }
    async confirmTransaction(transactionParam) {
        const { transactionId, transactionHash, status: transactionStatus, depositReceived } = transactionParam;
        try {
            const transaction = await this.fetchTransaction(transactionId);
            if (!transaction) {
                return;
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
                const update = await this.updateTransaction(transactionId, Object.keys(updateObject), Object.values(updateObject));
                //await subscribe();
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
class SolanaTransactions {
    constructor() {
        this.transactions = new query_1.default("transactions");
        this.walletTable = new query_1.default("solana_wallets");
    }
    async fetchAll() {
    }
    async fetchWalletData(address) {
        try {
            const wallet = await this.walletTable.select({
                conditions: {
                    compulsory: [
                        {
                            key: "address",
                            value: address
                        }
                    ]
                }
            });
            if (wallet) {
                return wallet[0];
            }
            return;
        }
        catch (error) {
            console.error(error);
            throw new Error("Error fetching wallet data");
        }
    }
    async fetchUnfinished() {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "chain",
                            value: chain_1.ChainTypes.SOLANA
                        },
                        {
                            key: "status",
                            value: TransactionStatus_1.TransactionStatus.AWAITINGPAYMENT
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
    async findTransactionWithAddress(address) {
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "chain",
                            value: chain_1.ChainTypes.SOLANA
                        },
                        {
                            key: "deposit_address",
                            value: address
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
    async parse(payload) {
        const { meta, transaction, blockTime } = payload;
        const { postBalances } = meta;
        const { message, signatures } = transaction;
        const { accountKeys } = message;
        const depositAddress = accountKeys[1]['pubkey'].toString();
        const transactionHash = signatures[0];
        const addressBalance = postBalances[1] / 1000000000;
        const transactions = await this.findTransactionWithAddress(depositAddress);
        if ((0, utils_1.isEmpty)(transactions)) {
            return;
        }
        const id = transactions[0]['id'];
        const issuer = transactions[0]['issuer_id'];
        const amount_to_pay = transactions[0]['amount_to_pay'];
        const date = new Date();
        date.setTime(blockTime * 1000);
        if (addressBalance >= amount_to_pay) {
            const transactionDB = new TransactionDB(issuer);
            await transactionDB.confirmTransaction({
                transactionId: String(id),
                transactionHash: transactionHash,
                status: TransactionStatus_1.TransactionStatus.COMPLETED,
                depositReceived: date.toISOString()
            });
            const walletAddress = this.fetchWalletData(depositAddress);
            if (walletAddress) {
                const logId = walletAddress['account_id'];
                const solana = new solana_1.default();
                solana.unsubscribe(logId);
            }
        }
        else if (addressBalance < amount_to_pay) {
            //
        }
    }
    async parseForToken(payload, depositAddress) {
        const parsedInstr = payload.transaction.message.instructions.find((instr) => instr.programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        if (!parsedInstr)
            return;
        const tokenId = parsedInstr.parsed.info.mint;
        const { meta, transaction, blockTime } = payload;
        const { postTokenBalances } = meta;
        const { signatures } = transaction;
        const addressBalance = postTokenBalances.find((tokenBalances) => tokenBalances.owner == depositAddress).uiTokenAmount.uiAmount;
        const transactionHash = signatures[0];
        const transactions = await this.findTransactionWithAddress(depositAddress);
        if ((0, utils_1.isEmpty)(transactions)) {
            return;
        }
        const coin = transactions[0]['coin'];
        const { contract_address } = await this.getCoinDetails(coin);
        if (contract_address != tokenId) {
            console.log("wrong token for transaction");
            return;
        }
        const id = transactions[0]['id'];
        const issuer = transactions[0]['issuer_id'];
        const amount_to_pay = transactions[0]['amount_to_pay'];
        const date = new Date();
        date.setTime(blockTime * 1000);
        if (addressBalance >= amount_to_pay) {
            const transactionDB = new TransactionDB(issuer);
            await transactionDB.confirmTransaction({
                transactionId: String(id),
                transactionHash: transactionHash,
                status: TransactionStatus_1.TransactionStatus.COMPLETED,
                depositReceived: date.toISOString()
            });
            // const walletAddress = this.fetchWalletData(depositAddress);
            // if(walletAddress){
            //     const logId = walletAddress['account_id'];
            //     const solana = new Solana();
            //     solana.unsubscribe(logId);
            // }
        }
    }
    async getCoinDetails(coin) {
        const coinsTable = new query_1.default("available_coins");
        const result = await coinsTable.select({
            cols: [
                "contract_address",
            ],
            conditions: {
                compulsory: [
                    {
                        key: "status",
                        value: "active"
                    },
                    {
                        key: "coin",
                        value: coin
                    }
                ]
            }
        });
        if ((0, utils_1.isEmpty)(result)) {
            return;
        }
        return result[0];
    }
}
exports.SolanaTransactions = SolanaTransactions;
//# sourceMappingURL=transactions.db.js.map