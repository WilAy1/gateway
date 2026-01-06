"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const process_1 = require("process");
const api_token_db_1 = require("../../db/users/api_token.db");
const generate_secure_token_1 = require("../../utils/generate_secure_token");
const publicPaths = ['/transaction/create', '/transaction/generate-address', '/transaction/fetch'];
const gatewayPayPaths = ['/transaction/generate-address', '/transaction/fetch', '/transaction/cancel'];
async function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const tokenType = authHeader && authHeader.split(' ')[0];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }
    if (tokenType == 'x-api-key') {
        const publicToken = await (0, api_token_db_1.isValidApiToken)(token, generate_secure_token_1.TokenType.PUBLIC_API);
        if (publicToken) {
            if (publicPaths.includes(req.path)) {
                req.user = publicToken;
                return next();
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ error: "forbidden" });
            }
        }
        else {
            const privateToken = await (0, api_token_db_1.isValidApiToken)(token, generate_secure_token_1.TokenType.PRIVATE_API);
            if (privateToken) {
                req.user = privateToken;
                return next();
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
            }
        }
    }
    else if (tokenType == 'Bearer') {
        jsonwebtoken_1.default.verify(token, process_1.env.SECURE_TRANSACTION_HANDSHAKE_GEN_KEY, async (err, user) => {
            if (!err && gatewayPayPaths.includes(req.path)) {
                req.user = user;
                return next(); // Proceed to the next middleware
            }
            else {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
            }
        });
    }
    else {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
    }
}
exports.authenticate = authenticate;
//# sourceMappingURL=middleware.js.map