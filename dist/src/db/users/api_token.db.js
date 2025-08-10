"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidApiToken = exports.generateApiToken = exports.Tokens = void 0;
const generate_secure_token_1 = require("../../utils/generate_secure_token");
const utils_1 = require("../../utils/utils");
const query_1 = __importDefault(require("../query"));
class Tokens {
    constructor(userId) {
        this.privateTable = new query_1.default("apitokens");
        this.publicTable = new query_1.default("public_apitokens");
        this.ownerId = userId;
    }
    async generatePrivate() {
    }
    generatePublic() {
    }
    async getPrivate() {
        const result = await this.privateTable.select({
            cols: ["api_token as token", "status", "owner_id as id", "created_at"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    }
                ]
            }
        });
        return result;
    }
    async getPublic() {
        const result = await this.publicTable.select({
            cols: ["api_token as token", "status", "owner_id as id", "created_at"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    }
                ]
            }
        });
        return result;
    }
    async get() {
        return {
            "private": await this.getPrivate(),
            "public": await this.getPublic()
        };
    }
}
exports.Tokens = Tokens;
async function generateApiToken(userId, tokenType) {
    try {
        const apiToken = (0, generate_secure_token_1.generateToken)(tokenType, {
            userId: userId
        });
        let inTable;
        if (tokenType == generate_secure_token_1.TokenType.PRIVATE_API) {
            inTable = "apitokens";
        }
        else if (tokenType == generate_secure_token_1.TokenType.PUBLIC_API) {
            inTable = "public_apitokens";
        }
        else {
            throw Error("Invalid token type");
        }
        const query = new query_1.default(inTable);
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
async function isValidApiToken(userDetails, token, tokenType) {
    try {
        const { userId } = userDetails;
        const query = new query_1.default(tokenType == generate_secure_token_1.TokenType.PRIVATE_API ? "apitokens" : "public_apitokens");
        const result = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: userId
                    },
                    {
                        key: "api_token",
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
exports.isValidApiToken = isValidApiToken;
//# sourceMappingURL=api_token.db.js.map