/**
 * Development script to clean up test users
 * Run with: node scripts/cleanup-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  const testEmails = [
    'admin@test.com',
    'tenant@test.com', 
    'landlord@test.com',
    'test@example.com'
  ];
  
  for (const email of testEmails) {
    try {
      // Delete from custom users table
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('email', email);
      
      if (profileError) {
        console.log(`❌ Error deleting ${email} from users table:`, profileError.message);
      } else {
        console.log(`✅ Deleted ${email} from users table`);
      }
    } catch (error) {
      console.log(`❌ Error processing ${email}:`, error.message);
    }
  }
  
  console.log('\n📝 Note: Auth users must be deleted manually from Supabase dashboard:');
  console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users');
  console.log('2. Search for test emails and delete them');
  console.log('3. Or use service role key for programmatic deletion\n');
}

cleanupTestUsers().catch(console.error);
