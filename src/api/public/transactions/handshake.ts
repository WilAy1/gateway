import express from 'express';
import { generateToken, TokenType } from '../../../utils/generate_secure_token';
import Table from '../../../db/query';
import { isEmpty } from '../../../utils/utils';
import { StatusCodes } from 'http-status-codes';

export const handshakeRouter = express.Router();
handshakeRouter.post('/handshake', async (req, res) => {
    try { 
        const { reference } = req.body;

        const query = new Table("transactions");

        const transactionResult = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "reference",
                        value: reference
                    },        
                ]
            }
        });


        if(isEmpty(transactionResult)) return res.status(StatusCodes.BAD_REQUEST).json(
            { success: false, error: "handshake_failure", message: "Couldn't perform handshake" });
            
            const data = {
                userId: transactionResult[0]["issuer_id"]  
            };
            const token = generateToken(TokenType.TRANSACTION_HANDSHAKE, data);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "",
            data: { "token": token }
        });
    }
    catch (error){
        console.error(error);
        return res.status(StatusCodes.BAD_GATEWAY).json(
            { success: false, error: "handshake_failure", message: "Couldn't perform handshake" });
    }
})