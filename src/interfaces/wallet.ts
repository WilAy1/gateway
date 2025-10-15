export interface Wallet {
    chain: string,
    address: string,
}

export interface WalletData extends Wallet {
    key: Uint8Array,
    accountId: number
}


export interface EthereumWalletData extends Wallet {
    key: string
}