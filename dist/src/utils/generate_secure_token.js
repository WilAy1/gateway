"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiBearerToken = exports.generateLoginBearerToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
function generateLoginBearerToken(data, expiresIn) {
    const token = jsonwebtoken_1.default.sign(data, env_1.env.SECURE_LOGIN_GEN_KEY, expiresIn && { expiresIn });
    return token;
}
exports.generateLoginBearerToken = generateLoginBearerToken;
function generateApiBearerToken(data, expiresIn) {
    const token = jsonwebtoken_1.default.sign(data, env_1.env.SECURE_GEN_KEY, expiresIn && { expiresIn });
    return token;
}
exports.generateApiBearerToken = generateApiBearerToken;
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
//# sourceMappingURL=generate_secure_token.js.map