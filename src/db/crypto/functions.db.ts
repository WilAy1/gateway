import { QueryResult } from "pg";
import { Chain, UnitCoin } from "../../interfaces/coins";
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

export async function fetchCoins( params?: CoinDetails) : Promise<Chain> {
    try {
        const query = new Query("available_coins");
        const q = "SELECT ac.coin_id, ac.coin, ac.contract_address, ch.chain FROM available_coins ac "+
        `JOIN available_chains ch ON ac.chain_id = ch.chain_id WHERE ac.status=$1 AND ch.status=$2 ${params ? 'AND ch.chain=$3' : ''}`;
        const vals = [
            'active', 'active'
        ];

        if(params){
            vals.push(params.fromChain);
        }


        const result = await query.customQuery(q, vals) as QueryResult;

    
        const data: Chain = {};
        result.rows.forEach(row => {
            const chainName = row.chain;
            if (!data[chainName]) {
                data[chainName] = { chain: chainName, coins: [] };
            }
            data[chainName].coins.push({
                id: row.coin_id,
                coin: row.coin,
                contract_address: row.contract_address,
            });
        });

        return data;




        // const result = await query.select({
        //     cols: [
        //         "coin_id",
        //         "coin",
        //         "chain_id",
        //         "status"
        //     ],
        //     conditions:  {
        //         compulsory: [
        //             {
        //                 key: "status",
        //                 value: "active"
        //             },
        //             params && params.fromChain && {
        //                 key: "chain_name",
        //                 value: params.fromChain.toLowerCase()
        //             }
        //         ]
        //     }
        // }) as UnitCoin[];

        // return result;
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
                "coin",
                "contract_address",
                "chain_id"
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