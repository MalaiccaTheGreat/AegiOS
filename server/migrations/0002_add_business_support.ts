import { Knex } from 'knex';
import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export async function up(db: Knex): Promise<void> {
  // Create the businesses table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      logo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  // Add business_id column to services table
  await db.run(sql`
    ALTER TABLE services 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Add business_id column to employees table
  await db.run(sql`
    ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Add business_id column to clients table
  await db.run(sql`
    ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Add business_id column to time_entries table
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Add business_id column to quotations table
  await db.run(sql`
    ALTER TABLE quotations 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Add business_id column to invoices table
  await db.run(sql`
    ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE;
  `);

  // Create indexes for better query performance
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_time_entries_business_id ON time_entries(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON quotations(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);`);
}

export async function down(db: Knex): Promise<void> {
  // Drop indexes
  await db.run(sql`DROP INDEX IF EXISTS idx_services_business_id;`);
  await db.run(sql`DROP INDEX IF EXISTS idx_employees_business_id;`);
  await db.run(sql`DROP INDEX IF EXISTS idx_clients_business_id;`);
  await db.run(sql`DROP INDEX IF EXISTS idx_time_entries_business_id;`);
  await db.run(sql`DROP INDEX IF EXISTS idx_quotations_business_id;`);
  await db.run(sql`DROP INDEX IF EXISTS idx_invoices_business_id;`);

  // Drop business_id columns
  await db.run(sql`ALTER TABLE services DROP COLUMN IF EXISTS business_id;`);
  await db.run(sql`ALTER TABLE employees DROP COLUMN IF EXISTS business_id;`);
  await db.run(sql`ALTER TABLE clients DROP COLUMN IF EXISTS business_id;`);
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS business_id;`);
  await db.run(sql`ALTER TABLE quotations DROP COLUMN IF EXISTS business_id;`);
  await db.run(sql`ALTER TABLE invoices DROP COLUMN IF EXISTS business_id;`);

  // Drop businesses table
  await db.run(sql`DROP TABLE IF EXISTS businesses;`);
}
