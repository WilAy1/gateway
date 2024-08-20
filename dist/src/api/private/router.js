"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateRouter = void 0;
const express_1 = __importDefault(require("express"));
const middleware_1 = require("./middleware");
const router_transaction_1 = require("./transaction/router.transaction");
exports.privateRouter = express_1.default.Router();
// Apply authentication middleware to all routes in this router
exports.privateRouter.use(middleware_1.authenticate);
exports.privateRouter.use('/transaction', router_transaction_1.transactionRouter);
//# sourceMappingURL=router.js.map