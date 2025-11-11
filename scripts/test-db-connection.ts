import { createPool } from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
  const pool = createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ Database connection successful!', rows);
    
    // Check if database exists
    const [dbs] = await pool.query('SHOW DATABASES');
    console.log('📊 Available databases:', dbs);
    
    // Check if our database exists
    const dbExists = dbs.some((db: any) => db.Database === process.env.DB_NAME);
    if (!dbExists) {
      console.log(`❌ Database '${process.env.DB_NAME}' does not exist. Creating...`);
      await pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      await pool.query(`USE ${process.env.DB_NAME}`);
      console.log(`✅ Database '${process.env.DB_NAME}' created successfully!`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' exists.`);
      await pool.query(`USE ${process.env.DB_NAME}`);
    }
    
    // Check tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('📋 Existing tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
