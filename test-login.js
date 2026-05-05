import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const testEmail = process.env.VITE_TEST_EMAIL;
  const testPassword = process.env.VITE_TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    console.error("TEST CREDENTIALS NOT SET: Please set VITE_TEST_EMAIL and VITE_TEST_PASSWORD in .env.local");
    return;
  }

  console.log(`Attempting to login ${testEmail}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (error) {
    console.error("LOGIN FAILED:", error.message);
  } else {
    console.log("LOGIN SUCCESSFUL! User ID:", data.user.id);
  }
}

testLogin();
