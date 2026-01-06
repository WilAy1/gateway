import axios from 'axios';
import { getSymbolId, SYMBOLS } from './symbols';
import { createClient } from 'redis';

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment!");
}

export default class Rates {

    async fetchRates(){
        const tickers = SYMBOLS.map((symbol) => symbol.ticker);

        try {
            const response = await axios.get('https://api.binance.us/api/v3/ticker/price', {
                params: {
                    symbols: JSON.stringify(tickers)
                }
            });
            const rates = response.data.map((res)=>{
                return {
                    id: getSymbolId(res.symbol),
                    rate: parseFloat(res.price)
                }
            });
            rates.push({id:"usd", rate:1}, {id: "usdt", rate: 1});
            
            this.cacheRates(rates).then((c)=>console.log("cache successful", c)).catch((error)=>console.log(error));
        } catch (error) {
            console.log(error)
            //
        }
    }

    async cacheRates(rates){
        const client = createClient({
            url: process.env.REDIS_URL
        });
        client.connect().catch(console.error);
        if(client){
            try {
                for (const rate of rates) {
                    try {
                        await client.setEx(rate.id, 120, JSON.stringify(rate));
                    } catch (err) {
                        console.error(`Failed to save rate for ${rate.id}:`, err);
                    }
                }
            } catch (error) {
                console.error('Error caching rates:', error);
            }
        }
    }

    async getRate(id: string){
        try {
            const client = createClient({
            url: process.env.REDIS_URL
        });
            client.connect().catch(console.error);
            const reply = await client.get(id);
            console.log("reply", reply)
            return JSON.parse(reply) as APIRate;
          } catch (err) {
            console.log(err);
            throw new Error(`Failed to get rate for ${id}: ${err.message}`);
          }
    }
}

type APIRate = {
    id: string,
    rate: number
}
