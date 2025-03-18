import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { fetchCoin, fetchCoins } from '../../../db/crypto/functions.db';
import { isEmpty, isValidUUID } from '../../../utils/utils';
import { solanaCoinRouter } from './solana/router';
import { Chain } from '../../../interfaces/coins';

export const coinsRouter = express.Router();


coinsRouter.get('/coins', async (req, res) => {
    try {

        const chainsWithCoins: Chain = await fetchCoins();
        
        if(isEmpty(Object.keys(chainsWithCoins))){
            return res.status(StatusCodes.NOT_FOUND).json({error : `No active coins found!`})
        }

        const response = {
            status: true,
            message: "Coins fetched",
            data: chainsWithCoins
        };

        return res.status(StatusCodes.OK).json(response)

    }
    catch (error) {
        console.error("Error in /coins route:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});


coinsRouter.get('/coins/:id', async (req, res) => {
    const CHAIN_NAME = req.params.id;
    try {
        const chainWithCoins = await fetchCoins({ fromChain: CHAIN_NAME});
        
        if(isEmpty(Object.keys(chainWithCoins))){
            return res.status(StatusCodes.NOT_FOUND).json({error : `No active coins found!`})
        }

        const response = {
            status: true,
            message: "Coins fetched",
            data: chainWithCoins
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