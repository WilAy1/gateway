/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConditionChild } from "../../interfaces/db.interface";
import { TransactionStatus } from "../../interfaces/TransactionStatus";
import { isEmpty } from "../../utils/utils";
import Table from "../query";
import { TransactionDB } from "../transactions/transactions.db";

class RefundsDB {
    private refundsTable: Table;
    private transactionsTable: Table;
    private userId: string;
    constructor(userId: string) {
        this.userId = userId;
        this.refundsTable = new Table("refunds");
        this.transactionsTable = new Table("transactions");
    }
    async fetch({
        refundId = null,
        transactionId = null
    } = {}) {
        try {
            if(!refundId && !transactionId) {
                // fetch all
                return await this.refundsTable.select({conditions: {
                    compulsory: [
                        {
                            key: "issuer_id",
                            value: this.userId
                        }
                    ]
                }});
            }
            else {
                const compulsoryConditions: ConditionChild[] = [];
                if(refundId){
                    compulsoryConditions.push({key: "id", value: refundId});
                }
                if(transactionId){
                    compulsoryConditions.push({key: "transaction_id", value: refundId});
                }
                const refunds = await this.refundsTable.select({conditions: {
                    compulsory: compulsoryConditions
                }});

                return refunds;

            }
        }
        catch(error) {
            console.error(error);
            throw new Error("Error fetching refunds");
        }
    }
    async create({
        txID,
        refundAddress,
        amount,
        refundReason
    }) {
        try {
            const originalTransaction = await this.fetch({transactionId: txID});
            if(!originalTransaction) return {error: "Refund has been previously created for this transaction."};
            
            const transactionDB = new TransactionDB(this.userId);
            const tx = transactionDB.fetchTransaction(txID);
            if(!tx) return {error: "Invalid transaction provided"};
            
            const newRefund = await this.refundsTable.insert(
                [
                    "issuer_id",
                    "transaction_id",
                    "refund_amount",
                    "original_amount",
                    "coin",
                    "refund_address",
                    "status",
                    "reason_for_refund",
                ],
                [
                    this.userId,
                    txID,
                    amount,
                    originalTransaction['amount_to_pay'],
                    originalTransaction['coin'],
                    refundAddress,
                    TransactionStatus.INITIALIZED,
                    refundReason,
                ],
                {
                    returnColumn: "id"
                }
            );
        
            if(!newRefund) return {error: "Failed to create refund"};
        
            return await this.fetch({refundId: newRefund['id']});
        }
        catch(error) {
            throw new Error(`Error creating refund: ${error}`)
        }
    }
    async updateRefunds({
        id, status 
    }){
        try {
            const keys = ["status"];
            const values = [status];

            if(status == "completed") {
                const date = new Date();
                keys.push("completed_at");
                values.push(date.toISOString());
            }

            await this.refundsTable.update(keys, values, {
                compulsory: [
                    {
                        key: "id",
                        value: id
                    },
                    {
                        key: "issuer_id",
                        value: this.userId
                    }
                ]
            });

            return await this.fetch({refundId: id});
        }
        catch (error) {
            throw new Error(`Error updating refund: ${error}`)
        }
    }
}






