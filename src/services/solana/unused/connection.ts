// import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, } from "@solana/web3.js";

// const WSS_ENDPOINT = 'wss://example.solana-devnet.quiknode.pro/000/'; // replace with your URL
// const HTTP_ENDPOINT = 'https://example.solana-devnet.quiknode.pro/000/'; // replace with your URL
// const solanaConnection = new Connection(clusterApiUrl("devnet"), "confirmed");
// const sleep = (ms:number) => {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// export async function startSolanaListening(address: string) {
//     const ACCOUNT_TO_WATCH = new PublicKey(address);
//     const subscriptionId = await solanaConnection.onAccountChange(
//         ACCOUNT_TO_WATCH,
//         (updatedAccountInfo) =>
//             console.log(`---Event Notification for ${ACCOUNT_TO_WATCH.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
//         "confirmed"
//     );
//     console.log('Starting web socket, subscription ID: ', subscriptionId);
//     await sleep(10000); //Wait 10 seconds for Socket Testing
//     await solanaConnection.requestAirdrop(ACCOUNT_TO_WATCH, LAMPORTS_PER_SOL);
// }