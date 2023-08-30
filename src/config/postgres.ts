import { Pool } from 'pg'

const db = 'tc_book_store';

async function createTables() {
    try {
        const pool = new Pool({
            user: process.env.POSTGRES_USERNAME,
            host: process.env.POSTGRES_HOST,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT,
        });
        const res = await pool.query(`SELECT 1 FROM pg_catalog.pg_database WHERE datname = '${db}'`);
        if (!res.rows.length) {
            await pool.query(`CREATE DATABASE ${db}`);
        }
        await pool.end();
    
        const pool2 = new Pool({
            user: process.env.POSTGRES_USERNAME,
            host: process.env.POSTGRES_HOST,
            database: db,
            password: process.env.POSTGRES_PASSWORD,
            port: process.env.POSTGRES_PORT,
        });
        await pool2.query(`CREATE TABLE IF NOT EXISTS tc_book_requests (
            id serial PRIMARY KEY, 
            action VARCHAR ( 50 ) NOT NULL, 
            book_id VARCHAR ( 100 ) NOT NULL, 
            title VARCHAR NOT NULL, 
            image VARCHAR NOT NULL, 
            quantity INT NOT NULL, 
            price NUMERIC NOT NULL, 
            description VARCHAR, 
            categoryId VARCHAR ( 100 ) NOT NULL, 
            userId VARCHAR ( 100 ) NOT NULL
        )`);
        await pool2.end();
    } catch (error) {
        console.error('Error creating tables in Postgres:', error);
    }
    
}


export { createTables };