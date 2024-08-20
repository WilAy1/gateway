import { generateApiBearerToken } from "../../utils/generate_secure_token";
import { isEmpty } from "../../utils/utils";
import Query from "../query";

export async function generateApiToken(userId: string) : Promise<string> {
    try {

        const apiToken = generateApiBearerToken({
            userId: userId
        });

        const query = new Query("apitokens");

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
        
        const query = new Query("apitokens");
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