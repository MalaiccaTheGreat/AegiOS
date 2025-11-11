import { sql } from 'drizzle-orm';
import { integer, pgTable, serial, text, date, decimal, timestamp } from 'drizzle-orm/pg-core';

export async function up(db) {
  // Create projects table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
      start_date DATE,
      target_end_date DATE,
      actual_end_date DATE,
      budget DECIMAL(12, 2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Add project_id to time_entries
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  `);

  // Add project_id to invoices
  await db.run(sql`
    ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS projects_business_id_idx ON projects(business_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS time_entries_project_id_idx ON time_entries(project_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS invoices_project_id_idx ON invoices(project_id);`);
}

export async function down(db) {
  // Drop indexes
  await db.run(sql`DROP INDEX IF EXISTS invoices_project_id_idx;`);
  await db.run(sql`DROP INDEX IF EXISTS time_entries_project_id_idx;`);
  await db.run(sql`DROP INDEX IF EXISTS projects_business_id_idx;`);

  // Drop columns
  await db.run(sql`ALTER TABLE invoices DROP COLUMN IF EXISTS project_id;`);
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS project_id;`);

  // Drop projects table
  await db.run(sql`DROP TABLE IF EXISTS projects CASCADE;`);
}
