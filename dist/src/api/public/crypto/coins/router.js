"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinsRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const functions_db_1 = require("../../../../db/crypto/functions.db");
const utils_1 = require("../../../../utils/utils");
const router_1 = require("./solana/router");
exports.coinsRouter = express_1.default.Router();
exports.coinsRouter.get('/coins', async (req, res) => {
    try {
        const chainsWithCoins = await (0, functions_db_1.fetchCoins)();
        if ((0, utils_1.isEmpty)(Object.keys(chainsWithCoins))) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: `No active coins found!` });
        }
        const response = {
            status: true,
            message: "Coins fetched",
            data: chainsWithCoins
        };
        return res.status(http_status_codes_1.StatusCodes.OK).json(response);
    }
    catch (error) {
        console.error("Error in /coins route:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
exports.coinsRouter.get('/coins/:id', async (req, res) => {
    const CHAIN_NAME = req.params.id;
    try {
        const chainWithCoins = await (0, functions_db_1.fetchCoins)({ fromChain: CHAIN_NAME });
        if ((0, utils_1.isEmpty)(Object.keys(chainWithCoins))) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: `No active coins found!` });
        }
        const response = {
            status: true,
            message: "Coins fetched",
            data: chainWithCoins
        };
        return res.status(http_status_codes_1.StatusCodes.OK).json(response);
    }
    catch (error) {
        console.error("Error in /coins route:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
exports.coinsRouter.get('/coin/:id', async (req, res) => {
    const COIN_ID = req.params.id;
    if (!(0, utils_1.isValidUUID)(COIN_ID)) {
        return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ error: `Invalid coin id` });
    }
    try {
        const coin = await (0, functions_db_1.fetchCoin)(COIN_ID);
        if (coin.length === 0)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: 'Coin not found' });
        const response = {
            status: true,
            message: "Coin successfully fetched",
            data: coin
        };
        return res.status(http_status_codes_1.StatusCodes.OK).json(response);
    }
    catch (error) {
        console.error(`Error in /coin/${COIN_ID} route:`, error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
});
exports.coinsRouter.use('/coins/', router_1.solanaCoinRouter);
//# sourceMappingURL=router.js.map