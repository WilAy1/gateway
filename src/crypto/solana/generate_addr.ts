import solanaWeb3 from "@solana/web3.js";

const generateKey = async () => {
    console.log("Start");
  const keyPair = solanaWeb3.Keypair.generate();

  console.log("Public Key:", keyPair.publicKey.toString());
  console.log("Secret Key:", keyPair.secretKey)
};

export default generateKey;