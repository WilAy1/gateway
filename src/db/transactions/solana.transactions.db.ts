import Table from "../query";
import { GWObject, isEmpty } from "../../utils/utils";
import { TransactionStatus } from '../../interfaces/TransactionStatus';
import { ChainTypes } from "../../enums/chain";
import Solana from "../../services/solana/solana";
import { TransactionDB } from "./transactions.db";

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

export { SolanaTransactions }