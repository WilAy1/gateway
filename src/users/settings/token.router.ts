import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateApiToken, Tokens } from '../../db/users/api_token.db';
import { TokenType } from '../../utils/generate_secure_token';

export const tokenRouter = express.Router();


tokenRouter.post('/generate-token/private', async (req, res) => {
    try {
        const { userId } = req['user'];

        generateApiToken(userId, TokenType.PRIVATE_API).then((token) => {
            return res.status(StatusCodes.OK).json({ success: true, token: token })
        });
    }
    catch (error) {
        console.error("Error in route /generate-token", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" })
    }
});


tokenRouter.post('/generate-token/public', async (req, res) => {
    try {
        const { userId } = req['user'];
        generateApiToken(userId, TokenType.PUBLIC_API).then((token)=> {
            return res.status(StatusCodes.OK).json({ success: true, message: "Token generated", data: { token: token } })
        })
    } 
    catch (error) {
        console.error("Error in route /generate-token/public", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" })
    }
})

tokenRouter.get('/fetch', async (req, res) => {
    try {
        const { userId } = req["user"];
        const tokensClass = new Tokens(userId);
        const tokens = await tokensClass.get();
        
        return res.status(StatusCodes.OK).json({ success: true, message: "success", data: tokens });
    } 
    catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" })
    }
})