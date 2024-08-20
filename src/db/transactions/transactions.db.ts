import { CREDIT_REASONS, WalletDB } from "../wallet/wallet.db";
import Query from "../query";
import { GWObject, isEmpty } from "../../utils/utils";
import { TransactionStatus } from "../../api/private/transaction/create_transaction";


class TransactionsDBQueries {
    
    private transactions: Query;
    protected issuer: string;
    
    constructor(issuer: string) {
        this.transactions = new Query("transactions");
        this.issuer = issuer;
    }

    async fetchTransactions() : Promise<Array<GWObject>> {
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
            return transaction as Array<GWObject>;

        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching transactions");
        }   
    }

    async fetchTransaction(transaction_id: string) : Promise<boolean | GWObject>{
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


            if(isEmpty(transaction)){
                return false;
            }
            return transaction[0] as GWObject;

        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching transaction");
        }   
    }

    async updateTransaction(transactionId: string, keys: Array<string>, values: Array<unknown>) : Promise<boolean> {
        const transaction = await this.fetchTransaction(transactionId);
        if(transaction){
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

    constructor(issuer: string) {
        super(issuer);
    }

    async confirmTransaction(transactionId: string) : Promise<boolean> {

        try {
            const transaction = await this.fetchTransaction(transactionId);
            if(!transaction){
                return
            }


            if(transaction["status"] != TransactionStatus.COMPLETED){  
                

                const date = new Date();
                const isoTime = date.toISOString();
                const status = TransactionStatus.COMPLETED;
                const channel = "";
                const application_fee = 0.1 * parseFloat(transaction["amount_to_pay"] || 0);
                const amount_to_credit = parseFloat(transaction["amount_to_pay"]) - application_fee;
                const fees_denomination = transaction["coin"];
                const onchain_status = TransactionStatus.COMPLETED;


                const updateObject = {
                    status: status,
                    payment_channel: channel,
                    application_fee: application_fee,
                    fees_denomination: fees_denomination,
                    onchain_status: onchain_status,
                    completed_at: isoTime
                }

                const update = await this.updateTransaction(transactionId, 
                    Object.keys(updateObject),
                    Object.values(updateObject)
                )

                if(update) {
                    const wallet = new WalletDB({ userId: this.issuer });
                    await wallet.credit(amount_to_credit, CREDIT_REASONS.transaction_completed, transactionId);
                    return true;
                }
            }
            return false;
        }
        catch(error) {
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


export { TransactionDB };