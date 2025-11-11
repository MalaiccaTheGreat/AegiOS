import { sql } from 'drizzle-orm';

export async function up(db) {
  // Add labor_type column to time_entries
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS labor_type TEXT 
    CHECK (labor_type IN ('assembly', 'electrical', 'plumbing', 'carpentry', 'masonry', 'painting', 'roofing', 'other'));
  `);

  // Add is_overtime column to time_entries
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS is_overtime BOOLEAN NOT NULL DEFAULT false;
  `);

  // Add overtime_hours column to time_entries
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5, 2) DEFAULT 0;
  `);

  // Add regular_hours column to time_entries
  await db.run(sql`
    ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS regular_hours DECIMAL(5, 2) DEFAULT 0;
  `);

  // Create index on labor_type for better query performance
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS time_entries_labor_type_idx ON time_entries(labor_type);
  `);

  // Create index on is_overtime for better query performance
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS time_entries_is_overtime_idx ON time_entries(is_overtime);
  `);

  console.log('Successfully enhanced time_entries table for construction tracking');
}

export async function down(db) {
  // Drop indexes
  await db.run(sql`DROP INDEX IF EXISTS time_entries_is_overtime_idx;`);
  await db.run(sql`DROP INDEX IF EXISTS time_entries_labor_type_idx;`);

  // Drop columns
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS regular_hours;`);
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS overtime_hours;`);
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS is_overtime;`);
  await db.run(sql`ALTER TABLE time_entries DROP COLUMN IF EXISTS labor_type;`);

  console.log('Successfully reverted time_entries table changes');
}
