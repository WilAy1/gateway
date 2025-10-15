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
 * user_id uuid
 * coin_id uuid
 * balance float
 *
 * * * * * * * * * * * * * * * *
 *
 * WALLET_ACTIVITY TABLE | COLS
 * activity_id uuid
 * coin_id uuid
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
        this.wallet_table = new query_1.default("wallet");
        this.activity_table = new query_1.default("wallet_activity");
        this.userId = params.userId;
    }
    async getUserAsset(coin_id) {
        try {
            const asset = await this.wallet_table.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        },
                        {
                            key: "coin_id",
                            value: coin_id
                        }
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(asset)) {
                return false;
            }
            return asset[0];
        }
        catch (error) {
            throw new Error("Error fetching user's asset");
        }
    }
    async getUserAssets() {
        try {
            const assets = await this.wallet_table.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        }
                    ]
                }
            });
            if ((0, utils_1.isEmpty)(assets)) {
                return [];
            }
            return assets;
        }
        catch (error) {
            throw new Error("Error fetching user's assets");
        }
    }
    async updateUserAsset(coinId, amount) {
        try {
            const asset = await this.getUserAsset(coinId);
            if (asset) {
                await this.wallet_table.update(["balance"], [amount], {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        },
                        {
                            key: "coin_id",
                            value: coinId
                        }
                    ]
                });
            }
            else {
                await this.wallet_table.insert(["user_id", "coin_id", "balance"], [this.userId, coinId, amount]);
            }
            return true;
        }
        catch (error) {
            console.error(error);
            throw new Error("Error updating user's asset");
        }
    }
    /*protected async getWallet() : Promise<boolean | GWObject> {
        try {
            const wallet = await this.wallet_table.select({
                conditions: {
                    compulsory: [
                        {
                            key: "user_id",
                            value: this.userId
                        }
                    ]
                }
            });

            if(isEmpty(wallet)) {
                return false;
            }

            return wallet[0] as GWObject;
        }
        catch(error) {
            throw new Error("Error occured while fetching user's walllet.");
        }
    }

    protected async updateWallet(keys: Array<string>, values: Array<unknown>) {
        try {
            const wallet = await this.getWallet();
            if(wallet) {
                await this.wallet_table.update(
                    keys,
                    values,
                    {
                        compulsory: [{
                            key: "user_id",
                            value: this.userId
                        }]
                    }
                )
            }
        }
        catch(error) {
            console.error(error);
            throw new Error("Error occured while updating wallet");
        }
    }*/
    async getWalletActivity(activity_id) {
        try {
            const activity = await this.activity_table.select({
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
            await this.activity_table.insert(Object.keys(params), Object.values(params));
            return true;
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
    async credit(coinId, amount, reason, reference_id) {
        const asset = await this.getUserAsset(coinId);
        let newAmount = amount;
        if (asset) {
            const currentAmount = parseFloat(asset["balance"]);
            newAmount += currentAmount;
        }
        const date = new Date();
        const currentIsoTIme = date.toISOString();
        const activity = {
            user_id: this.userId,
            coin_id: coinId,
            amount: amount,
            activity_type: ACTIVITY_TYPE.credit,
            reference_id: reference_id,
            reference_origin: ReferenceOrigin.transaction,
            reason: CREDIT_REASONS.transaction_completed,
            created: currentIsoTIme
        };
        this.updateUserAsset(coinId, newAmount);
        this.createWalletActivity(activity);
        return true;
    }
    debit() {
    }
    log() {
    }
}
exports.WalletDB = WalletDB;
//# sourceMappingURL=wallet.db.js.map