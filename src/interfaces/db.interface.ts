
export interface UpdateReturn {
    [key: string] : unknown
}

export type DBQueryReturnType = {
    query : string,
    conditionValues: unknown[]
}

export type ConditionChild = {
    key: string,
    value: unknown
}

export type Condition = {
    optional? : ConditionChild[]
    compulsory? : ConditionChild[]
}

export interface UniqueObject {
    [key: string] : Array<unknown>
}
export interface DBSelectParams {
    cols? : string[];
    conditions?: Condition;
}

export interface ChainDetails {
    chainId: string;
}
export interface CoinDetails {
    fromChain?: string
}