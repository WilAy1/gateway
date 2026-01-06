"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeFromAuth = exports.loggingMiddleware = exports.authenticateUser = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const process_1 = require("process");
const auth_db_1 = require("../db/users/auth.db");
const user_request_actions_1 = require("../../config/user_request_actions");
const utils_1 = require("../utils/utils");
function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Unauthorized if token is missing
    }
    // Verify the token using the secret key
    jsonwebtoken_1.default.verify(token, process_1.env.SECURE_LOGIN_GEN_KEY, async (err, user) => {
        if (err) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" }); // Forbidden if token is invalid
        }
        // check if token is revoked
        const isTokenActive = await (0, auth_db_1.verifyLoginToken)(user, token);
        if (!isTokenActive)
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: "unauthorized" });
        req.user = user;
        loggingMiddleware(req, res, next);
    });
}
exports.authenticateUser = authenticateUser;
function loggingMiddleware(req, res, next) {
    const endpoint = req.originalUrl;
    const actionType = user_request_actions_1.userEndpointActions[endpoint];
    const { ip, userAgent, deviceType } = (0, utils_1.analyzeRequestParams)(req);
    console.log(`[${new Date().toISOString()}] User ${req.user.id} performed action ${actionType} on endpoint ${endpoint} on ${deviceType} with ${userAgent} and ip: ${ip}`);
    next();
}
exports.loggingMiddleware = loggingMiddleware;
function excludeFromAuth(paths) {
    return function (req, res, next) {
        // Check if the request path matches any of the excluded paths
        if (paths.includes(req.path)) {
            // If the path is in the exclusion list, skip authentication and call next()
            console.log(`Skipping authentication for path: ${req.path}`);
            next();
        }
        else {
            // If the path is not in the exclusion list, proceed with authentication
            authenticateUser(req, res, next);
        }
    };
}
exports.excludeFromAuth = excludeFromAuth;
//# sourceMappingURL=middleware.js.map