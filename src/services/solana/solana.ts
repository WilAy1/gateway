import web3 from "@solana/web3.js";
import { Wallet, WalletData } from "../../interfaces/wallet";
import { ChainTypes } from "../../enums/chain";
import { SolanaTransactions } from "../../db/transactions/transactions.db";
import Table from "../../db/query";

export default class Solana {
    async generate(){
        try {
            const keyPair = web3.Keypair.generate();
          
            const walletData : Wallet = {
              chain: ChainTypes.SOLANA,
              address: keyPair.publicKey.toString(),
            }
          
            // save wallet's data
          
            const accountId = this.subscribe(walletData.address);
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

    async parse(logs){
        const { signature } = logs;
        if(signature){
            const parsedTransaction = await this.getParsedTransaction(signature);
            if(parsedTransaction) {
                const transaction = new SolanaTransactions();
                await transaction.parse(parsedTransaction);
            }
        }
    }

}

export async function resubscribe(){
    const solanaTransactions = new SolanaTransactions();
    const unfinishedTransactions = await solanaTransactions.fetchUnfinished();
    const solana = new Solana();
    unfinishedTransactions.forEach(transaction => {
        solana.subscribe(transaction['deposit_address'])
    });
}