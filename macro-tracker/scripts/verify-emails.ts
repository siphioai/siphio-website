#!/usr/bin/env node
/**
 * Script to verify all user emails in the database
 * Run with: npx tsx scripts/verify-emails.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAllEmails() {
  console.log('🔍 Checking users without verified emails...\n');

  // Get all users without verified emails
  const { data: unverifiedUsers, error: fetchError } = await supabase
    .from('users')
    .select('id, email, email_verified_at')
    .is('email_verified_at', null);

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError.message);
    process.exit(1);
  }

  if (!unverifiedUsers || unverifiedUsers.length === 0) {
    console.log('✅ All users already have verified emails!');
    return;
  }

  console.log(`📧 Found ${unverifiedUsers.length} user(s) without verified emails:`);
  unverifiedUsers.forEach((user) => {
    console.log(`   - ${user.email || 'No email'} (ID: ${user.id})`);
  });

  console.log('\n🔄 Verifying all emails...\n');

  // Update all users to mark emails as verified
  const { error: updateError } = await supabase
    .from('users')
    .update({ email_verified_at: new Date().toISOString() })
    .is('email_verified_at', null);

  if (updateError) {
    console.error('❌ Error updating users:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully verified ${unverifiedUsers.length} email(s)!\n`);
  console.log('🎉 All users can now use the AI Nutrition Coach.\n');
}

// Run the script
verifyAllEmails()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
