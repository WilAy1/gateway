import web3, { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { TransactionWalletData, Wallet, WalletData } from "../../interfaces/wallet";
import { ChainTypes } from "../../enums/chain";
import Table from "../../db/query";
import { GWObject, isEmpty } from "../../utils/utils";
import base58 from "bs58";
import { SolanaTransactions } from "../../db/transactions/solana.transactions.db";
import { getAccount, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { TransactionDB } from "../../db/transactions/transactions.db";
import { TransactionStatus } from "../../interfaces/TransactionStatus";

class Solana {
    protected connection: web3.Connection;
    
    constructor(){
        this.connection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
            wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
          });
    }

    async sendSol(address: string){
        try {
            if (!this.isValidSolanaAddess(address)) return console.error("Invalid address");

            const privateKey = base58.decode(
              "5aSQ5SoPxbYevAQw4wBydEm488KTM5idcHC2VZQAFYN4Htaj2JGcWCQoxhxpqRVf3qreSfSTQ1U8EyVZsRnEE6Xm"
            );
            const sender = Keypair.fromSecretKey(privateKey);
            const recipient = new PublicKey(address);

            // Send small fee (e.g. 0.01 SOL)
            const lamports = 0.005 * LAMPORTS_PER_SOL;

            const tx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: recipient,
                lamports,
              })
            );

            const signature = await sendAndConfirmTransaction(this.connection, tx, [sender], {commitment: "finalized"});

            console.log(`Credited ${address} with 0.01 SOL. Tx: ${signature}`);

            return true;
        }
        catch(error) {
            return false;
        }
    }

    isValidSolanaAddess(address: string) {
        try {
            const publicKey = new PublicKey(address);
            return PublicKey.isOnCurve(publicKey.toBuffer());
        }
        catch (_) {
            return false;
        }
    }
    async generate({ isToken }: { isToken: boolean; }){
        try {
            const keyPair = web3.Keypair.generate();
          
            const walletData : Wallet = {
              chain: ChainTypes.SOLANA,
              address: keyPair.publicKey.toString(),
            }
          
            // save wallet's data
            
            const accountId = !isToken ? this.subscribe(walletData.address) : 0;
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
        const keyBuffer = Buffer.from(key);
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
                keyBuffer
            ]
        );
    }

    async getWalletData(address: string) : Promise<TransactionWalletData> {
        const table = new Table("solana_wallets");
        const walletData = await table.select({
            cols: ["account_key", "address"],
            conditions: {
                compulsory: [
                    {
                        key: "address",
                        value: address
                     }
                ]
            }
        });
        if(isEmpty(walletData)) return null;
        return walletData[0] as TransactionWalletData;
    }

    async getParsedTransaction({ signature }: { signature: string; }){
        try {
            const solana = this.connection;
            const transaction = await solana.getParsedTransaction(
              signature,
              { maxSupportedTransactionVersion: 0 }
            )


            return transaction;
        }
        catch(error){
            console.error(error);
            this.getParsedTransaction({ signature });
            //throw new Error("Error fetching parsed transaction");
        }
    }

    // subscription for sol
    subscribe(address){
        const publicKey = new web3.PublicKey(
            address
          );
          const logId = this.connection.onLogs(
            publicKey,
            async (logs)=>{
                await this.parse(logs);
            },
            "finalized"
          );

    
          return logId;
    }

    unsubscribe(logId){
        this.connection.removeOnLogsListener(logId);
    }

    async parse(logs, isToken = false){
        const { signature } = logs;
        if(signature){
            const parsedTransaction = await this.getParsedTransaction({ signature });
            if(parsedTransaction) {
                const transaction = new SolanaTransactions();
                if(!isToken){
                    await transaction.parse(parsedTransaction);
                }
                else {
                    getTransactionDetails(parsedTransaction).then(async (walletAddress)=>{
                        await transaction.parseForToken(parsedTransaction, walletAddress);
                    }).catch((error)=>{
                        console.error(error);
                    });
                }
            }
        }
    }

    watchTokens(tokenAddresses: Array<string>){
        for(const tokenAddress of tokenAddresses){
            const publicKey = new web3.PublicKey(
                tokenAddress
              );
              this.connection.onLogs(
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
    async getWalletSolBalance(address) {
        const walletAddress = new PublicKey(address);

        const solBalanceLamports = await this.connection.getBalance(walletAddress);
        const solBalance = solBalanceLamports / 1e9;
        return solBalance;
    }
    async getWalletTokenBalance(address, token) {
        try {
            const tokenMint = new PublicKey(token);
            const walletAddress = new PublicKey(address);
            const ata = await getAssociatedTokenAddress(tokenMint, walletAddress);
            const tokenAccountInfo = await getAccount(this.connection, ata);
            const mintInfo = await getMint(this.connection, tokenMint);
            const decimals = mintInfo.decimals;

            const tokenBalance = Number(tokenAccountInfo.amount);
            const uiAmount = tokenBalance / Math.pow(10, decimals);
            return uiAmount;
        }
        catch {
            //
        }
    }
    async getLastHash(address){
        const walletAddress = new PublicKey(address);
        const signatures = await this.connection.getSignaturesForAddress(walletAddress, {
            limit: 1
        });

        if (signatures.length === 0) {
            return;
        }


        const lastTx = signatures[0];
        return lastTx;
}
}

export async function monitorPending(){
    const solanaTransactions = new SolanaTransactions();
    const unfinishedTransactions = await solanaTransactions.fetchUnfinished();
    const solana = new Solana();
    unfinishedTransactions.forEach(async transaction => {
            const id = transaction['id'] as string;
            const issuer = transaction['issuer_id'] as string;
            const amount_to_pay = transaction['amount_to_pay'] as number;

            let addressBalance = 0;

            if(transaction.coin == "sol"){
                addressBalance = await solana.getWalletSolBalance(transaction.deposit_address);
            }
            else {
                addressBalance = await solana.getWalletTokenBalance(transaction.deposit_address, transaction.coin_contract_address);
            }

            if(addressBalance >= amount_to_pay) {
                const transactionDB = new TransactionDB(issuer);
                const lastTx = await solana.getLastHash(transaction.deposit_address);
                const date = new Date();
                date.setTime(lastTx.blockTime * 1000);
                transactionDB.confirmTransaction(
                    {
                        transactionId: String(id),
                        transactionHash: lastTx.signature || "",
                        status: TransactionStatus.COMPLETED,
                        depositReceived: date.toISOString()
                    }
                );
            }
    })
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

const getTransactionDetails = (transaction) => {
    return new Promise((resolve, reject) => {
        const instructions = transaction.transaction.message.instructions;
    
        const promises = instructions.map(instruction => {
            if (instruction.programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
                const { destination } = instruction.parsed.info;
    
                return getWalletAddressFromTokenAccount(destination).then(destinationOwner => {
                    if (destinationOwner) {
                        resolve(destinationOwner); 
                    } else {
                        reject(new Error("No destination owner found"));
                    }
                }).catch(err => {console.error(err); reject(err)});
            }
    
            return Promise.resolve();
        });
    
        Promise.all(promises).then(() => {
            reject(new Error("No matching instructions found")); 
        });
    });
    
};


const getWalletAddressFromTokenAccount = async (tokenAccount) => {
    const connection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
        wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
      });
    const accountInfo = await connection.getParsedAccountInfo(new web3.PublicKey(tokenAccount));
    
    if (accountInfo.value) {
        //console.log(JSON.stringify(accountInfo.value));
        return accountInfo.value.data['parsed'].info.owner; // This is the wallet address
    }
    return null;
};


export default Solana;