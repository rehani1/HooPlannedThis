import mysql from 'mysql'
import dotenv from 'dotenv'
import { promisify } from 'util'
dotenv.config()

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,
})

pool.query = promisify(pool.query)

pool.getConnection = promisify(pool.getConnection);

export default pool
