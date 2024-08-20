import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateApiToken } from '../../db/users/api_token.db';

export const tokenRouter = express.Router();


tokenRouter.post('/generate-token', async (req, res) => {
    try {
        const { userId } = req['user'];

        generateApiToken(userId).then((token) => {
            return res.status(StatusCodes.OK).json({ success: "Token generated", token: token })
        });
    }
    catch (error) {
        console.error("Error in route /generate-token", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" })
    }
});