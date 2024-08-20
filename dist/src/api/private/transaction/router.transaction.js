"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRouter = void 0;
const express_1 = __importDefault(require("express"));
const create_transaction_1 = require("./create_transaction");
exports.transactionRouter = express_1.default.Router();
exports.transactionRouter.use(create_transaction_1.createTransactionRouter);
//# sourceMappingURL=router.transaction.js.map