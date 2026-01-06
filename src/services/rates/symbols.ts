export const SYMBOLS = [
    // {
    //     id: "ngn",
    //     ticker: "USDTNGN",
    // },
    {
        id: "sol",
        ticker: "SOLUSDT"
    },
    {
        id: "eth",
        ticker: "ETHUSDT"
    },
    {
        id: "btc",
        ticker: "BTCUSDT"
    },
    {
        id: "usdc",
        ticker: "USDCUSDT"
    }
]

export function getSymbolId (ticker){
    const currency = SYMBOLS.find((symbol)=>symbol.ticker == ticker);
    if(currency) return currency.id;
}