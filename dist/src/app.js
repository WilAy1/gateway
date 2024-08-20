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
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/', router_2.publicRouter);
app.use('/api/p', router_1.privateRouter);
app.use('/', router_3.userRouter);
app.listen(port, () => {
    return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
exports.default = app;
//# sourceMappingURL=app.js.map