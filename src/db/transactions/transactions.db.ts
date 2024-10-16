import { CREDIT_REASONS, WalletDB } from "../wallet/wallet.db";
import Table from "../query";
import { GWObject, isEmpty } from "../../utils/utils";
import { TransactionStatus } from '../../interfaces/TransactionStatus';
import { ChainTypes } from "../../enums/chain";
import Solana from "../../services/solana/solana";
import { DBSelectParams } from "../../interfaces/db.interface";


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

    async confirmTransaction(transactionParam: ConfirmTransactionParam) : Promise<boolean> {
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

                const update = await this.updateTransaction(transactionId, 
                    Object.keys(updateObject),
                    Object.values(updateObject)
                )


                //await subscribe();

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


class SolanaTransactions {

    private transactions: Table;
    private walletTable: Table;
    
    constructor() {
        this.transactions = new Table("transactions");
        this.walletTable = new Table("solana_wallets");
    }

    async fetchAll(){

    }

    async fetchWalletData(address: string){
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
            })
        
            if(wallet){
                return wallet[0];
            }
            return;
        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching wallet data");
        }
    }

    async fetchUnfinished(){
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "chain",
                            value: ChainTypes.SOLANA
                        },
                        {
                            key: "status",
                            value: TransactionStatus.AWAITINGPAYMENT
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

    async findTransactionWithAddress(address){
        try {
            const transaction = await this.transactions.select({
                conditions: {
                    compulsory: [
                        {
                            key: "chain",
                            value: ChainTypes.SOLANA
                        },
                        {
                            key: "deposit_address",
                            value: address
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

    async parse(payload){
            const { meta, transaction, blockTime } = payload;
            const { postBalances } = meta;
            const { message, signatures } = transaction;
            const { accountKeys } = message;

            
            const depositAddress = accountKeys[1]['pubkey'].toString();
            const transactionHash = signatures[0];
            const addressBalance = postBalances[1] / 1000000000;
            
            
            const transactions = await this.findTransactionWithAddress(depositAddress);
            if(isEmpty(transactions)){
                return
            }

        
            const id = transactions[0]['id'] as string;
            const issuer = transactions[0]['issuer_id'] as string;
            const amount_to_pay = transactions[0]['amount_to_pay'] as number;
            const date = new Date();
            date.setTime(blockTime * 1000);

            if(addressBalance >= amount_to_pay) {
                const transactionDB = new TransactionDB(issuer);
                await transactionDB.confirmTransaction(
                    {
                        transactionId: String(id),
                        transactionHash: transactionHash,
                        status: TransactionStatus.COMPLETED,
                        depositReceived: date.toISOString()
                    }
                );

                const walletAddress = this.fetchWalletData(depositAddress);
                if(walletAddress){
                    const logId = walletAddress['account_id'];
                    const solana = new Solana();
                    solana.unsubscribe(logId);
                }
            }
            else if(addressBalance < amount_to_pay){
                //
            }
        
        
        }

        async parseForToken(payload, depositAddress){
            const parsedInstr =  payload.transaction.message.instructions.find((instr)=> instr.programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
            if(!parsedInstr) return;
            const tokenId = parsedInstr.parsed.info.mint;
            const { meta, transaction, blockTime } = payload;
            const { postTokenBalances } = meta;
            const {  signatures } = transaction;


            const addressBalance = postTokenBalances.find((tokenBalances) => tokenBalances.owner == depositAddress).uiTokenAmount.uiAmount;
            const transactionHash = signatures[0];

            const transactions = await this.findTransactionWithAddress(depositAddress);
            if(isEmpty(transactions)){
                return
            }
            
            const coin = transactions[0]['coin'] as string;
            const { contract_address } = await this.getCoinDetails(coin);

            if(contract_address != tokenId){
                console.log("wrong token for transaction")
                return;
            }


        
            const id = transactions[0]['id'] as string;
            const issuer = transactions[0]['issuer_id'] as string;
            const amount_to_pay = transactions[0]['amount_to_pay'] as number;
            const date = new Date();
            date.setTime(blockTime * 1000);

            if(addressBalance >= amount_to_pay) {
                const transactionDB = new TransactionDB(issuer);
                await transactionDB.confirmTransaction(
                    {
                        transactionId: String(id),
                        transactionHash: transactionHash,
                        status: TransactionStatus.COMPLETED,
                        depositReceived: date.toISOString()
                    }
                );

                // const walletAddress = this.fetchWalletData(depositAddress);
                // if(walletAddress){
                //     const logId = walletAddress['account_id'];
                //     const solana = new Solana();
                //     solana.unsubscribe(logId);
                // }
            }
            
        }

        async getCoinDetails(coin){
            const coinsTable = new Table("available_coins");
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
            }) as GWObject[];

            if(isEmpty(result)){
                return;
            }

            return result[0];
        }
}



export { TransactionDB, SolanaTransactions, TransactionsDBQueries };