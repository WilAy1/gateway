import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from "process";
import { Request, Response, NextFunction } from 'express';
import { verifyLoginToken } from '../db/users/auth.db';
import { userEndpointActions } from '../../config/user_request_actions';
import { analyzeRequestParams } from '../utils/utils';


export function authenticateUser(req, res, next) {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }
  
    // Verify the token using the secret key
    jwt.verify(token, env.SECURE_LOGIN_GEN_KEY, async (err, user) => {
      if (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Forbidden if token is invalid
      }
      
      // check if token is revoked

      const isTokenActive = await verifyLoginToken(user, token);

      if(!isTokenActive) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });

      req.user = user;

      loggingMiddleware(req, res, next);
    });
}


export function loggingMiddleware(req, res, next) {
  const endpoint = req.originalUrl;
  const actionType = userEndpointActions[endpoint];

  const { ip, userAgent, deviceType } = analyzeRequestParams(req);

  console.log(`[${new Date().toISOString()}] User ${req.user.id} performed action ${actionType} on endpoint ${endpoint} on ${deviceType} with ${userAgent} and ip: ${ip}`);

  next();

}


export function excludeFromAuth(paths: string[]) {
    return function(req: Request, res: Response, next: NextFunction) {
        // Check if the request path matches any of the excluded paths
        if (paths.includes(req.path)) {
            // If the path is in the exclusion list, skip authentication and call next()
            console.log(`Skipping authentication for path: ${req.path}`);
            next();
        } else {
            // If the path is not in the exclusion list, proceed with authentication
            authenticateUser(req, res, next);
        }
    };
}