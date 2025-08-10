"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
function generateLoginBearerToken(data, expiresIn) {
    const token = jsonwebtoken_1.default.sign(data, env_1.env.SECURE_LOGIN_GEN_KEY, expiresIn && { expiresIn });
    return token;
}
function generateApiToken(data, expiresIn) {
    const token = jsonwebtoken_1.default.sign(data, env_1.env.SECURE_GEN_KEY, expiresIn && { expiresIn });
    return token;
}
function generatePublicApiToken(data, expiresIn) {
    const token = jsonwebtoken_1.default.sign(data, env_1.env.SECURE_PUBLIC_GEN_KEY, expiresIn && { expiresIn });
    return token;
}
function generateToken(tokenType, data, expiresIn) {
    switch (tokenType) {
        case TokenType.LOGIN:
            return generateLoginBearerToken(data, expiresIn);
        case TokenType.PRIVATE_API:
            return generateApiToken(data, expiresIn);
        case TokenType.PUBLIC_API:
            return generatePublicApiToken(data, expiresIn);
        default:
            return null;
    }
}
exports.generateToken = generateToken;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["LOGIN"] = 0] = "LOGIN";
    TokenType[TokenType["PRIVATE_API"] = 1] = "PRIVATE_API";
    TokenType[TokenType["PUBLIC_API"] = 2] = "PUBLIC_API";
})(TokenType || (exports.TokenType = TokenType = {}));
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