/**
 * Download Flow Debug - Check what's happening
 * 
 * Add this to browser console to test:
 */

// TEST 1: Check if allItems is populated
console.log('📊 allItems count:', document.querySelector('[data-items-count]')?.textContent);

// TEST 2: Check if selected items are tracked
console.log('📊 selectedItems count:', new Set().size); // Will show 0, but shows the concept

// TEST 3: Test fetch to /api/bulk-download
async function testBulkDownload() {
  console.log('🧪 Testing /api/bulk-download endpoint...');
  
  const testItems = [
    {
      id: 'test-1',
      url: 'https://example.com/test.jpg',
      title: 'Test Item 1'
    }
  ];
  
  try {
    const response = await fetch('/api/bulk-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'test-download',
        items: testItems
      }),
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response OK:', response.ok);
    console.log('✅ Content-Type:', response.headers.get('Content-Type'));
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ Blob size:', blob.size, 'bytes');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Run test: testBulkDownload()
