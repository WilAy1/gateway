import { OrderDirection } from "../../interfaces/db.interface";
import { TokenType } from "../../utils/generate_secure_token";
import { isEmpty } from "../../utils/utils";
import Table from "../query";
import crypto from 'crypto';

export class Tokens {
    private readonly privateTable: Table;
    private readonly publicTable: Table;
    private readonly ownerId: string;
    constructor(userId: string){
        this.privateTable = new Table("apitokens");
        this.publicTable = new Table("public_apitokens");
        this.ownerId = userId;
    }

    async generatePrivate(){
 
    }

    generatePublic(){
        
    }

    async getPrivate() {
        const result = await this.privateTable.select({
            cols: ["api_token as token", "status", "owner_id as id", "created_at", "times_used as usage_count", "last_time_used"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    }
                ],
                orderBy: ["last_time_used", "created_at"],
                limit: 20,
                orderDir: OrderDirection.DESCENDING
            }
        });

        return result;
    }
    async getPublic() {
        const result = await this.publicTable.select({
            cols: ["api_token as token", "status", "owner_id as id", "created_at", "times_used as usage_count", "last_time_used"],
            conditions: {
                compulsory: [
                    {
                        key: "owner_id",
                        value: this.ownerId
                    }
                ],
                orderBy: ["last_time_used", "created_at"],
                limit: 20,
                orderDir: OrderDirection.DESCENDING
            }
        });

        return result;
    }

    async get(){
        return {
            "private": await this.getPrivate(),
            "public": await this.getPublic()
        };
    }
}


export async function generateApiToken(userId: string, tokenType: TokenType) : Promise<string> {
    try {

        const randomKey = crypto.randomBytes(32).toString("hex");
        const apiToken = `sk_test_${randomKey}`;

        // const apiToken = generateToken(tokenType, {
        //     userId: userId
        // });

        let inTable: string;
        if(tokenType == TokenType.PRIVATE_API){
            inTable = "apitokens"
        }
        else if(tokenType == TokenType.PUBLIC_API) {
            inTable = "public_apitokens";
        }
        else {
            throw Error("Invalid token type");
        }

        const query = new Table(inTable); 

        await query.update(
            [
                "status",
            ],
            [
                "revoked"
            ],
            {
                compulsory: [
                    {
                        key: "owner_id",
                        value: userId
                    }
                ]
            }
        )


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
    catch(error) {
        console.log("Error generating api token: ", error);
        throw new Error("Failed to generate api token")
    }
}


export async function isValidApiToken(token: string, tokenType: TokenType): Promise<false | { userId: unknown }> {
    try {
        
        const query = new Table(tokenType == TokenType.PRIVATE_API ? "apitokens" : "public_apitokens");
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


        if (isEmpty(result)){
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