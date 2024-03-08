import { UnitCoin } from "../../interfaces/coins";
import { ChainDetails, CoinDetails } from "../../interfaces/db.interface";
import Query from "../query";


export async function isChainActive( params: ChainDetails ) : Promise<boolean> {
    try {
        const query = new Query("chains");

        const result = await query.select({ conditions: { compulsory:  [ 
            {
                key: "status",
                value: "active"
            },
            {
                key: "chain_id",
                value: params.chainId
            }
        ] } });

        return result.length === 1; // true if chain is active and it's the only chain with such chain_id
    }
    catch(error){
        console.log(error);
        return false;
    }
}

export async function fetchCoins( params?: CoinDetails) : Promise<Array<UnitCoin>> {
    try {
        const query = new Query("available_coins");
        const result = await query.select({
            cols: [
                "coin_id",
                "coin_name",
                "chain_name",
                "status"
            ],
            conditions:  {
                compulsory: [
                    {
                        key: "status",
                        value: "active"
                    },
                    params.fromChain && {
                        key: "chain_name",
                        value: params.fromChain.toLowerCase()
                    }
                ]
            }
        }) as UnitCoin[];

        return result;
    }
    catch (error) {
        console.error("Error fetching coins:", error);
        throw new Error("An error occurred while fetching coins");
    }
}

export async function fetchCoin(coinId:string) : Promise<Array<UnitCoin>> {
    try {
        const query = new Query("available_coins");
        const result = await query.select({
            cols: [
                "coin_id",
                "coin_name",
                "chain_name"
            ],
            conditions: {
                compulsory: [
                    {
                        key: "status",
                        value: "active"
                    },
                    {
                        key: "coin_id",
                        value: coinId
                    }
                ]
            }
        }) as UnitCoin[];

        return result;
    }
    catch(error) {
        console.error("Error fetching coin:", error);
        throw new Error("An error occurred while fetching requested coin");
    }
}