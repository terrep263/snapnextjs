const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDiscountOffer() {
  console.log('Creating a sample discount offer...');
  
  // First, let's just try to insert data and see what happens
  const { data, error } = await supabase
    .from('discount_offers')
    .insert([
      {
        code: 'LAUNCH50',
        percent_off: 50,
        active: true,
        description: 'Launch Special - 50% off your first event'
      }
    ])
    .select();

  if (error) {
    console.error('Error creating discount offer:', error);
    console.log('The tables might not exist yet. Let me create them manually...');
    
    // Let's create the tables using a different approach
    console.log('Creating discount_offers table...');
    
    // Test if we can at least access the database
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Database connection failed:', testError);
      return;
    }
    
    console.log('Database connection works. Tables need to be created through Supabase dashboard.');
    console.log('Please go to your Supabase dashboard and create the tables manually using the SQL from discount_system_setup.sql');
    
  } else {
    console.log('✓ Discount offer created successfully:', data);
  }
}

createDiscountOffer().catch(console.error);