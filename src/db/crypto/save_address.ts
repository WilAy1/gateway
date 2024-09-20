// import { env } from "../../utils/env";
// import pool from "../connect";
// import crypto from 'crypto';

// async function saveEncryptedData(data) {
//     // Encrypt the Uint8Array using a secure encryption algorithm and key
//     const encryptionKey : string = env.CHAINKEY || "enc"; // Replace with your encryption key

//     const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);

//     let encryptedData = cipher.update(data);
//     encryptedData = Buffer.concat([encryptedData, cipher.final()]);
  
//     // Convert the encrypted data to a bytea or hex string format suitable for storage
//     const byteaData = `\\x${encryptedData.toString('hex')}`; // Using bytea format
  
//     // Insert the encrypted data into the database table
//     const query = 'INSERT INTO wallets (data) VALUES ($1)';
//     await pool.query(query, [byteaData]);
//   }
  
//   // Example usage
//   const dataToEncrypt = new Uint8Array([1, 2, 3, 4, 5]);
//   saveEncryptedData(dataToEncrypt)
//     .then(() => console.log('Encrypted data saved to PostgreSQL'))
//     .catch(error => console.error('Error saving encrypted data:', error));