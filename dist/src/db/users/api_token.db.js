"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidApiToken = exports.generateApiToken = exports.Tokens = void 0;
const db_interface_1 = require("../../interfaces/db.interface");
const generate_secure_token_1 = require("../../utils/generate_secure_token");
const utils_1 = require("../../utils/utils");
const query_1 = __importDefault(require("../query"));
const crypto_1 = __importDefault(require("crypto"));
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
            cols: ["api_token as token", "status", "api_token_id as id", "name", "created_at", "times_used as usage_count", "last_time_used"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    },
                    {
                        key: "status",
                        value: "active"
                    }
                ],
                orderBy: ["last_time_used", "created_at"],
                limit: 20,
                orderDir: db_interface_1.OrderDirection.DESCENDING
            }
        });
        return result;
    }
    async getPublic() {
        const result = await this.publicTable.select({
            cols: ["api_token as token", "status", "api_token_id as id", "name", "created_at", "times_used as usage_count", "last_time_used"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    },
                    {
                        key: "status",
                        value: "active"
                    }
                ],
                orderBy: ["last_time_used", "created_at"],
                limit: 20,
                orderDir: db_interface_1.OrderDirection.DESCENDING
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
    async revokePublic(tokenId) {
        try {
            return await this.publicTable.update([
                "status",
            ], [
                "revoked"
            ], {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    },
                    {
                        key: "api_token_id",
                        value: tokenId
                    }
                ]
            });
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
    async revokePrivate(tokenId) {
        try {
            return await this.privateTable.update([
                "status",
            ], [
                "revoked"
            ], {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    },
                    {
                        key: "api_token_id",
                        value: tokenId
                    }
                ]
            });
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
}
exports.Tokens = Tokens;
async function generateApiToken(userId, tokenType, name) {
    try {
        const randomKey = crypto_1.default.randomBytes(32).toString("hex");
        const apiToken = `sk_test_${randomKey}`;
        // const apiToken = generateToken(tokenType, {
        //     userId: userId
        // });
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
        // await query.update(
        //     [
        //         "status",
        //     ],
        //     [
        //         "revoked"
        //     ],
        //     {
        //         compulsory: [
        //             {
        //                 key: "owner_id",
        //                 value: userId
        //             }
        //         ]
        //     }
        // )
        await query.insert([
            // keys
            "api_token",
            "owner_id",
            "last_time_used",
            "expires_at",
            "name"
        ], [
            apiToken,
            userId,
            "infinity",
            "infinity",
            name
        ]);
        return apiToken;
    }
    catch (error) {
        console.log("Error generating api token: ", error);
        throw new Error("Failed to generate api token");
    }
}
exports.generateApiToken = generateApiToken;
async function isValidApiToken(token, tokenType) {
    try {
        const query = new query_1.default(tokenType == generate_secure_token_1.TokenType.PRIVATE_API ? "apitokens" : "public_apitokens");
        const result = await query.select({
            conditions: {
                compulsory: [
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
        await query.update(['times_used'], [++result[0]['times_used']], {
            compulsory: [
                {
                    key: "api_token",
                    value: token
                },
                {
                    key: "status",
                    value: "active"
                }
            ]
        });
        return { userId: result[0]['owner_id'] };
    }
    catch (error) {
        console.error("Error verifying login token: ", error);
        throw new Error("Login token verification failed");
    }
}
exports.isValidApiToken = isValidApiToken;
//# sourceMappingURL=api_token.db.js.map