import { CREDIT_REASONS, WalletDB } from "../wallet/wallet.db";
import Table from "../query";
import { GWObject, isEmpty, isValidUUID } from "../../utils/utils";
import { TransactionStatus } from '../../interfaces/TransactionStatus';
import { ChainTypes } from "../../enums/chain";
import { Condition, DBSelectParams } from "../../interfaces/db.interface";
import { fetchCoin } from "../crypto/functions.db";
import SolanaSettlements from "../../services/solana/settlement";
import Settlements from "../settlements/settlements";


class TransactionsDBQueries {
    
    private transactions: Table;
    protected issuer: string;
    
    constructor(issuer?: string) {
        this.transactions = new Table("transactions");
        if(issuer) this.issuer = issuer;
    }

    async fetchTransactions(params?: DBSelectParams) : Promise<Array<GWObject>> {
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
            return transaction as Array<GWObject>;

        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching transactions");
        }   
    }

    async fetchTransaction(transaction_id: string) : Promise<GWObject>{
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
                return;
            }
            return transaction[0] as GWObject;

        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching transaction");
        }   
    }

    async transactionExists(transactionId) : Promise<boolean> {
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


            return !isEmpty(transaction);      
        }
        catch(error){
            console.error(error);
            return false;
        } 
    }

    async updateTransaction(transactionId: string, keys: Array<string>, values: Array<unknown>, conditions?: Condition) : Promise<boolean> {
        const transaction = await this.transactionExists(transactionId);
        if(transaction){
            this.transactions.update(keys, values, {
                compulsory: [
                    {
                        key: "id",
                        value: transactionId as unknown
                    }
                ].concat(conditions?.compulsory || []),
                optional: conditions?.optional || null
            });

            return true;
        }
        return false;
    }
}

interface ConfirmTransactionParam {
    transactionId: string
    transactionHash: string,
    status: TransactionStatus
    depositReceived: string
}

class TransactionDB extends TransactionsDBQueries {

    constructor(issuer?: string) {
        super(issuer);
    }

    async cancelTransaction({id}: {id: string}) {
        if(!isValidUUID(id)) return false

        try {
            const date = new Date();
            const isoTime = date.toISOString();

            const conditions: Condition  = {
                optional: [
                {
                    key: "status",
                    value: TransactionStatus.AWAITINGPAYMENT
                },
                {
                    key: "status",
                    value: TransactionStatus.INITIALIZED
                },
            ]};

            const update = await this.updateTransaction(id, ['cancelled_at', 'status'], [isoTime, TransactionStatus.CANCELLED], conditions);

            return update;
        }
        catch {
            return false;
        }
    }

    async confirmTransaction(transactionParam: ConfirmTransactionParam) : Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Webhook, WebhookEvent } = require("../../webhook/webhook");
        const { transactionId, transactionHash, status: transactionStatus, depositReceived } = transactionParam;

        try {
            const transaction = await this.fetchTransaction(transactionId);
            if(!transaction){
                return
            }


            if(
                transaction["status"] != TransactionStatus.COMPLETED && 
                transaction["status"] != TransactionStatus.INITIALIZED && 
                transaction["status"] != TransactionStatus.CANCELLED
            ){  
                

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
                }

                const coinDetails = await fetchCoin(null, {
                    coinName: transaction["coin"],
                    chainName: transaction["chain"]
                });

                if(!coinDetails){
                    console.error("Coin details not found for transaction: ", transactionId);
                    return false;
                }

                const update = await this.updateTransaction(transactionId, 
                    Object.keys(updateObject),
                    Object.values(updateObject)
                )
                
                //await subscribe();

                if(!update) return false


                // credit based on settlement fallback to credit if failed  

                const wallet = new WalletDB({ userId: this.issuer });
                const creditStatus = await wallet.credit(coinDetails.coin_id, amount_to_credit, CREDIT_REASONS.transaction_completed, transactionId);
                
                const webhook = new Webhook(this.issuer);
                webhook.sendTransaction(transactionId, WebhookEvent.TRANSACTION_COMPLETED);

                // start settlement

                if(transaction.chain == ChainTypes.SOLANA){
                    const settlement = new Settlements(this.issuer);
                    const settlementAddress = await settlement.get({byChainId: coinDetails.chain_id});
                    if(settlementAddress.length > 0){
                        const solanaSettlement = new SolanaSettlements();
                        solanaSettlement.settle({transaction: transaction, amount: amount_to_credit, fee: application_fee, tokenAddress: coinDetails.contract_address, settlementAddress: settlementAddress[0]["address"], coinDetails: coinDetails});
                        //if(settled) wallet.debit(coinDetails.coin_id, amount_to_credit, DEBIT_REASONS.settlement_completed, transactionId);
                    }
                }
                


                return creditStatus ?? false;
                

                

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






export { TransactionDB, TransactionsDBQueries };