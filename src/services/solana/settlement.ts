import { env } from "../../utils/env";
import { TransactionWalletData } from "../../interfaces/wallet";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
} from "@solana/web3.js";
import { closeAccount, createTransferInstruction, getMint, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import base58 from "bs58";
import { isEmpty } from "../../utils/utils";
import Table from "../../db/query";
import { DEBIT_REASONS, WalletDB } from "../../db/wallet/wallet.db";



interface SolSettlementsArgs {
  settlementAddress: string, 
  transactionWalletData: TransactionWalletData,
  amountToSend: number, 
  feeToSend: number
}

interface SolTokenSettlementArgs {
  settlementAddress: string, 
  transactionWalletData: TransactionWalletData, 
  tokenAddress: PublicKey, 
  amountToSend: number, 
  feeToSend: number
}

class SolanaSettlements {
  coldWallet: PublicKey;
  protected connection: Connection;
  
  constructor(){
      this.connection = new Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
          wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
        });
      this.coldWallet = new PublicKey(env.COLD_WALLET_ADDRESS);
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

  async sendSol(address: string){
      try {
          if (!this.isValidSolanaAddess(address)) return console.error("Invalid address");
          const privateKey = base58.decode(
            env.SOL_FEE_DISBURSE_KEY
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
        console.error(error);
          return false;
      }
    }

  async settle({transaction, amount, fee, tokenAddress = null, settlementAddress, coinDetails} ): Promise<boolean> {
    try {
      const wallet = new WalletDB({ userId: transaction.issuer_id });
      if(transaction["coin"] == "sol"){
        const settled = await this.settleSol({settlementAddress: settlementAddress, transactionWalletData: await this.getWalletData(transaction["deposit_address"]), amountToSend: amount, feeToSend: fee })
        if(settled) wallet.debit(coinDetails.coin_id, amount, DEBIT_REASONS.settlement_completed, transaction.id);
      }
      else {
        const settled = await this.settleToken({settlementAddress: settlementAddress, transactionWalletData: await this.getWalletData(transaction["deposit_address"]), tokenAddress: new PublicKey(tokenAddress), amountToSend: amount, feeToSend: fee })
        if(settled) wallet.debit(coinDetails.coin_id, amount, DEBIT_REASONS.settlement_completed, transaction.id);
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }

  async settleSol({settlementAddress, transactionWalletData, amountToSend, feeToSend}: SolSettlementsArgs) {
    try {
    if (!this.isValidSolanaAddess(settlementAddress)) return console.error("Invalid address");

    // const success = await this.sendSol(settlementAddress);
    // if(!success) return; // log and don't remove from wallet
    // const rentExempt = await this.connection.getMinimumBalanceForRentExemption(0);
    const sender = Keypair.fromSecretKey(transactionWalletData.account_key);
    const balance = await this.connection.getBalance(sender.publicKey);
    const NETWORK_FEE = 5000; // reserve 5000 lamports for tx fee
    const lamportsToSend = Math.max(balance - NETWORK_FEE, 0);

    if (lamportsToSend <= 0) return console.error("No balance to settle."); // log, don't debit

    const recipients = [
      {pubKey: new PublicKey(settlementAddress), amount: Math.floor(amountToSend * LAMPORTS_PER_SOL)},
      {pubKey: this.coldWallet, amount: Math.floor(feeToSend * LAMPORTS_PER_SOL) - NETWORK_FEE}
    ];
    console.log(recipients);

    const tx = new Transaction();
    for (const recipient of recipients) {
        tx.add(
        SystemProgram.transfer({
          fromPubkey: sender.publicKey,
          toPubkey: recipient.pubKey,
          lamports: recipient.amount,
        })
      );
    }

    const signature = await sendAndConfirmTransaction(this.connection, tx, [sender], {commitment: "finalized"});
    console.log(`Settled ${lamportsToSend / LAMPORTS_PER_SOL} SOL to main wallet. Tx: ${signature}`);
    await this.log("settle", settlementAddress, this.coldWallet.toBase58(), lamportsToSend, signature);
    }
    catch (error) {
      console.error(error);
      return false;
    }
  }

  async settleToken({settlementAddress, transactionWalletData, tokenAddress, amountToSend, feeToSend}: SolTokenSettlementArgs){
    try{  
    if (!this.isValidSolanaAddess(settlementAddress)) return console.error("Invalid address");

      const success = await this.sendSol(transactionWalletData.address);
      if(!success) return; // log and don't remove from wallet

      const sender = Keypair.fromSecretKey(transactionWalletData.account_key);

      const tokenInfo = await getMint(this.connection,tokenAddress);

      const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        sender,
        tokenAddress,
        sender.publicKey
      );

      console.log("sender token accojunt", senderTokenAccount)

      const settlementTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        sender,
        tokenAddress,
        new PublicKey(settlementAddress)
      );

      console.log("settlement", settlementTokenAccount);

      console.log(        this.connection,
        sender,
        tokenAddress,
        this.coldWallet);

      const coldWalletTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        sender,
        tokenAddress,
        this.coldWallet
      );

      console.log("cold", coldWalletTokenAccount);


      const amountToSettlement = BigInt(Math.floor(amountToSend * 10 ** tokenInfo.decimals));
      const amountToColdWallet = BigInt(Math.floor(feeToSend * 10 ** tokenInfo.decimals));

      const settlementTranserIx = createTransferInstruction(
        senderTokenAccount.address,
        settlementTokenAccount.address,
        sender.publicKey,
        amountToSettlement,
        [],
        TOKEN_PROGRAM_ID
      );

      const coldWalletTranserIx = createTransferInstruction(
        senderTokenAccount.address,
        coldWalletTokenAccount.address,
        sender.publicKey,
        amountToColdWallet,
        [],
        TOKEN_PROGRAM_ID
      );

      const tx = new Transaction();
      tx.add(settlementTranserIx, coldWalletTranserIx);
      await sendAndConfirmTransaction(this.connection, tx, [sender], {commitment: "finalized"});

      const closeTx = await closeAccount(
        this.connection,
        sender,
        senderTokenAccount.address,
        this.coldWallet, // where to send remaining rent
        sender.publicKey
      );
      console.log("✅ Token account closed:", closeTx);

      return true;
    }
    catch (error) {
      console.error(error);
      return false;
    }
  }

  async getBalance(address: string) {
    if (!this.isValidSolanaAddess(address)) return 0;
    const balance = await this.connection.getBalance(new PublicKey(address));
    return balance / LAMPORTS_PER_SOL;
  }

  async log(type: string, from: string, to: string, amount: number, tx: string) {
    console.log(`[${type.toUpperCase()}] From: ${from} → To: ${to} | Amount: ${amount / LAMPORTS_PER_SOL} SOL | Tx: ${tx}`);
    // You can extend this to store logs in a DB or file
  }

  async updateLog() {
    // If you want to update an existing log (e.g., status tracking)
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
}

export default SolanaSettlements;


// const solanaSettlement = new SolanaSettlements();
// solanaSettlement.settle({
//   transaction: {
//     id: '62eb013a-5f30-4493-9e92-07b5c07a3abd',
//     issuer_id: '54c91f1c-9ae9-45aa-9825-c16800f7881f',
//     type: 'payment',
//     amount: '500.00',
//     currency: 'ngn',
//     reference: 'gwp_7MQG4Ne3BTsTXCTpsktj5',
//     description: 'Payment',
//     created_at:' 2025-11-13T23:48:40.597Z',
//     completed_at: null,
//     cancelled_at: null,
//     cancellation_reason: null,
//     status: 'awaiting_payment',
//     payment_method: 'platform',
//     payment_channel: null,
//     customer_email: 'awakintade@gmail.com',
//     customer_metadata: null,
//     application_fee: null,
//     fees_denomination: null,
//     metadata: {},
//     callback_url: '',
//     chain: 'solana',
//     deposit_address: 'B5uNDv31Y43AGN5nCXYAZT2Q1GNFM9THJY8LoJgLLV6Q',
//     coin: 'usdc',
//     exchange_rate: '0.0006583247',
//     onchain_transaction_hash: null,
//     onchain_status: 'waiting',
//     coin_price_usd: '1.00',
//     currency_price_usd: '1518.40',
//     amount_to_pay: '0.32916233',
//     deposit_received_at: null,
//     device_type: null,
//     useragent: null,
//     ipaddress: null,
//     address_generated_at: "2025-11-13T23:56:24.632Z",
//     customer_id: null,
//     coin_contract_address: '9KYPJcrigssYzkLzpE3weFs1cL72tggNfvSWHKqTPGtD'
//   },
//   amount: 0.296246097,
//   fee: 0.032916233,
//   tokenAddress: '9KYPJcrigssYzkLzpE3weFs1cL72tggNfvSWHKqTPGtD',
//   settlementAddress: '2BN8mR3KoPLCYtdGBKGgmazTVSraQa3JgkArDcYLyySF'
// });
                        


// const trabsaction = 
// {
//   id: '18bbb566-4d5e-4506-957c-9096e003927d',
//   issuer_id: '54c91f1c-9ae9-45aa-9825-c16800f7881f',
//   type: 'payment',
//   amount: '5000.00',
//   currency: 'ngn',
//   reference: 'gwp_DdO8owB5iIBdWUPQ7U5ud',
//   description: 'Payment',

//   completed_at: null,
//   cancelled_at: null,
//   cancellation_reason: null,
//   status: 'awaiting_payment',
//   payment_method: 'platform',
//   payment_channel: null,
//   customer_email: 'awakintade@gmail.com',
//   customer_metadata: null,
//   application_fee: null,
//   fees_denomination: null,
//   metadata: {},
//   callback_url: '',
//   chain: 'solana',
//   deposit_address: '2ifMkVeD7DwJBQnXhnQzSxaVLULhrnQbgYvyeTzSDhZD',
//   coin: 'sol',
//   exchange_rate: '0.0000033821',
//   onchain_transaction_hash: null,
//   onchain_status: 'waiting',
//   coin_price_usd: '194.73',
//   currency_price_usd: '1518.40',
//   amount_to_pay: '0.01691029',
//   deposit_received_at: null,
//   device_type: null,
//   useragent: null,
//   ipaddress: null,
//   customer_id: null,
//   coin_contract_address: 'Sol111111111111111111111111111112'
// } 
// const solanass = new SolanaSettlements();
// solanass.settle({
//   transaction: trabsaction,
//   amount: 0.015219261000000001 ,
//   fee: 0.0016910290000000001 ,
//   tokenAddress: "Sol111111111111111111111111111112" ,
//   settlementAddress: "HKTF6b2N22QL7cK3BcXMk2EK3wseajrHRk6oNmx94LAC"
// })



// const ey = new Uint8Array([
//    81, 192,  79, 167, 146, 199,  79, 220,  37, 238, 153,
//    35,  98,  93, 245, 201, 253, 180, 122, 148, 137,  79,
//   158,  21, 124, 164,  18, 230, 117, 164,  86, 144,  94,
//   217,  63, 143, 104, 166, 138, 136,   6,  48,  72,  91,
//    44, 109,  73, 222, 224, 189, 119,  81,  17, 235, 172,
//    21,  90, 132, 210, 196,  16, 163,  11, 107
// ]);
// const cd = Buffer.from(ey).toString("hex");

// console.log(new Uint8Array(Buffer.from(cd, "hex")))
