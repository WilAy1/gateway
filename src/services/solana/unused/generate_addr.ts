/* eslint-disable @typescript-eslint/no-unused-vars */
import solanaWeb3 from "@solana/web3.js";
import { Wallet, WalletData } from "../../../interfaces/wallet";
import { ChainTypes } from "../../../enums/chain";


// const generateSolanaWallet = async () : Promise<string> => {
//   try {
//   const keyPair = solanaWeb3.Keypair.generate();

//   const walletData : Wallet = {
//     chain: ChainTypes.SOLANA,
//     address: keyPair.publicKey.toString(),
//   }

//   // save wallet's data

//   const accountId = subscribeWeb3JS(walletData.address);
//   const completeWalletData : WalletData = {
//     ...walletData, 
//     key: keyPair.secretKey,
//     accountId: accountId
//   }

//   saveSolanaWalletData(completeWalletData);
  

//   return walletData.address;
//   }
//   catch(error) {
//     throw new Error("Error generating solana address:\n " + error);
//   }

// };


// function saveSolanaWalletData(wallet: WalletData) {
//   const key = Uint8Array.from(wallet.key);
//   const keyHex = Buffer.from(key).toString('hex');
//   const { address } = wallet;
  
  
  
// }

// export default generateSolanaWallet;