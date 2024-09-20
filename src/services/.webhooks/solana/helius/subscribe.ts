// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { SolanaTransactions } from "../../../../db/transactions/transactions.db";
// import { subscribeWeb3JS } from "../web3js/subscribe";



// async function unfinishedAddresses(){
    
//     const transactionDB = new SolanaTransactions();
//     const unfinishedTransactions = await transactionDB.fetchUnfinished();
//     const addresses = [];
//     unfinishedTransactions.forEach(transaction => addresses.push(transaction['deposit_address']));

//     return addresses;
// }

// async function subscribe(){

//     const addresses = await unfinishedAddresses();

//     await fetch('https://api.helius.xyz/v0/webhooks/4596e384-28cd-42f6-b533-e1575e5a0b38?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270', {
//         method: 'PUT',
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             webhookURL: "https://0b32-104-28-212-104.ngrok-free.app/webhooks/solana/helius-transfer",
//             transactionTypes: ["TRANSFER"],
//             accountAddresses: addresses,
//             webhookType: "rawDevnet",
//             authHeader: "",
//             txnStatus: "successs"
//         }),
//     });

//     //console.log(response);

// }

// async function getWebhook(){
//     const response = await fetch('https://api.helius.xyz/v0/webhooks/4596e384-28cd-42f6-b533-e1575e5a0b38?api-key=1cda3a5d-09d7-4cc3-b8c8-ac12f40d2270', {
//         method: 'GET',
//         headers: {},
//     });
//     const data = await response.json();

//     console.log(data);
// }

// //subscribe();

// //getWebhook();

// subscribeWeb3JS("7fMxh9uK6GXLyUT4svwED9BLmKzg3e1MvcseAfG4By9D");

// export default subscribe;

