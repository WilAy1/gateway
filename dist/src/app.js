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
// import listEndpoints from 'express-list-endpoints';
// import { listTree } from './others/others';
// import path from 'path';
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
(0, solana_1.monitorPending)();
(0, solana_1.resubscribe)();
// Run fetchAndSaveRates every minute
const rates = new rates_1.default();
setInterval(rates.fetchRates.bind(rates), 60000);
rates.fetchRates();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.post('/webhook', express.raw({type: "*/*" }), (req, res) => {
//   const logEntry = {
//     timestamp: new Date().toISOString(),
//     method: req.method,
//     url: req.originalUrl,
//     ip: req.ip,
//     headers: req.headers,
//     rawBody: req.body, // important!
//     parsedBody: req.body,
//   };
//   console.log("📩 Incoming webhook:", JSON.stringify(logEntry, null, 2));
//   // Respond quickly — providers expect fast ACK
//   res.status(200).send("ok");
// });
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
// listEndpoints(app).forEach((endpoint)=>{
//   console.log(endpoint.path);
// })
// // Replace '.' with your target directory
// const targetDir = process.argv[2] || './src';
// console.log(path.basename(targetDir));
// listTree(targetDir);
// const webhook = new Webhook("54c91f1c-9ae9-45aa-9825-c16800f7881f");
// webhook.sendTransaction("62eb013a-5f30-4493-9e92-07b5c07a3abd", WebhookEvent.TRANSACTION_COMPLETED);
exports.default = app;
//# sourceMappingURL=app.js.map