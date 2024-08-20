/* eslint-disable @typescript-eslint/no-unused-vars */
import { randomUUID } from 'crypto';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { createClient } from 'redis';

export const ratesRouter = express.Router();
const client = createClient();





// fetch rate from api. returns every usd value e.g [{pair:"sol-usd", value: 180}]
// save the rate with an id
// on fetch rate, convert it to 


// client.on('error', (err) => {
//     console.error('Redis client error:', err);
//   });
  
//   // Connect to Redis
 client.connect().catch(console.error);



function fetchRatesFromAPI() { // fetches usd rate
    const rates = Object.keys(PAIR_USD).map((value) => {
        return { id: value, rate: PAIR_USD[value] }
    });
    
    
  return rates;
}



  
// Function to fetch and save rates
async function fetchAndSaveRates() {
  try {
    const rates = fetchRatesFromAPI();
    for (const rate of rates) {
      try {
        // Set rate with 1-hour TTL (60 seconds)
        await client.setEx(rate.id, 60, JSON.stringify(rate));
        //console.log(`Rate for ${rate.id} saved successfully.`);
      } catch (err) {
        console.error(`Failed to save rate for ${rate.id}:`, err);
      }
    }
  } catch (error) {
    //console.error('Error fetching and saving rates:', error);
  }
}



async function getRate(id: string) : Promise<APIRate> {
  try {
    const reply = await client.get(id);
    return JSON.parse(reply) as APIRate;
  } catch (err) {
    throw new Error(`Failed to get rate for ${id}: ${err.message}`);
  }
}

  

// Run fetchAndSaveRates every minute
setInterval(fetchAndSaveRates, 6000);

fetchAndSaveRates();
  







type APIRate = {
    id: string,
    rate: number
}


type GetRateParams = {
    from: string,
    to: string,
    amount?: number | null
}





export const getConversionRate = async (params: GetRateParams) => {

        let amount_to: number;

        const { from, to, amount = null } = params;

        const rate_from = await getRate(from);
        const rate_to = await getRate(to);


        const from_to_usd = rate_from.rate;
        const usd_to_coin = rate_to.rate;
        const rate = 1 / (usd_to_coin * from_to_usd);

        if(amount) { 
            amount_to = amount * rate;
        }

        return {
            price_from: from_to_usd,
            amount_from: amount,
            rate: rate,
            price_to: usd_to_coin,
            amount_to: amount_to,
            rate_from_id: rate_from.id,
            rate_to_id: rate_to.id
        };
}


ratesRouter.get('/rate/:from/:to', async (req, res) => {
    try {
        const { from, to } = req.params;
        const amount = parseFloat((req.query.amount || 0) as string);

        if (!from || !to || isNaN(amount)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid parameters" });
        }


        const {rate, amount_from, amount_to, rate_from_id, rate_to_id} = await getConversionRate({from: from, to: to, amount: amount});

        // const from_to_usd = FIAT_USD[from];
        // const usd_to_coin = CRYPTO_USD[to];

        // if (!from_to_usd || !usd_to_coin) {
        //     return res.status(StatusCodes.BAD_REQUEST).json({ error: "Conversion rate not available" });
        // }

        // const rate = 1 / (usd_to_coin * from_to_usd);
        // const amount_to = amount * rate;

        const result = {
            status: true,
            message: "Convert Successful",
            data: {
                rate: rate,
                convert_from: from,
                convert_to: to,
                previous_amount: amount_from,
                new_amount: amount_to,
                str: `${amount_from} ${from} = ${amount_to} ${to}`,
                rate_from_id: rate_from_id,
                rate_to_id: rate_to_id
            }
        };

        return res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.error("Error converting rate:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});


// every pair with usd
// onFetch rate, we calculate equivalent fiat/crypto pair

const PAIR_USD = {
    ngn: 1500,
    usd: 1,
    gbp: 1.004,
    sol: 146.5,
    eth: 3983.39,
}


const FIAT_USD= {
    ngn: 1500,
    usd: 1,
    gbp: 1.004
}

const CRYPTO_USD = {
    sol: 146.5,
    eth: 3983.39,
    usd: 1
}

// const FIATS = ["ngn", "usd", "gbp"];