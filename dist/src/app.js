"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const router_1 = require("./api/private/router");
const router_2 = require("./api/public/router");
const router_3 = require("./users/router");
const solana_1 = require("./services/solana/solana");
const rates_1 = __importDefault(require("./services/rates/rates"));
const http_status_codes_1 = require("http-status-codes");
const app = (0, express_1.default)();
const port = 3000;
(0, solana_1.resubscribe)();
// Run fetchAndSaveRates every minute
const rates = new rates_1.default();
setInterval(rates.fetchRates.bind(rates), 60000);
rates.fetchRates();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/p', router_1.privateRouter);
app.use('/api/', router_2.publicRouter);
app.use('/', router_3.userRouter);
app.listen(port, () => {
    return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _) => {
    console.error(err.stack); // Log the error for debugging purposes
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
    });
});
app.get('*', function (req, res) {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Invalid resource requested",
        data: {}
    });
});
app.post('*', function (req, res) {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Invalid resource requested",
        data: {}
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map