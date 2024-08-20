"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingRouter = void 0;
const http_status_codes_1 = require("http-status-codes");
const auth_db_1 = require("../db/users/auth.db");
const utils_1 = require("../utils/utils");
const express_1 = __importDefault(require("express"));
exports.onboardingRouter = express_1.default.Router();
exports.onboardingRouter.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await (0, auth_db_1.authRegister)(email, password);
        if (!result.success) {
            if (result.emailExists) {
                return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({ error: result.message });
            }
            return res.status(http_status_codes_1.StatusCodes.BAD_GATEWAY).json({ error: result.message });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: result.message, hash: result.hash });
    }
    catch (error) {
        console.error("Error in /register route:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
exports.onboardingRouter.post('/verify-user', async (req, res) => {
    try {
        const { email, hash, code } = req.body;
        const result = await (0, auth_db_1.verifyUser)(email, hash, code);
        if (!result.success) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ error: result.message });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: result.message });
    }
    catch (error) {
        console.error("Error in /verify-user route:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
exports.onboardingRouter.post('/login', async (req, res) => {
    try {
        const { email, password, device_id } = req.body;
        const { ip, userAgent, deviceType } = (0, utils_1.analyzeRequestParams)(req);
        let result;
        if (email && password && device_id) {
            result = await (0, auth_db_1.authenticateLogin)({
                email: email,
                password: password,
                deviceId: device_id,
                ip: ip,
                userAgent: userAgent,
                deviceType: deviceType
            });
        }
        else {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: "Failed to process request" });
        }
        if (result && !result.success) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: result.message });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: result.success, token: result.token });
    }
    catch (error) {
        console.error("Error in /login route:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=onboarding.users.js.map