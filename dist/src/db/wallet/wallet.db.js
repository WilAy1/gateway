"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREDIT_REASONS = exports.WalletDB = void 0;
const utils_1 = require("../../utils/utils");
const query_1 = __importDefault(require("../query"));
var CREDIT_REASONS;
(function (CREDIT_REASONS) {
    CREDIT_REASONS["transaction_completed"] = "transaction_completed";
})(CREDIT_REASONS || (exports.CREDIT_REASONS = CREDIT_REASONS = {}));
/**
 * WALLET TABLE | COLS
 * wallet_id uuid
 * user_id uuid
 * balance float
 * created time
 * last_used time
 * others json
 *
 * * * * * * * * * * * * * * * *
 *
 * WALLET_ACTIVITY TABLE | COLS
 * activity_id uuid
 * wallet_id uuid
 * user_id uuid
 * amount float
 * activity_type ENUM(credit, debit)
 * reference uuid?
 * reference_origin ENUM(transaction, dispute, ...)
 * reason text
 * created time
 */
class WalletDBQueries {
    constructor(params) {
        this.wallet_query = new query_1.default("wallet");
        this.activity_query = new query_1.default("wallet_activity");
        this.userId = params.userId;
    }
    async getWallet() {
        try {
            const wallet = await this.wallet_query.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        }
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(wallet)) {
                return false;
            }
            return wallet[0];
        }
        catch (error) {
            throw new Error("Error occured while fetching user's walllet.");
        }
    }
    async updateWallet(keys, values) {
        try {
            const wallet = await this.getWallet();
            if (wallet) {
                await this.wallet_query.update(keys, values, {
                    compulsory: [{
                            key: "user_id",
                            value: this.userId
                        }]
                });
            }
        }
        catch (error) {
            console.error(error);
            throw new Error("Error occured while updating wallet");
        }
    }
    async getWalletActivity(activity_id) {
        try {
            const activity = await this.activity_query.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        },
                        {
                            key: "activity_id",
                            value: activity_id
                        }
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(activity)) {
                return false;
            }
            return activity[0];
        }
        catch (error) {
            throw new Error("Error fetching activity");
        }
    }
    async createWalletActivity(params) {
        try {
            const wallet = this.getWallet();
            if (wallet) {
                await this.activity_query.insert(Object.keys(params), Object.values(params));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(error);
            throw (new Error("Error inserting new wallet activity."));
        }
    }
}
var ACTIVITY_TYPE;
(function (ACTIVITY_TYPE) {
    ACTIVITY_TYPE["credit"] = "credit";
    ACTIVITY_TYPE["debit"] = "debit";
})(ACTIVITY_TYPE || (ACTIVITY_TYPE = {}));
var ReferenceOrigin;
(function (ReferenceOrigin) {
    ReferenceOrigin["transaction"] = "transaction";
})(ReferenceOrigin || (ReferenceOrigin = {}));
class WalletDB extends WalletDBQueries {
    constructor(params) {
        super(params);
    }
    async credit(amount, reason, reference_id) {
        const wallet = await this.getWallet();
        if (!wallet) {
            return;
        }
        const currentAmount = parseFloat(wallet["balance"]);
        if (isNaN(currentAmount))
            return;
        const newAmount = currentAmount + amount;
        console.log(currentAmount, amount, newAmount);
        const date = new Date();
        const currentIsoTIme = date.toISOString();
        const activity = {
            user_id: this.userId,
            wallet_id: wallet["wallet_id"],
            amount: amount,
            activity_type: ACTIVITY_TYPE.credit,
            reference_id: reference_id,
            reference_origin: ReferenceOrigin.transaction,
            reason: CREDIT_REASONS.transaction_completed,
            created: currentIsoTIme
        };
        this.updateWallet([
            "balance",
            "last_used"
        ], [
            newAmount,
            currentIsoTIme
        ]);
        this.createWalletActivity(activity);
    }
    debit() {
    }
    log() {
    }
}
exports.WalletDB = WalletDB;
//# sourceMappingURL=wallet.db.js.map