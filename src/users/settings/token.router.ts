import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateApiToken, Tokens } from '../../db/users/api_token.db';
import { TokenType } from '../../utils/generate_secure_token';
import { sendErrroResponse, sendSuccessResponse } from '../../utils/responseHandler';

export const tokenRouter = express.Router();


tokenRouter.post('/generate-token/private', async (req, res) => {
    try {
        const { userId } = req['user'];
        let { name } = req.body;
        if(!name) name = "Private Key " + generateRandomChars(4);

        generateApiToken(userId, TokenType.PRIVATE_API, name).then((token) => {
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
        let { name } = req.body;
        if(!name) name = "Public Key " + generateRandomChars(4);
        generateApiToken(userId, TokenType.PUBLIC_API, name).then((token)=> {
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

tokenRouter.post('/revoke', async (req, res)=>{
    try {
        const { userId } = req['user'];
        const { id, type } = req.body;
        if(!id || !type) return sendErrroResponse(res, "Invalid request parameters");
        const tokenClass = new Tokens(userId);
        let success: boolean;
        if(type == "private"){
            success = await tokenClass.revokePrivate(id);
        }
        else {
            success = await tokenClass.revokePublic(id);
        }

        if(success) return sendSuccessResponse(res, {}, {message: "Key revoked successfully" })
        else return sendErrroResponse(res, "An error occured while revoking key.");
        

    } 
    catch (error) {
        console.error("Error in route /generate-token/public", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" })
    }
})


function generateRandomChars(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}