import { GWObject } from "../utils/utils";

export interface CreateCustomer {
    email: string,
    name?: string,
    metadata?: GWObject
}