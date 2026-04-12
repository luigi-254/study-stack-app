import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xudmceyarcdqottdqrmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZG1jZXlhcmNkcW90dGRxcm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzYxODUsImV4cCI6MjA5MTE1MjE4NX0.dXEMjyeb8hyvESpZP6riXIWqgWuJWPzMbYt19K2bFGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Attempting to login jkemboi744@gmail.com...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'jkemboi744@gmail.com',
    password: 'enockmatara254D'
  });

  if (error) {
    console.error("LOGIN FAILED:", error.message);
  } else {
    console.log("LOGIN SUCCESSFUL! User ID:", data.user.id);
  }
}

testLogin();
