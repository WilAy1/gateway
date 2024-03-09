import jwt from 'jsonwebtoken';
import { env } from './env';


export function generateBearerToken(data: unknown, expiresIn?: number) : string {
    const token = jwt.sign(data, env.SECURE_GEN_KEY, {expiresIn});
    return token;
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