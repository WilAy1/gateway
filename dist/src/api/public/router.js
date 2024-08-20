"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = __importDefault(require("express"));
const router_1 = require("./crypto/coins/router");
const router_2 = require("./rates/router");
exports.publicRouter = express_1.default.Router();
exports.publicRouter.use('/', router_1.coinsRouter, router_2.ratesRouter);
//# sourceMappingURL=router.js.map