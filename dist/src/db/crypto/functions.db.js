"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchChain = exports.fetchCoin = exports.fetchCoins = exports.isChainActive = void 0;
const query_1 = __importDefault(require("../query"));
const utils_1 = require("../../utils/utils");
async function isChainActive(params) {
    try {
        const query = new query_1.default("chains");
        const result = await query.select({ conditions: { compulsory: [
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
    catch (error) {
        console.log(error);
        return false;
    }
}
exports.isChainActive = isChainActive;
async function fetchCoins(params) {
    try {
        const query = new query_1.default("available_coins");
        const q = "SELECT ac.coin_id, ac.coin, ac.contract_address, ch.chain FROM available_coins ac " +
            `JOIN available_chains ch ON ac.chain_id = ch.chain_id WHERE ac.status=$1 AND ch.status=$2 ${params ? 'AND ch.chain=$3' : ''}`;
        const vals = [
            'active', 'active'
        ];
        if (params) {
            vals.push(params.fromChain);
        }
        const result = await query.customQuery(q, vals);
        const data = {};
        result.rows.forEach(row => {
            const chainName = row.chain;
            if (!data[chainName]) {
                data[chainName] = { chain: chainName, coins: [] };
            }
            data[chainName].coins.push({
                id: row.coin_id,
                coin_id: row.coin_id,
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
exports.fetchCoins = fetchCoins;
async function fetchCoin(coinId, params) {
    try {
        const query = new query_1.default("available_coins");
        const compulsoryConditions = [{
                key: "status",
                value: "active"
            }];
        if (params && !coinId) {
            const chainDetails = await fetchChain(params.chainName);
            if (chainDetails) {
                compulsoryConditions.push({
                    key: "chain_id",
                    value: chainDetails["chain_id"]
                }, {
                    key: "coin",
                    value: params.coinName
                });
            }
        }
        else {
            compulsoryConditions.push({
                key: "coin_id",
                value: coinId
            });
        }
        if (compulsoryConditions.length < 2)
            return null;
        const result = await query.select({
            cols: [
                "coin_id",
                "coin",
                "contract_address",
                "chain_id"
            ],
            conditions: {
                compulsory: compulsoryConditions
            }
        });
        return result[0] || null;
    }
    catch (error) {
        console.error("Error fetching coin:", error);
        throw new Error("An error occurred while fetching requested coin");
    }
}
exports.fetchCoin = fetchCoin;
async function fetchChain(chainName) {
    const table = new query_1.default("available_chains");
    const result = await table.select({
        cols: ["chain_id", "chain"],
        conditions: {
            compulsory: [
                {
                    key: "chain",
                    value: chainName
                }
            ]
        }
    });
    if ((0, utils_1.isEmpty)(result))
        return null;
    return result[0];
}
exports.fetchChain = fetchChain;
//# sourceMappingURL=functions.db.js.map