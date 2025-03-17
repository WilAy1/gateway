import { ethers } from "ethers"
import crypto from "crypto";


export default class Ethereum {
    generate(){
       const id = crypto.randomBytes(32).toString('hex');
       const privateKey = "0x"+id;

       const wallet = new ethers.Wallet(privateKey);
       wallet

    }
    saveWalletData
}