"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const api_token_db_1 = require("../../db/users/api_token.db");
exports.tokenRouter = express_1.default.Router();
exports.tokenRouter.post('/generate-token', async (req, res) => {
    try {
        const { userId } = req['user'];
        (0, api_token_db_1.generateApiToken)(userId).then((token) => {
            return res.status(http_status_codes_1.StatusCodes.OK).json({ success: "Token generated", token: token });
        });
    }
    catch (error) {
        console.error("Error in route /generate-token", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=generate_token.router.js.map