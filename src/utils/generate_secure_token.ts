import jwt from 'jsonwebtoken';
import { env } from './env';


function generateLoginBearerToken(data: unknown, expiresIn?: number) : string {
    const token = jwt.sign(data, env.SECURE_LOGIN_GEN_KEY, expiresIn && {expiresIn});
    return token;
}

function generateApiToken(data: unknown, expiresIn?: number) : string {
    const token = jwt.sign(data, env.SECURE_GEN_KEY, expiresIn && {expiresIn});
    return token;
}

function generatePublicApiToken(data: unknown, expiresIn?: number) : string {
    const token = jwt.sign(data, env.SECURE_PUBLIC_GEN_KEY, expiresIn && {expiresIn});
    return token;
}

function generateHandshakeToken(data: unknown) : string {
    const token = jwt.sign(data, env.SECURE_TRANSACTION_HANDSHAKE_GEN_KEY);
    return token;
}

export function generateToken(tokenType: TokenType, data: unknown, expiresIn?: number)  {
    switch(tokenType){
        case TokenType.LOGIN:
            return generateLoginBearerToken(data, expiresIn);
        case TokenType.PRIVATE_API:
            return generateApiToken(data, expiresIn)
        case TokenType.PUBLIC_API:
            return generatePublicApiToken(data, expiresIn);
        case TokenType.TRANSACTION_HANDSHAKE:
            return generateHandshakeToken(data);

        default:
            return null;
        
    }
}

export enum TokenType {
    LOGIN,
    PRIVATE_API,
    PUBLIC_API,
    TRANSACTION_HANDSHAKE
}


// export function verifyBearerToken({ email, password, token }) : boolean {
//     try {
//         const decoded = jwt.verify(token, env.SECURE_GEN_KEY);
//         console.log('Decoded Token:', decoded);
//         return decoded.email == email && decoded.pass == password;
//       } catch (error) {
//         console.error('Error verifying token:', error.message);
//         return false;
//       }
// }