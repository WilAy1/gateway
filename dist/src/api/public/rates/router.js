"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRate = exports.ratesRouter = void 0;
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
exports.ratesRouter = express_1.default.Router();
const getRate = (params) => {
    let amount_to;
    const { from, to, amount = null } = params;
    const from_to_usd = FIAT_USD[from];
    const usd_to_coin = CRYPTO_USD[to];
    const rate = 1 / (usd_to_coin * from_to_usd);
    if (amount) {
        amount_to = amount * rate;
    }
    return {
        price_from: from_to_usd,
        amount_from: amount,
        rate: rate,
        price_to: usd_to_coin,
        amount_to: amount_to
    };
};
exports.getRate = getRate;
exports.ratesRouter.get('/rate/:from/:to', async (req, res) => {
    try {
        const { from, to } = req.params;
        const amount = parseFloat(req.query.amount);
        if (!from || !to || isNaN(amount)) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: "Invalid parameters" });
        }
        const from_to_usd = FIAT_USD[from];
        const usd_to_coin = CRYPTO_USD[to];
        if (!from_to_usd || !usd_to_coin) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: "Conversion rate not available" });
        }
        const rate = 1 / (usd_to_coin * from_to_usd);
        const amount_to = amount * rate;
        const result = {
            status: true,
            message: "Convert Successful",
            data: {
                rate: rate,
                convert_from: from,
                convert_to: to,
                previous_amount: amount,
                new_amount: amount_to,
                str: `${amount} ${from} = ${amount_to} ${to}`
            }
        };
        return res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.error("Error converting rate:", error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
});
const FIAT_USD = {
    ngn: 1500,
    usd: 1,
    gbp: 1.004
};
const CRYPTO_USD = {
    sol: 146.5,
    eth: 3983.39
};
// const FIATS = ["ngn", "usd", "gbp"];
//# sourceMappingURL=router.js.map