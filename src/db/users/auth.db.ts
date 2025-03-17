import { PoolClient } from "pg";
import { UseLoginResponse, UserRegisterResponse, UserAccountState, UserVerificationResponse, UserLoginParams } from "../../interfaces/auth.users.interface";
import { comparePassword, hashPassword } from "../../utils/passwordUtils";
import { codeGenerator, generateRandomHash, isEmpty, isValidEmail, isValidPassword } from "../../utils/utils";
import Table from "../query";
import pool from "../connect";
import { generateToken, TokenType } from "../../utils/generate_secure_token";


export async function authRegister(email: string, password: string) : Promise<UserRegisterResponse> {
    let client: PoolClient
    try {
        email = email.trim();

        if(!isValidEmail(email) && !isValidPassword(password)){
            return {
                message: "Invalid email/password format",
                success: false
            }
        }
        

        const hashedPassword = await hashPassword(password);

        client = await pool.connect();
        await client.query('BEGIN');


        const query = new Table("users");
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

        if(!isEmpty(result)) {
            await client.query('ROLLBACK');
            return {
                message: "Account with email address already exists",
                success: false,
                emailExists: true
            }
        }

        // create account

        // Get the current time
        const currentTime = new Date();

        // Add one hour to the current time (ms)
        const expiryTime = new Date(currentTime.getTime() + (1 * 60 * 60 * 1000));

        // Format the expiry time as a string in ISO 8601 format (Timestamp with time zone)
        const expiryTimeString = expiryTime.toISOString();
        const currentTimeString = currentTime.toISOString();

        const verificationCode = codeGenerator(6);


        // hash is used as a placeholder till veriification is complete, 1 hr expiry

        const randomHash = generateRandomHash(32);

        query.insert(
            [
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

            ],
            [
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
            ]
        );

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
        }

        
    }
    catch(error) {
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


export async function verifyUser(email: string, hash: string, code: string) : Promise<UserVerificationResponse> {
    let client: PoolClient
    try {
        email = email.trim();
        hash = hash.trim();
        code = code.trim().toUpperCase();


        client = await pool.connect();
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
        }]

        const query = new Table("users");
        
        const result = await query.select({
            cols: [ "hash" ],
            conditions: {
                compulsory: compulsoryConditions
            }
        });

        if(isEmpty(result)) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: "Failed to verify account"
            }
        }

        const currentTime = new Date();
        const currentIsoTime = currentTime.toISOString();

        query.update(
            [
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
            }
        )

        await client.query('COMMIT');

        return {
            success: true,
            message: "Successfully verified account"
        }

    }
    catch(error) {
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

export async function authenticateLogin( params: UserLoginParams ) : Promise<UseLoginResponse> {
    try {
        const query = new Table("users");
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

        if(isEmpty(result)) {
            return {
                message: "Invalid email or password",
                success: false
            }
        }

        const hashedPassword = result[0]['password'];
        const isMatch = await comparePassword(params.password, hashedPassword);

        // check password match
        if(!isMatch) {
            return {
                message: "Invalid email or password",
                success: false
            }
        }

        // check account verification status

        switch (result[0]['status']) {
            case UserAccountState.DISABLED:
                if(!result[0]['is_verified']){
                    return {
                        message: "Account isn't verified",
                        success: false
                    }
                }
                return {
                    message: "Account has been disabled. Contact customer support",
                    success: false
                }
            case UserAccountState.SUSPENDED:
                return {
                    message: "Account has been suspended. Contact customer support",
                    success: false
                }
        
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
        }]

        const loginQuery = new Table("login_tokens");

        const deviceCheck = await loginQuery.select({
            conditions: {
                compulsory: compulsoryTokenConditions
            }
        });

        if(!isEmpty(deviceCheck)) {
            loginQuery.update(
                [
                    "status"
                ],[
                    "revoked"
                ],
                {
                    compulsory: compulsoryTokenConditions
                }
            )
        }

        // generate jwt token for account auth
        
        const bearerToken = generateToken(TokenType.LOGIN,
            {
                userId: result[0]["user_id"],
                deviceId: params.deviceId,
                userAgent: params.userAgent

            }, 30*24*60*60); // expires 30 days = 30*24*60*60


        const currentTime = new Date();
        const expiryTime = new Date(currentTime.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiryTimeIso = expiryTime.toISOString();
        const currentTImeIso = currentTime.toISOString();


        await loginQuery.insert(
            [
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
            ],
            [
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
            ]
        );




        return {
            message: 'Login Successful',
            token: bearerToken,
            success: true
        };

    }
    catch(error) {
        console.error("Error finding user:", error);
        throw new Error("An error occurred while finding user");
    }
}



export async function verifyLoginToken(userDetails : LoginToken, token: string) : Promise<boolean>{
    try {
        const { userId, deviceId } = userDetails;
        
        const query = new Table("login_tokens");
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

        if (isEmpty(result)){
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("Error verifying login token: ", error);
        throw new Error("Login token verification failed");
    }
}



export async function logAction() {
    
}



interface LoginToken {
    userId: string;
    deviceId: string;
    userAgent: string;

}