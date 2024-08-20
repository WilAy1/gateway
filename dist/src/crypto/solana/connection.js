"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSolanaListening = void 0;
const web3_js_1 = require("@solana/web3.js");
const WSS_ENDPOINT = 'wss://example.solana-devnet.quiknode.pro/000/'; // replace with your URL
const HTTP_ENDPOINT = 'https://example.solana-devnet.quiknode.pro/000/'; // replace with your URL
const solanaConnection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
async function startSolanaListening(address) {
    const ACCOUNT_TO_WATCH = new web3_js_1.PublicKey(address);
    const subscriptionId = await solanaConnection.onAccountChange(ACCOUNT_TO_WATCH, (updatedAccountInfo) => console.log(`---Event Notification for ${ACCOUNT_TO_WATCH.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / web3_js_1.LAMPORTS_PER_SOL, ' SOL'), "confirmed");
    console.log('Starting web socket, subscription ID: ', subscriptionId);
    await sleep(10000); //Wait 10 seconds for Socket Testing
    await solanaConnection.requestAirdrop(ACCOUNT_TO_WATCH, web3_js_1.LAMPORTS_PER_SOL);
}
exports.startSolanaListening = startSolanaListening;
//# sourceMappingURL=connection.js.map