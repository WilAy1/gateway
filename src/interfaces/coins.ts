export interface UnitCoin {
    id: string,
    coin_id?: string,
    coin: string,
    contract_address: string,
    chain_id?: string,
    chain? : string
}

export interface Chain {
    [key: string] : ChainWithCoins
}

interface ChainWithCoins{
    chain: string,
    coins: UnitCoin[]
}
