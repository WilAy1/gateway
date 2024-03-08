import  express  from "express";
import { fetchCoins } from "../../../../../db/crypto/functions.db";
import { StatusCodes } from "http-status-codes";


export const solanaCoinRouter = express.Router();



solanaCoinRouter.get('/solana', async (req, res) => {
    try {
        const allCoins = await fetchCoins({ fromChain: "ethereum" });
        
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