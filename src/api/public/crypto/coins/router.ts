import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { fetchCoin, fetchCoins } from '../../../../db/crypto/functions.db';
import { isValidUUID } from '../../../../utils/utils';
import { solanaCoinRouter } from './solana/router';

export const coinsRouter = express.Router();


coinsRouter.get('/coins', async (req, res) => {
    try {

        const allCoins = await fetchCoins();
        
        if(allCoins.length == 0){
            return res.status(StatusCodes.NOT_FOUND).json({error : `No active coins found!`})
        }

        const response = {
            status: true,
            message: "Coins fetched",
            data: allCoins
        };

        return res.status(StatusCodes.OK).json(response)

    }
    catch (error) {
        console.error("Error in /coins route:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});


coinsRouter.get('/coin/:id', async (req, res) => {
    const COIN_ID = req.params.id;
    if(!isValidUUID(COIN_ID)) {
        return res.status(StatusCodes.FORBIDDEN).json({error : `Invalid coin id`})
    }
    try {
        const coin = await fetchCoin(COIN_ID);

        if(coin.length === 0) return res.status(StatusCodes.NOT_FOUND).json({ error: 'Coin not found' });

        const response = {
            status: true,
            message: "Coin successfully fetched",
            data: coin
        };

        return res.status(StatusCodes.OK).json(response);


    }
    catch(error) {
        console.error(`Error in /coin/${COIN_ID} route:`, error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
})

coinsRouter.use('/coins/', solanaCoinRouter);