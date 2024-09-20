import { UUID } from "crypto";
import { GWObject, isEmpty } from "../../utils/utils";
import Table from "../query";


type WalletParams = {
    userId: string
}
enum CREDIT_REASONS {
    transaction_completed = "transaction_completed"
}

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

class WalletDBQueries{
    protected wallet_query: Table;
    protected activity_query: Table;
    protected userId: string;
    constructor(params: WalletParams) {
        this.wallet_query = new Table("wallet");
        this.activity_query = new Table("wallet_activity")
        this.userId = params.userId;
    }

    protected async getWallet() : Promise<boolean | GWObject> {
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
                await this.wallet_query.update(
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
    }


    protected async getWalletActivity(activity_id: UUID) : Promise<boolean | GWObject> {
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
            const wallet = this.getWallet();
            if(wallet) {
                await this.activity_query.insert(
                    Object.keys(params),
                    Object.values(params)
                );
                return true;
            }
            return false;
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
    wallet_id: string,
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


    async credit(amount: number, reason: CREDIT_REASONS, reference_id: string) {
        const wallet = await this.getWallet();
        if(!wallet){
            return
        }

        const currentAmount = parseFloat(wallet["balance"]);

        if(isNaN(currentAmount)) return;
        
        const newAmount = currentAmount + amount;
        console.log(currentAmount, amount, newAmount);
        const date = new Date();
        const currentIsoTIme = date.toISOString();

        const activity : WalletActivity = {
            user_id: this.userId as UUID, 
            wallet_id: wallet["wallet_id"],
            amount: amount,
            activity_type: ACTIVITY_TYPE.credit,
            reference_id: reference_id,
            reference_origin: ReferenceOrigin.transaction,
            reason: CREDIT_REASONS.transaction_completed,
            created: currentIsoTIme
        }

        this.updateWallet(
            [
                "balance",
                "last_used"
            ],
            [
                newAmount,
                currentIsoTIme
            ]
        )
        this.createWalletActivity(activity);

    }
    debit() {

    }
    log() {

    }
}

export { WalletDB, CREDIT_REASONS };
