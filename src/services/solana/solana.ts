import web3 from "@solana/web3.js";
import { Wallet, WalletData } from "../../interfaces/wallet";
import { ChainTypes } from "../../enums/chain";
import { SolanaTransactions } from "../../db/transactions/transactions.db";
import Table from "../../db/query";
import { GWObject, isEmpty } from "../../utils/utils";

export default class Solana {
    async generate(isToken){
        try {
            const keyPair = web3.Keypair.generate();
          
            const walletData : Wallet = {
              chain: ChainTypes.SOLANA,
              address: keyPair.publicKey.toString(),
            }
          
            // save wallet's data
            
            const accountId = isToken ? this.subscribe(walletData.address) : 0;
            const completeWalletData : WalletData = {
              ...walletData, 
              key: keyPair.secretKey,
              accountId: accountId
            }
          
            this.saveWalletData(completeWalletData);
            
          
            return walletData.address;
        }
        catch(error) {
          throw new Error("Error generating solana address:\n " + error);
        }
    }

    async saveWalletData(wallet: WalletData) {
        const key = Uint8Array.from(wallet.key);
        const keyHex = Buffer.from(key).toString('hex');
        const { address, accountId } = wallet;


        const table = new Table("solana_wallets");
        await table.insert(
            [
                "address",
                "account_id",
                "account_key",
            ],
            [
                address,
                accountId,
                keyHex
            ]
        );
    }

    async getParsedTransaction(signature){
        try {
            const solana = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270");
            const transaction = await solana.getParsedTransaction(
              signature,
              { maxSupportedTransactionVersion: 0 }
            )


            return transaction;
        }
        catch(error){
            console.error(error);
            throw new Error("Error fetching parsed transaction");
        }
    }

    // subscription for sol
    subscribe(address){
        const publicKey = new web3.PublicKey(
            address
          );
          const solanaConnection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
            wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
          });
          const logId = solanaConnection.onLogs(
            publicKey,
            async (logs)=>{
                await this.parse(logs);
            },
            "finalized"
          );

    
          return logId;
    }

    unsubscribe(logId){
        const solanaConnection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
            wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
          });
        solanaConnection.removeOnLogsListener(logId);
    }

    async parse(logs, isToken = false){
        const { signature } = logs;
        if(signature){
            const parsedTransaction = await this.getParsedTransaction(signature);
            if(parsedTransaction) {
                const transaction = new SolanaTransactions();
                if(!isToken){
                    await transaction.parse(parsedTransaction);
                }
                else {
                    await transaction.parseForToken(parsedTransaction);
                }
            }
        }
    }

    watchTokens(tokenAddresses: Array<string>){
        for(const tokenAddress of tokenAddresses){
            const publicKey = new web3.PublicKey(
                tokenAddress
              );
              const solanaConnection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
                wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
              });
              solanaConnection.onLogs(
                publicKey,
                async (logs)=>{
                    const tokenTransferLogs = logs.logs.filter(log => 
                        log.includes('Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') ||
                        log.includes('Instruction: TransferChecked')
                    );

                    if (tokenTransferLogs.length > 0) {
                        //console.log(`Token transaction involving address ${publicKey}:`, tokenTransferLogs);
                        
                        this.parse(logs, true);
                    }
                },
                "finalized"
              );
        }
    }
}


export async function resubscribe(){
    const solanaTransactions = new SolanaTransactions();
    const unfinishedTransactions = await solanaTransactions.fetchUnfinished();
    const solana = new Solana();
    unfinishedTransactions.forEach(transaction => {
        if(transaction.coin == "sol"){
            solana.subscribe(transaction['deposit_address'])
        }
    });

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
                    key: "chain_id",
                    value: "5858cf99-31c0-4b7d-a66a-e0c65bbb7682"
                }
            ]
        }
    }) as GWObject[];

    if(!isEmpty(result)){
        const watch = result.filter((coin) => coin['contract_address'] != "Sol111111111111111111111111111112").map((token)=> token['contract_address']);
        solana.watchTokens(watch as string[]);
    }
}