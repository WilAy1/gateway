"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const process_1 = require("process");
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }
    // Verify the token using the secret key
    jsonwebtoken_1.default.verify(token, process_1.env.SECURE_GEN_KEY, (err, user) => {
        if (err) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ error: "forbidden" }); // Forbidden if token is invalid
        }
        req.user = user;
        next(); // Proceed to the next middleware
    });
}
exports.authenticate = authenticate;
//# sourceMappingURL=middleware.js.map