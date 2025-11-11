import { createPool } from 'mysql2/promise';
import { readFile } from 'fs/promises';
import path from 'path';
import 'dotenv/config';

async function runSqlMigrations() {
  if (!process.env.DB_NAME) {
    throw new Error('DB_NAME is not defined in .env');
  }

  const pool = createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    // Create database if it doesn't exist
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await pool.query(`USE ${process.env.DB_NAME}`);
    
    console.log('🚀 Starting SQL migrations...');
    
    // Get all migration files in order
    const migrationFiles = [
      '0001_create_businesses.sql',
      '0002_create_clients.sql',
      '0003_create_projects.sql',
      '0004_create_employees.sql',
      '0005_create_time_entries.sql',
      '0006_create_users_table.sql',
      '0007_add_aegisos_tables.sql'
    ];
    
    // Check if users table exists (required for foreign key constraints)
    try {
      await pool.query('SELECT 1 FROM users LIMIT 1');
    } catch (error) {
      console.warn('⚠️  Users table not found. Some foreign key constraints may fail.');
      console.warn('Please ensure the users table exists before running this migration.');
    }
    
    for (const file of migrationFiles) {
      console.log(`🔄 Running migration: ${file}`);
      const filePath = path.join(process.cwd(), 'migrations', file);
      const sql = await readFile(filePath, 'utf-8');
      await pool.query(sql);
      console.log(`✅ Successfully applied: ${file}`);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runSqlMigrations();
