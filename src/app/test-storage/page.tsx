'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StorageTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testStorageSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);
      
      console.log('🔍 Testing Supabase storage setup...');
      
      // Test 1: Check if photos bucket exists
      console.log('1. Checking if photos bucket exists...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw new Error(`Failed to list buckets: ${bucketsError.message}`);
      }
      
      const photosBucket = buckets?.find(bucket => bucket.id === 'photos');
      
      if (!photosBucket) {
        setError('❌ Photos bucket not found! Please create it in Supabase Dashboard > Storage > New bucket > name: "photos" > enable "Public bucket"');
        return;
      }
      
      console.log('✅ Photos bucket exists:', photosBucket);
      
      // Test 2: Test upload permission (create a tiny test file)
      console.log('2. Testing upload permission...');
      const testContent = 'test-file-content';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(`test/${testFileName}`, testBlob);
      
      if (uploadError) {
        throw new Error(`Upload test failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload test successful:', uploadData);
      
      // Test 3: Test public URL generation
      console.log('3. Testing public URL generation...');
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(`test/${testFileName}`);
      
      console.log('✅ Public URL generated:', urlData.publicUrl);
      
      // Test 4: Test delete permission
      console.log('4. Testing delete permission...');
      const { error: deleteError } = await supabase.storage
        .from('photos')
        .remove([`test/${testFileName}`]);
      
      if (deleteError) {
        throw new Error(`Delete test failed: ${deleteError.message}`);
      }
      
      console.log('✅ Delete test successful');
      
      // All tests passed
      setResults([
        { test: 'Bucket exists', status: 'success', data: photosBucket },
        { test: 'Upload permission', status: 'success', data: uploadData },
        { test: 'Public URL access', status: 'success', data: urlData.publicUrl },
        { test: 'Delete permission', status: 'success', data: 'File deleted successfully' }
      ]);
      
    } catch (error: any) {
      console.error('❌ Storage test failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Storage Setup Test</h1>
        
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">Storage Bucket Setup Required</h3>
          <p>If you see a "Bucket not found" error, you need to:</p>
          <ol className="list-decimal list-inside mt-2">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to Storage</li>
            <li>Click "New bucket"</li>
            <li>Name it "photos"</li>
            <li>Enable "Public bucket"</li>
            <li>Click "Save"</li>
          </ol>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-green-600">✅ Storage setup is working!</h2>
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">{result.test}</h3>
                <p className="text-sm text-gray-600">Status: {result.status}</p>
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto max-h-40">
                  {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-x-4">
          <button 
            onClick={testStorageSetup}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Testing...' : 'Test Storage Setup'}
          </button>
          
          <a 
            href="/e/sample-event-slug" 
            className="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Photo Upload
          </a>
        </div>
        
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Manual Storage Setup Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open Supabase Dashboard: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600">https://supabase.com/dashboard</a></li>
            <li>Select your project: ofmzpgbuawtwtzgrtiwr</li>
            <li>Go to Storage in the sidebar</li>
            <li>Click "New bucket"</li>
            <li>Set name: "photos"</li>
            <li>Enable "Public bucket" checkbox</li>
            <li>Click "Save"</li>
            <li>Then run the SQL from supabase_storage_setup.sql in SQL Editor</li>
          </ol>
        </div>
      </div>
    </div>
  );
}