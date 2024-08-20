"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const web3_js_1 = __importDefault(require("@solana/web3.js"));
const chain_1 = require("../../enums/chain");
const generateSolanaWallet = async () => {
    try {
        const keyPair = web3_js_1.default.Keypair.generate();
        const walletData = {
            chain: chain_1.ChainTypes.SOLANA,
            address: keyPair.publicKey.toString(),
        };
        // save wallet's data
        const completeWalletData = {
            ...walletData,
            key: keyPair.secretKey
        };
        console.log(walletData);
        return walletData.address;
    }
    catch (error) {
        throw new Error("Error generating solana address:\n " + error);
    }
};
function saveWalletData(wallet) {
}
exports.default = generateSolanaWallet;
//# sourceMappingURL=generate_addr.js.map