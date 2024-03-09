import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from "process";
import { Request, Response, NextFunction } from 'express';


export function authenticateUser(req, res, next) {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }
  
    // Verify the token using the secret key
    jwt.verify(token, env.SECURE_GEN_KEY, (err, user) => {
      if (err) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "forbidden" }); // Forbidden if token is invalid
      }
      req.user = user;
      next();
    });
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