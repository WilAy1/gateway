/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "ethers"
import crypto from "crypto";
import { EthereumWalletData, WalletData } from "../../interfaces/wallet";
import { ChainTypes } from "../../enums/chain";


export default class Ethereum {
    async generate(){
       const id = crypto.randomBytes(32).toString('hex');
       const privateKey = "0x"+id;

       const wallet = new ethers.Wallet(privateKey);
       
       console.log(wallet.address, wallet.privateKey);

       return 
       // save wallet's data

       //const accountId = 
        const walletData : EthereumWalletData = {
            chain: ChainTypes.ETHEREUM,
            address: wallet.address,
            key: wallet.privateKey,
        }
    }
    async saveWalletData(wallet: EthereumWalletData) {

    }

    async watch(address: string){
        
    }
}   