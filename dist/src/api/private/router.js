"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateRouter = void 0;
const express_1 = __importDefault(require("express"));
const middleware_1 = require("./middleware");
const router_transaction_1 = require("./transaction/router.transaction");
const router_1 = require("./customers/router");
const router_2 = require("./disputes/router");
const router_3 = require("./settlements/router");
const router_4 = require("./refunds/router");
exports.privateRouter = express_1.default.Router();
// Apply authentication middleware to all routes in this router
exports.privateRouter.use(middleware_1.authenticate);
exports.privateRouter.use('/transaction', router_transaction_1.transactionRouter);
exports.privateRouter.use('/customer', router_1.customersRouter);
exports.privateRouter.use('/disputes', router_2.disputesRouter);
exports.privateRouter.use('/refunds', router_4.refundsRouter);
exports.privateRouter.use('/settlements', router_3.settlementRouter);
//# sourceMappingURL=router.js.map