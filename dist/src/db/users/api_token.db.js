"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiToken = exports.generateApiToken = void 0;
const generate_secure_token_1 = require("../../utils/generate_secure_token");
const utils_1 = require("../../utils/utils");
const query_1 = __importDefault(require("../query"));
async function generateApiToken(userId) {
    try {
        const apiToken = (0, generate_secure_token_1.generateApiBearerToken)({
            userId: userId
        });
        const query = new query_1.default("apitokens");
        await query.update([
            "status",
        ], [
            "revoked"
        ], {
            compulsory: [
                {
                    key: "owner_id",
                    value: userId
                }
            ]
        });
        await query.insert([
            // keys
            "api_token",
            "owner_id",
            "last_time_used",
            "expires_at"
        ], [
            apiToken,
            userId,
            "infinity",
            "infinity"
        ]);
        return apiToken;
    }
    catch (error) {
        console.log("Error generating api token: ", error);
        throw new Error("Failed to generate api token");
    }
}
exports.generateApiToken = generateApiToken;
async function verifyApiToken(userDetails, token) {
    try {
        const { userId } = userDetails;
        const query = new query_1.default("apitokens");
        const result = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "user_id",
                        value: userId
                    },
                    {
                        key: "token",
                        value: token
                    },
                    {
                        key: "status",
                        value: "active"
                    }
                ]
            }
        });
        if ((0, utils_1.isEmpty)(result)) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("Error verifying login token: ", error);
        throw new Error("Login token verification failed");
    }
}
exports.verifyApiToken = verifyApiToken;
//# sourceMappingURL=api_token.db.js.map