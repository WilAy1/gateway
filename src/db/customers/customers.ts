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
        try {
            const transactionObjStr = TRANSACTION_COLS.map((col) => `'${col}', t.${col}`).join(',');

            const transactionsQuery = showTransactions ? 
                `, (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(${transactionObjStr})), '[]') AS transactions FROM transactions t WHERE c.id=t.customer_id)` : " ";
            
            //const transactionsJoin = showTransactions ? "LEFT JOIN transactions t ON c.id=t.customer_id " : " ";
            

            const customers = await this.table
            .customQuery(`WITH customer_aggregates AS (SELECT c.id, c.email, c.name, c.metadata, c.created_at,\
            COALESCE(SUM(t.amount), 0) AS total_spend, COUNT(t.id) AS total_transactions, MAX(t.created_at) AS last_transaction\
            ${transactionsQuery} \
            FROM customers c LEFT JOIN transactions t ON c.id = t.customer_id\
            WHERE c.client_id = $1 GROUP BY c.id )\
            SELECT \
            JSON_BUILD_OBJECT(\
            'total', COUNT(*),\
            'customers', COALESCE(JSON_AGG(JSON_BUILD_OBJECT(\
                        'id', ca.id,\
                        'email', ca.email,\
                        'name', ca.name,\
                        'metadata', ca.metadata,\
                        'created_at', ca.created_at,\
                        'total_spend', ca.total_spend,\
                        'total_transactions', ca.total_transactions,\
                        'last_transaction', ca.last_transaction\
                        ${showTransactions ? `,'transactions', ca.transactions` : ""})), '[]')\
            ) FROM\
            customer_aggregates ca`, [this.issuerId]);
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


        return customers['rows'][0]['json_build_object'];
        }

        catch(error) {
            console.error(error);
            throw error;
        }
    }

    async get({id} : {id?: string}){ // id can be ID or email
        if(!isValidEmail(id) && !isValidUUID(id)){
            return;
        }

        const transactionObjStr = TRANSACTION_COLS.map((col) => `'${col}', t.${col}`).join(',')

        const transactionsQuery = `, (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(${transactionObjStr})), '[]') AS transactions FROM ordered_transactions t WHERE c.id=t.customer_id)`;


        const conditionVar = isValidUUID(id) ? "c.id" : "c.email";


        const customer = await this.table
            .customQuery(`WITH ordered_transactions AS (
            SELECT t.* \
            FROM transactions t \
            WHERE t.customer_id = $2\
            ORDER BY t.created_at DESC), customer_aggregates AS (SELECT c.id, c.email, c.name, c.metadata, c.created_at,\
            COALESCE(SUM(t.amount), 0) AS total_spend, COUNT(t.id) AS total_transactions, MIN(t.created_at) AS first_transaction, MAX(t.created_at) AS last_transaction\
            ${transactionsQuery} \
            FROM customers c LEFT JOIN transactions t ON c.id = t.customer_id\
            WHERE c.client_id = $1 AND ${conditionVar}=$2 GROUP BY c.id )\
            SELECT \
            JSON_BUILD_OBJECT(\
                        'id', ca.id,\
                        'email', ca.email,\
                        'name', ca.name,\
                        'metadata', ca.metadata,\
                        'created_at', ca.created_at,\
                        'total_spend', ca.total_spend,\
                        'total_transactions', ca.total_transactions,\
                        'last_transaction', ca.last_transaction,\
                        'first_transaction', ca.first_transaction,\
                        'transactions', ca.transactions), '[]'\
             FROM\
            customer_aggregates ca`, [this.issuerId, id]);


        if(isEmpty(customer['rows'])) return;


        return customer['rows'][0]['json_build_object']; //removeKeys(customer[0] as GWObject, ["client_id"]);
    }

    
    async transactions({id}: {id: string}) {
        if(!isValidUUID(id)) return;
        const customer = await this.get({id: id});
        if(!customer) return false

        return customer.transactions;
    }

    async customerExists({id}: {id?: string}) : Promise<string | boolean>{
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

        if(isEmpty(customer)) return false

        return customer[0]['id'];
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