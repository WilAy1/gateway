import { generateToken, TokenType } from "../../utils/generate_secure_token";
import { isEmpty } from "../../utils/utils";
import Table from "../query";

export async function generateApiToken(userId: string, tokenType: TokenType) : Promise<string> {
    try {

        const apiToken = generateToken(tokenType, {
            userId: userId
        });

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



export async function verifyApiToken(userDetails, token: string) : Promise<boolean>{
    try {
        const { userId } = userDetails;
        
        const query = new Table("apitokens");
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