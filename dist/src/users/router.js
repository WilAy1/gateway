"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const onboarding_users_1 = require("./onboarding.users");
const middleware_1 = require("./middleware");
const router_1 = require("./transactions/router");
const router_2 = require("./settings/router");
const router_3 = require("./customers/router");
const router_4 = require("./overview/router");
exports.userRouter = express_1.default.Router();
exports.userRouter.use((0, middleware_1.excludeFromAuth)(['/register', '/verify-user', '/login']));
exports.userRouter.use('/', onboarding_users_1.onboardingRouter);
exports.userRouter.use('/settings', router_2.settingsRouter);
exports.userRouter.use('/transaction', router_1.userTransactionRouter);
exports.userRouter.use('/customer', router_3.userCustomersRouter);
exports.userRouter.use('/overview', router_4.overviewRouter);
//# sourceMappingURL=router.js.map