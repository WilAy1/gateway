"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = __importDefault(require("express"));
const router_1 = require("./coins/router");
const router_2 = require("./rates/router");
const handshake_1 = require("./transactions/handshake");
exports.publicRouter = express_1.default.Router();
exports.publicRouter.use('/', router_1.coinsRouter, router_2.ratesRouter, handshake_1.handshakeRouter);
//# sourceMappingURL=router.js.map