import { fetchChain } from "../crypto/functions.db";
import Table from "../query";
import { ChainTypes } from "../../enums/chain";
import { ConditionChild } from "../../interfaces/db.interface";
import Solana from "../../services/solana/solana";
import { GWObject, isEmpty } from "../../utils/utils";

export default class Settlements {
    private userTable: Table;
    private settlementTable: Table;
    private chainTable: Table;
    private userId: string;

    constructor(userId: string){
        this.userId = userId;
        this.userTable = new Table("users");
        this.settlementTable = new Table("settlement_addresses");
        this.chainTable = new Table("available_chains");
    }
    async add({chainId, address}) {
        try {
            const settlementExists = await this.get({byChainId: chainId});
            if(!isEmpty(settlementExists)){
                return false;
            }

            const chainDetails = await fetchChain({chainId: chainId});
            if(!chainDetails) return false;

            const { chain: chainName } = chainDetails as {chain: string, coin: string};
            const solana = new Solana();
            switch(chainName){
                case ChainTypes.SOLANA:
                    if(!solana.isValidSolanaAddess(address)) return false;
                    break;
                case ChainTypes.ETHEREUM:
                    break
                case ChainTypes.BITCOIN:
                    break
                default:
                    return false;
            }

            const newSettlement = await this.settlementTable.insert(["user_id", "chain_id", "address"], [this.userId, chainId, address], { returnColumn: "id" });
            if(!newSettlement) return;

            return await this.get({byChainId: newSettlement["id"]});
        } catch(e){
            console.error(e);
            return false;
        }
        
        
    }
    async get({byChainId: chainId = null} = null) : Promise<GWObject[]> {
        const conditions: ConditionChild[] = [
            {
                key: "user_id",
                value: this.userId
            }
        ];
        if(chainId){
            conditions.push({
                key: "chain_id",
                value: chainId
            })
        }
        const settlements = await this.settlementTable.select({
            cols: ["chain_id", "is_active", "address"],
            conditions: {
                compulsory: conditions
            }
        });
        
        return settlements as GWObject[];
    }
    async update({chainId, address = null, isActive = null}) {
        if(!address && !isActive) return ;
        
        const keys = [];
        const values = [];

        if(address) {
            keys.push("address");
            values.push(address);
        }
        if(isActive) {
            keys.push("is_active");
            values.push(isActive);
        }

        const conditions = [
            {
                key: "user_id",
                value: this.userId
            },
            {
                key: "chain_id",
                value: chainId
            }
        ];

        await this.settlementTable.update(keys, values, {
            compulsory: conditions
        })

        return await this.get({byChainId: chainId});
    }
    async remove() {
        
    }
 }
