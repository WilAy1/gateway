"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const onboarding_users_1 = require("./onboarding.users");
const middleware_1 = require("./middleware");
const generate_token_router_1 = require("./settings/generate_token.router");
exports.userRouter = express_1.default.Router();
exports.userRouter.use((0, middleware_1.excludeFromAuth)(['/register', '/verify-user', '/login']));
exports.userRouter.use('/', onboarding_users_1.onboardingRouter);
exports.userRouter.use('/', generate_token_router_1.tokenRouter);
//# sourceMappingURL=router.js.map