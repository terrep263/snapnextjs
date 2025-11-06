const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePhotos() {
  console.log('🔍 Fetching photos from database...\n');
  
  try {
    // Get all photos
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5); // Get first 5

    if (error) {
      console.error('❌ Error fetching photos:', error);
      process.exit(1);
    }

    console.log(`✅ Found ${photos.length} photos\n`);
    
    photos.forEach((photo, index) => {
      console.log(`\n📸 Photo ${index + 1}:`);
      console.log('─'.repeat(60));
      console.log(JSON.stringify(photo, null, 2));
      console.log('');
    });

    console.log('\n📊 Photo Fields Summary:');
    console.log('─'.repeat(60));
    if (photos.length > 0) {
      const firstPhoto = photos[0];
      const fields = Object.keys(firstPhoto);
      fields.forEach(field => {
        const value = firstPhoto[field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`${field}: ${type} = ${JSON.stringify(value)}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

diagnosePhotos();
