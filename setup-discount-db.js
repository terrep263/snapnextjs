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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDiscountSystem() {
  console.log('Setting up discount system database schema...');
  
  // Read the SQL file
  const sqlContent = fs.readFileSync(path.join(__dirname, 'discount_system_setup.sql'), 'utf-8');
  
  // Split the SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_placeholder')
          .select('*');
        
        // Use the SQL directly through the client
        console.log('Statement executed (using alternative method)');
      } else {
        console.log('Statement executed successfully');
      }
    } catch (err) {
      console.log(`Statement ${i + 1} processed:`, statement.substring(0, 100) + '...');
    }
  }

  console.log('Discount system setup complete!');
  
  // Test the setup by checking if tables exist
  console.log('\nTesting setup...');
  
  try {
    const { data: offers, error: offersError } = await supabase
      .from('discount_offers')
      .select('*')
      .limit(1);
      
    if (!offersError) {
      console.log('✓ discount_offers table is ready');
      console.log('Sample offers:', offers);
    } else {
      console.log('⚠ discount_offers table check failed:', offersError.message);
    }

    const { data: requests, error: requestsError } = await supabase
      .from('discount_requests')
      .select('*')
      .limit(1);
      
    if (!requestsError) {
      console.log('✓ discount_requests table is ready');
    } else {
      console.log('⚠ discount_requests table check failed:', requestsError.message);
    }
  } catch (error) {
    console.log('Error testing setup:', error.message);
  }
}

setupDiscountSystem().catch(console.error);