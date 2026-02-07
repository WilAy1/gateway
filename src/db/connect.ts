import { Pool } from 'pg';
import { env } from '../utils/env';

// let ssl: unknown = false;
// if(process.env.APP_ENV == "local"){
//   ssl = {
//     rejectUnauthoried: false
//   }
// }

// Create a new Pool instance
const pool = new Pool({
  connectionString: env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  } //false
});


export default pool;