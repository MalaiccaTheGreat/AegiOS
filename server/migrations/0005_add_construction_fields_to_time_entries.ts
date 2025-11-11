import { sql } from 'drizzle-orm';

export async function up(db) {
  // Add labor_type column with check constraint
  await db.run(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'time_entries' AND column_name = 'labor_type') THEN
        ALTER TABLE time_entries 
        ADD COLUMN labor_type TEXT 
        CHECK (labor_type IN ('assembly', 'electrical', 'plumbing', 'carpentry', 'masonry', 'painting', 'roofing', 'other'));
      END IF;
    END $$;
  `);

  // Add is_overtime column
  await db.run(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'time_entries' AND column_name = 'is_overtime') THEN
        ALTER TABLE time_entries 
        ADD COLUMN is_overtime BOOLEAN NOT NULL DEFAULT false;
      END IF;
    END $$;
  `);

  // Add overtime_hours column
  await db.run(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'time_entries' AND column_name = 'overtime_hours') THEN
        ALTER TABLE time_entries 
        ADD COLUMN overtime_hours DECIMAL(5, 2) DEFAULT 0;
      END IF;
    END $$;
  `);

  // Add regular_hours column
  await db.run(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'time_entries' AND column_name = 'regular_hours') THEN
        ALTER TABLE time_entries 
        ADD COLUMN regular_hours DECIMAL(5, 2) DEFAULT 0;
      END IF;
    END $$;
  `);

  // Create index on labor_type
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS time_entries_labor_type_idx ON time_entries(labor_type);
  `);

  // Create index on is_overtime
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS time_entries_is_overtime_idx ON time_entries(is_overtime);
  `);
}

export async function down(db) {
  // Drop indexes first
  await db.run(sql`DROP INDEX IF EXISTS time_entries_is_overtime_idx;`);
  await db.run(sql`DROP INDEX IF EXISTS time_entries_labor_type_idx;`);

  // Drop columns
  await db.run(sql`
    ALTER TABLE time_entries DROP COLUMN IF EXISTS regular_hours;
    ALTER TABLE time_entries DROP COLUMN IF EXISTS overtime_hours;
    ALTER TABLE time_entries DROP COLUMN IF EXISTS is_overtime;
    ALTER TABLE time_entries DROP COLUMN IF EXISTS labor_type;
  `);
}
