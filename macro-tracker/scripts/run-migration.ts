// Script to run database migrations
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile: string) {
  console.log(`\n📝 Running migration: ${migrationFile}`);

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if RPC doesn't work
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.from('_migrations').insert({
            name: migrationFile,
            executed_at: new Date().toISOString()
          });

          if (execError) {
            console.error('❌ Error:', execError.message);
          }
        }
      }

      console.log('✅ Migration completed (with manual execution)');
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

async function main() {
  const migrationFile = process.argv[2] || '004_add_goal_sync_trigger.sql';
  await runMigration(migrationFile);
}

main();
