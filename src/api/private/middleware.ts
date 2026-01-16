import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from "process";
import { isValidApiToken } from '../../db/users/api_token.db';
import { TokenType } from '../../utils/generate_secure_token';


const publicPaths = ['/transaction/create', '/transaction/generate-address', '/transaction/fetch'];
const gatewayPayPaths = ['/transaction/generate-address', '/transaction/fetch', '/transaction/cancel'];

export async function authenticate(req, res, next) {
    
    const authHeader = req.headers['authorization'];
    const xApiKey = req.headers['X-Api-Key'] || req.headers['x-api-key'];

    const tokenType = authHeader && authHeader.split(' ')[0];
    const token = authHeader && authHeader.split(' ')[1];


    if (!xApiKey && !token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }

    if(xApiKey){
        const publicToken = await isValidApiToken(xApiKey, TokenType.PUBLIC_API);
        if(publicToken){
          if(publicPaths.includes(req.path)){
            req.user = publicToken;
            return next();
          }
          else {
            return res.status(StatusCodes.FORBIDDEN).json({ error: "forbidden" });
          }
        }
        else {
          const privateToken = await isValidApiToken(xApiKey, TokenType.PRIVATE_API);
          if(privateToken) {
            req.user = privateToken;
            return next();
          }
          else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
          }
        }
    }
    else if (tokenType == 'Bearer') { // don't use
      jwt.verify(token, env.SECURE_TRANSACTION_HANDSHAKE_GEN_KEY, async(err, user)=>{
        if (!err && gatewayPayPaths.includes(req.path)) {
            req.user = user;
            return next(); // Proceed to the next middleware
        }
        else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
        }
      })
    }
    else {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
    }
}