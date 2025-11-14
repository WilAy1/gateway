import { UUID } from "crypto";
import { GWObject, isEmpty } from "../../utils/utils";
import Table from "../query";


type WalletParams = {
    userId: string
}
enum CREDIT_REASONS {
    transaction_completed = "transaction_completed"
}

enum DEBIT_REASONS {
    settlement_completed = "settlement_completed"
}

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

class WalletDBQueries{
    protected wallet_table: Table;
    protected activity_table: Table;
    protected userId: string;
    constructor(params: WalletParams) {
        this.wallet_table = new Table("wallet");
        this.activity_table = new Table("wallet_activity")
        this.userId = params.userId;
    }

    protected async getUserAsset(coin_id: UUID) : Promise<GWObject | boolean> {
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

            if(isEmpty(asset)) {
                return false;
            }

            return asset[0] as GWObject;
        }
        catch(error) {
            throw new Error("Error fetching user's asset");
        }
    }

    protected async getUserAssets() : Promise<Array<GWObject>> {
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
            if(isEmpty(assets)) {
                return [];
            }
            return assets as Array<GWObject>;
        }
        catch(error) {
            throw new Error("Error fetching user's assets");   
        }  
    }

    protected async updateUserAsset(coinId: UUID, amount: number) {
        try {
            const asset = await this.getUserAsset(coinId);
            if(asset) {
                await this.wallet_table.update(
                    ["balance"],
                    [amount],
                    {
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
                    }
                );
            }
            else {
                await this.wallet_table.insert(
                    ["user_id", "coin_id", "balance"],
                    [this.userId, coinId, amount]
                );
            }
            return true;
        }
        catch(error) {
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


    protected async getWalletActivity(activity_id: UUID) : Promise<boolean | GWObject> {
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
            })

            if(isEmpty(activity)) {
                return false;
            }

            return activity[0] as GWObject;

        }
        catch(error) {
            throw new Error("Error fetching activity");
        }
    }


    protected async createWalletActivity(params: WalletActivity) {
        try {
            await this.activity_table.insert(
                    Object.keys(params),
                    Object.values(params)
            );
            return true;
            
        }
        catch(error) {
            console.error(error);
            throw(new Error("Error inserting new wallet activity."));
        }
    }

}


enum ACTIVITY_TYPE {
    credit = "credit",
    debit = "debit"
}

enum ReferenceOrigin {
    transaction = "transaction",
}

interface WalletActivity {
    user_id: string,
    coin_id: string,
    amount: number,
    activity_type: ACTIVITY_TYPE
    reference_id: string,
    reference_origin: ReferenceOrigin 
    reason: string
    created: string
}


class WalletDB extends WalletDBQueries {
    constructor(params : WalletParams){
        super(params);

    }


    async credit(coinId: string, amount: number, reason: CREDIT_REASONS, reference_id: string) : Promise<boolean> {
        const asset = await this.getUserAsset(coinId as UUID);
        let newAmount = amount;
        if(asset){
            const currentAmount = parseFloat(asset["balance"]);
            newAmount += currentAmount;
        }

        const date = new Date();
        const currentIsoTIme = date.toISOString();

        const activity : WalletActivity = {
            user_id: this.userId as UUID, 
            coin_id: coinId,
            amount: amount,
            activity_type: ACTIVITY_TYPE.credit,
            reference_id: reference_id,
            reference_origin: ReferenceOrigin.transaction,
            reason: CREDIT_REASONS.transaction_completed,
            created: currentIsoTIme
        }

        this.updateUserAsset(coinId as UUID, newAmount);
        this.createWalletActivity(activity);
        return true;

    }
    async debit(coinId: string, amount: number, reason: DEBIT_REASONS, reference_id: string) {
        const asset = await this.getUserAsset(coinId as UUID);
        let newAmount = amount;
        if(asset){
            const currentAmount = parseFloat(asset["balance"]);
            newAmount -= currentAmount;
        }
        const date = new Date();
        const currentIsoTIme = date.toISOString();

        const activity : WalletActivity = {
            user_id: this.userId as UUID, 
            coin_id: coinId,
            amount: amount,
            activity_type: ACTIVITY_TYPE.debit,
            reference_id: reference_id,
            reference_origin: ReferenceOrigin.transaction,
            reason: DEBIT_REASONS.settlement_completed,
            created: currentIsoTIme
        }
        this.updateUserAsset(coinId as UUID, newAmount);
        this.createWalletActivity(activity);
        return true;
    }
    log() {

    }
}

export { WalletDB, CREDIT_REASONS, DEBIT_REASONS };
