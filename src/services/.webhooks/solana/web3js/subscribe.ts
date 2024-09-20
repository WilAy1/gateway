// import web3 from "@solana/web3.js";

// export function subscribeWeb3JS(address){
//     const publicKey = new web3.PublicKey(
//         address
//       );
//       const solanaConnection = new web3.Connection("https://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270", {
//         wsEndpoint: "wss://devnet.helius-rpc.com/?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270",
//       });
//       const accountId = solanaConnection.onLogs(
//         publicKey,
//         (logs, context)=>{
//           console.log("Updated account info: ", logs, context)
//         },
//         "confirmed"
//       );

//       return ;
// }

// export async function unsubscribeWeb3JS(accountId){

//     const solanaConnection = new web3.Connection("https://docs-demo.solana-mainnet.quiknode.pro/", {
//         wsEndpoint: "wss://docs-demo.solana-mainnet.quiknode.pro/",
//     });
//     solanaConnection.removeAccountChangeListener(accountId);
// }

// //subscribeWeb3JS("7fMxh9uK6GXLyUT4svwED9BLmKzg3e1MvcseAfG4By9D");