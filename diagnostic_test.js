// Database Connection Test Script
// Run this in browser console on /e/test page

console.log('🔍 Starting Comprehensive Diagnostic...');

// Test 1: Check if Supabase is properly initialized
console.log('📡 Testing Supabase Connection...');
fetch('/api/test-db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: 'connection' })
})
.then(r => r.json())
.then(d => console.log('📡 DB Connection Result:', d))
.catch(e => console.error('❌ DB Connection Failed:', e));

// Test 2: Check photos loading for test event
console.log('📸 Testing Photo Loading...');
import { supabase } from '/src/lib/supabase';

supabase
  .from('photos')
  .select('*')
  .eq('event_id', 'test')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Photo Query Error:', error);
    } else {
      console.log('✅ Photos Loaded:', data?.length || 0);
      console.log('📸 Photo Data:', data);
    }
  });

// Test 3: Check event data
console.log('📅 Testing Event Loading...');
supabase
  .from('events')
  .select('*')
  .eq('id', 'test')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Event Query Error:', error);
    } else {
      console.log('✅ Event Loaded:', data);
    }
  });

// Test 4: Check component props mapping
console.log('🎯 Testing Component Props...');
const testPhoto = {
  id: 'test-123',
  filename: 'test.jpg',
  url: 'https://example.com/test.jpg',
  created_at: '2025-01-01T00:00:00Z',
  size: 123456,
  type: 'image/jpeg'
};

const mappedPhoto = {
  id: testPhoto.id,
  url: testPhoto.url,
  thumbnail: testPhoto.thumbnail_url || testPhoto.url,
  title: testPhoto.title || testPhoto.filename,
  description: testPhoto.description,
  uploadedAt: testPhoto.created_at,
  isVideo: testPhoto.is_video || testPhoto.filename?.includes('.mp4'),
  duration: testPhoto.duration,
  size: testPhoto.size,
  likes: testPhoto.likes || 0,
  isFavorite: testPhoto.is_favorite || false
};

console.log('🔄 Original Photo:', testPhoto);
console.log('🎯 Mapped Photo:', mappedPhoto);

console.log('✅ Diagnostic Complete!');