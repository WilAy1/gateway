import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from "process";

export function authenticate(req, res, next) {
    
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
      next(); // Proceed to the next middleware
    });
}