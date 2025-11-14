import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from "process";
import { isValidApiToken } from '../../db/users/api_token.db';
import { TokenType } from '../../utils/generate_secure_token';


const publicPaths = ['/transaction/create', '/transaction/generate-address', '/transaction/fetch'];
const gatewayPayPaths = ['/transaction/generate-address', '/transaction/fetch'];

export function authenticate(req, res, next) {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }

    //verify gateway pay paths
    jwt.verify(token, env.SECURE_TRANSACTION_HANDSHAKE_GEN_KEY, async(err, user)=>{
          if (!err && gatewayPayPaths.includes(req.path)) {
              req.user = user;
              return next(); // Proceed to the next middleware
          }
        // verify if it is a public token
        jwt.verify(token, env.SECURE_PUBLIC_GEN_KEY, async (err, user) => {
          if (!err && publicPaths.includes(req.path)) {
            if(await isValidApiToken(user, token, TokenType.PUBLIC_API)){
              req.user = user;
              return next(); // Proceed to the next middleware
            }
          }
        
          // Verify the token using the secret key
          jwt.verify(token, env.SECURE_GEN_KEY, async (err, user) => {
            if (!err) {
              const validToken = await isValidApiToken(user, token, TokenType.PRIVATE_API);
              if(validToken){
                req.user = user;
                return next(); // Proceed to the next middleware
              }
            }
            else {
              return res.status(StatusCodes.FORBIDDEN).json({ error: "forbidden" }); // Forbidden if token is invalid
            }
          });
           //return res.status(StatusCodes.FORBIDDEN).json({ error: "forbidden" }); // Forbidden if token is invalid
        
        });
    });
  
}