import { TransactionsDBQueries } from "./transactions.db";

class UserTransactions extends TransactionsDBQueries {
    constructor(issuer: string){
        super(issuer);
    }


}


export default UserTransactions;