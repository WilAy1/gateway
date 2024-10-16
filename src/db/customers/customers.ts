import { CreateCustomer } from "../../interfaces/customers.interface";
import { isEmpty, isValidEmail, isValidUUID } from "../../utils/utils";
import Table from "../query";

const TRANSACTION_COLS = [
    "id",
    "type",
    "amount",
    "currency",
    "reference",
    "description",
    "created_at",
    "completed_at",
    "cancelled_at",
    "cancellation_reason",
    "status",
    "payment_method",
    "payment_channel",
    "customer_id",
    "customer_email",
    "customer_metadata",
    "metadata",
    "chain",
    "deposit_address",
    "coin",
    "exchange_rate",
    "onchain_transaction_hash",
    "onchain_status",
    "coin_price_usd",
    "currency_price_usd",
    "amount_to_pay",
    "deposit_received_at",
    "address_generated_at"
]; 

export default class Customers {
    issuerId: string;
    table: Table;
    transactionsTable: Table;

    constructor(issuerId: string){
        this.issuerId = issuerId;
        this.table = new Table("customers");
        this.transactionsTable = new Table("transactions");
    }
    
    async create(params: CreateCustomer){
        try {
            const { email, name = null, metadata = null } = params;

            const customerCheck = await this.get({
                id: email
            });

            if(customerCheck){
                return //error
            }

            const newCustomer = await this.table.insert(["client_id", "email", "name", "metadata"], [this.issuerId, email, name, metadata], {returnColumn: "id"})

            if(!newCustomer){
                return // failed to create
            }

            const id = newCustomer['id'];
            

            const customer = await this.get({id: id});
            return customer;
        }
        catch(error){
            console.error(error);
            throw new Error("Error creating new customer");
        }
    }

    async all({showTransactions} : {showTransactions: boolean}) {
        const transactionObjStr = TRANSACTION_COLS.map((col) => `'${col}', t.${col}`).join(',');

        const transactionsQuery = showTransactions ? 
            `, CASE WHEN COUNT(t.id) = 0 THEN '[]'::JSON ELSE
            JSON_AGG(JSON_BUILD_OBJECT(${transactionObjStr})) END AS transactions, c.created_at ` : " ";
        
        const transactionsJoin = showTransactions ? "LEFT JOIN transactions t ON c.id=t.customer_id " : " ";
        

        const customers = await this.table
        .customQuery(`SELECT c.id, c.email, c.name, c.metadata \
                        ${transactionsQuery}
                        FROM customers c ${transactionsJoin}\
                        WHERE c.client_id=$1 GROUP BY c.id`, [this.issuerId]);
        // .select({
        //     cols: ["id", "email", "name", "metadata", "created_at", "updated_at"],
        //     conditions: {
        //         compulsory: [
        //             {
        //                 key: "client_id",
        //                 value: this.issuerId
        //             }
        //         ]
        //     }
        // });


        return customers['rows'];

    }

    async get({id} : {id?: string}){ // id can be ID or email
        if(!isValidEmail(id) && !isValidUUID(id)){
            return;
        }

        const transactionObjStr = TRANSACTION_COLS.map((col) => `'${col}', t.${col}`).join(',')

        const conditionVar = isValidUUID(id) ? "c.id" : "c.email";

        const customer = await this.table.customQuery(`SELECT c.id, c.email, c.name, c.metadata, \
                        CASE WHEN COUNT(t.id) = 0 THEN '[]'::JSON ELSE
                        JSON_AGG(JSON_BUILD_OBJECT(${transactionObjStr})) END AS transactions, c.created_at \
                        FROM customers c LEFT JOIN transactions t ON c.id=t.customer_id \
                        WHERE c.client_id=$1 AND ${conditionVar}=$2 GROUP BY c.id`, [this.issuerId, id]);
       
        if(isEmpty(customer['rows'])) return;


        return customer['rows'][0]; //removeKeys(customer[0] as GWObject, ["client_id"]);
    }

    
    async transactions({id}: {id: string}) {
        if(!isValidUUID(id)) return;
        const customer = await this.get({id: id});
        if(!customer) return false

        return customer.transactions;
    }

    async customerExists({id}: {id?: string}) : Promise<boolean>{
        const conditions = [
            {
                key: "client_id",
                value: this.issuerId
            }
        ];
        if(isValidEmail(id)){
            conditions.push({
                key: "email",
                value: id
            });
        }
        else if(isValidUUID(id)){
            conditions.push({
                key: "id",
                value: id
            });
        }
        else {
            return false;
        }
        
        const customer = await this.table.select({
            cols: ["id"],
            conditions: {
                compulsory: conditions
            }
        });

        return !isEmpty(customer);
    }

    

    async update({id, fields} : {id?: string, fields}){
        const customer = await this.get({id:id});
        if(!customer){
            return
        }


        const actualId = customer.id;
        
        const { email, name, metadata } = fields;

        const keys = [];
        const values = [];
        
        if(email && isValidEmail(email)){
            const customerWithEmail = await this.get({id: email});
            if(!customerWithEmail){
                keys.push("email");
                values.push(email);   
            }
        }

        if(name){
            keys.push("name");
            values.push(name);            
        }

        if(metadata){
            keys.push("metadata");
            values.push(metadata);            
        }

        if(isEmpty(keys) || isEmpty(values)) return

        const conditions = [
            {
                key: "client_id",
                value: this.issuerId
            },
            {
                key: "id",
                value: actualId
            }
        ];

        await this.table.update(keys, values, {
            compulsory: conditions
        })

        return await this.get({id: actualId});

    }



}