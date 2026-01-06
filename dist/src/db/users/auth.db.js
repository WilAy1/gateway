"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = exports.verifyLoginToken = exports.authenticateLogin = exports.verifyUser = exports.authRegister = void 0;
const auth_users_interface_1 = require("../../interfaces/auth.users.interface");
const passwordUtils_1 = require("../../utils/passwordUtils");
const utils_1 = require("../../utils/utils");
const query_1 = __importDefault(require("../query"));
const connect_1 = __importDefault(require("../connect"));
const generate_secure_token_1 = require("../../utils/generate_secure_token");
async function authRegister(businessName, email, password) {
    let client;
    try {
        email = email.trim();
        if (!(0, utils_1.isValidEmail)(email) && !(0, utils_1.isValidPassword)(password) && businessName.length < 2) {
            return {
                message: "Invalid business name, email or password format",
                success: false
            };
        }
        const hashedPassword = await (0, passwordUtils_1.hashPassword)(password);
        client = await connect_1.default.connect();
        await client.query('BEGIN');
        const query = new query_1.default("users");
        const result = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "email",
                        value: email
                    }
                ]
            }
        });
        if (!(0, utils_1.isEmpty)(result)) {
            await client.query('ROLLBACK');
            return {
                message: "Account with email address already exists",
                success: false,
                emailExists: true
            };
        }
        // create account
        // Get the current time
        const currentTime = new Date();
        // Add one hour to the current time (ms)
        const expiryTime = new Date(currentTime.getTime() + (1 * 60 * 60 * 1000));
        // Format the expiry time as a string in ISO 8601 format (Timestamp with time zone)
        const expiryTimeString = expiryTime.toISOString();
        const currentTimeString = currentTime.toISOString();
        const verificationCode = (0, utils_1.codeGenerator)(6);
        // hash is used as a placeholder till veriification is complete, 1 hr expiry
        const randomHash = (0, utils_1.generateRandomHash)(32);
        query.insert([
            "business_name",
            "email",
            "password",
            "hash",
            "hash_expiry",
            "is_verified",
            "verification_time",
            "status",
            "verification_code",
            "verification_code_expiry",
            "created_at"
        ], [
            businessName,
            email,
            hashedPassword,
            randomHash,
            expiryTimeString,
            false,
            'infinity',
            "inactive",
            verificationCode,
            expiryTimeString,
            currentTimeString
        ]);
        //verify success
        // const verifyResult = await query.select({
        //     conditions: {
        //         compulsory: [
        //             {
        //                 key: "email",
        //                 value: email
        //             }
        //         ]
        //     }
        // });
        // if(isEmpty(verifyResult)) {
        //     return {
        //         message: "Account creation failed to complete",
        //         success: false
        //     }
        // }
        await client.query('COMMIT');
        return {
            message: "Account successfully created",
            hash: randomHash,
            success: true
        };
    }
    catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error("Error registering user", error);
        throw new Error("An error occured while registering user");
    }
    finally {
        if (client) {
            client.release(); // Release client back to the pool
        }
    }
}
exports.authRegister = authRegister;
async function verifyUser(email, hash, code) {
    let client;
    try {
        email = email.trim();
        hash = hash.trim();
        code = code.trim().toUpperCase();
        client = await connect_1.default.connect();
        await client.query('BEGIN');
        const compulsoryConditions = [{
                key: "is_verified",
                value: false
            },
            {
                key: "status",
                value: "inactive"
            },
            {
                key: "hash",
                value: hash
            },
            {
                key: "verification_code",
                value: code
            },
            {
                key: "email",
                value: email
            }];
        const query = new query_1.default("users");
        const result = await query.select({
            cols: ["hash"],
            conditions: {
                compulsory: compulsoryConditions
            }
        });
        if ((0, utils_1.isEmpty)(result)) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: "Failed to verify account"
            };
        }
        const currentTime = new Date();
        const currentIsoTime = currentTime.toISOString();
        query.update([
            "hash_expiry",
            "is_verified",
            "verification_time",
            "status",
            "verification_code_expiry",
        ], [
            currentIsoTime,
            true,
            currentIsoTime,
            'active',
            currentIsoTime
        ], {
            compulsory: compulsoryConditions
        });
        await client.query('COMMIT');
        return {
            success: true,
            message: "Successfully verified account"
        };
    }
    catch (error) {
        if (client) {
            await client.query('ROLLBACK');
            console.error("Error verifying user", error);
            throw new Error("An error occured while verifying user");
        }
    }
    finally {
        if (client) {
            client.release(); // Release client back to the pool
        }
    }
}
exports.verifyUser = verifyUser;
async function authenticateLogin(params) {
    try {
        const query = new query_1.default("users");
        const result = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "email",
                        value: params.email
                    }
                ]
            }
        });
        if ((0, utils_1.isEmpty)(result)) {
            return {
                message: "Invalid email or password",
                success: false
            };
        }
        const hashedPassword = result[0]['password'];
        const isMatch = await (0, passwordUtils_1.comparePassword)(params.password, hashedPassword);
        // check password match
        if (!isMatch) {
            return {
                message: "Invalid email or password",
                success: false
            };
        }
        // check account verification status
        switch (result[0]['status']) {
            case auth_users_interface_1.UserAccountState.DISABLED:
                if (!result[0]['is_verified']) {
                    return {
                        message: "Account isn't verified",
                        success: false
                    };
                }
                return {
                    message: "Account has been disabled. Contact customer support",
                    success: false
                };
            case auth_users_interface_1.UserAccountState.SUSPENDED:
                return {
                    message: "Account has been suspended. Contact customer support",
                    success: false
                };
            default:
                break;
        }
        // check if device has an active bearer token
        // if so, revoke it
        const compulsoryTokenConditions = [{
                key: "device_id",
                value: params.deviceId
            },
            {
                key: "user_id",
                value: result[0]['user_id']
            },
            {
                key: 'status',
                value: 'active'
            }];
        const loginQuery = new query_1.default("login_tokens");
        const deviceCheck = await loginQuery.select({
            conditions: {
                compulsory: compulsoryTokenConditions
            }
        });
        if (!(0, utils_1.isEmpty)(deviceCheck)) {
            loginQuery.update([
                "status"
            ], [
                "revoked"
            ], {
                compulsory: compulsoryTokenConditions
            });
        }
        // generate jwt token for account auth
        const bearerToken = (0, generate_secure_token_1.generateToken)(generate_secure_token_1.TokenType.LOGIN, {
            userId: result[0]["user_id"],
            deviceId: params.deviceId,
            userAgent: params.userAgent
        }, 30 * 24 * 60 * 60); // expires 30 days = 30*24*60*60
        const currentTime = new Date();
        const expiryTime = new Date(currentTime.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiryTimeIso = expiryTime.toISOString();
        const currentTImeIso = currentTime.toISOString();
        await loginQuery.insert([
            "user_id",
            "token",
            "device_id",
            "ip_address",
            "user_agent",
            "status",
            "times_used",
            "time_created",
            "time_last_used",
            "token_expiry"
        ], [
            result[0]["user_id"],
            bearerToken,
            params.deviceId,
            params.ip,
            params.userAgent,
            "active",
            "1",
            currentTImeIso,
            currentTImeIso,
            expiryTimeIso
        ]);
        return {
            message: 'Login Successful',
            token: bearerToken,
            success: true
        };
    }
    catch (error) {
        console.error("Error finding user:", error);
        throw new Error("An error occurred while finding user");
    }
}
exports.authenticateLogin = authenticateLogin;
async function verifyLoginToken(userDetails, token) {
    try {
        const { userId, deviceId } = userDetails;
        const query = new query_1.default("login_tokens");
        const result = await query.select({
            conditions: {
                compulsory: [
                    {
                        key: "user_id",
                        value: userId
                    },
                    {
                        key: "device_id",
                        value: deviceId
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
exports.verifyLoginToken = verifyLoginToken;
async function logAction() {
}
exports.logAction = logAction;
//# sourceMappingURL=auth.db.js.map