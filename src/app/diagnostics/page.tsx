'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    setStep(0);
    
    const diagnostics = [];

    try {
      // Step 1: Check environment variables
      setStep(1);
      console.log('🔍 Step 1: Checking environment...');
      
      const envCheck = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') || false
      };
      
      diagnostics.push({
        step: 1,
        name: 'Environment Check',
        status: envCheck.urlValid ? 'success' : 'warning',
        data: envCheck
      });

      // Step 2: Test database connection
      setStep(2);
      console.log('🔍 Step 2: Testing database connection...');
      
      try {
        const { data, error } = await supabase.from('events').select('count').limit(1);
        diagnostics.push({
          step: 2,
          name: 'Database Connection',
          status: error ? 'error' : 'success',
          data: error ? { error: error.message } : { connected: true }
        });
      } catch (err: any) {
        diagnostics.push({
          step: 2,
          name: 'Database Connection',
          status: 'error',
          data: { error: err.message }
        });
      }

      // Step 3: Test events table policies
      setStep(3);
      console.log('🔍 Step 3: Testing events table...');
      
      try {
        const testEvent = {
          id: `test-${Date.now()}`,
          name: 'Test Event',
          slug: `test-${Date.now()}`,
          status: 'active'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('events')
          .insert([testEvent])
          .select();
          
        if (insertError) {
          diagnostics.push({
            step: 3,
            name: 'Events Table Insert',
            status: 'error',
            data: { error: insertError.message, code: insertError.code }
          });
        } else {
          // Clean up test event
          await supabase.from('events').delete().eq('id', testEvent.id);
          diagnostics.push({
            step: 3,
            name: 'Events Table Insert',
            status: 'success',
            data: { message: 'Insert and delete successful' }
          });
        }
      } catch (err: any) {
        diagnostics.push({
          step: 3,
          name: 'Events Table Insert',
          status: 'error',
          data: { error: err.message }
        });
      }

      // Step 4: Test photos table policies
      setStep(4);
      console.log('🔍 Step 4: Testing photos table...');
      
      try {
        const testPhoto = {
          event_id: 'test-event',
          filename: 'test.jpg',
          url: 'https://example.com/test.jpg',
          file_path: 'test/test.jpg',
          size: 1000,
          type: 'image/jpeg'
        };
        
        const { data: photoInsert, error: photoError } = await supabase
          .from('photos')
          .insert([testPhoto])
          .select();
          
        if (photoError) {
          diagnostics.push({
            step: 4,
            name: 'Photos Table Insert',
            status: 'error',
            data: { error: photoError.message, code: photoError.code }
          });
        } else {
          // Clean up
          await supabase.from('photos').delete().eq('id', photoInsert[0].id);
          diagnostics.push({
            step: 4,
            name: 'Photos Table Insert',
            status: 'success',
            data: { message: 'Photos table working correctly' }
          });
        }
      } catch (err: any) {
        diagnostics.push({
          step: 4,
          name: 'Photos Table Insert',
          status: 'error',
          data: { error: err.message }
        });
      }

      // Step 5: Test storage buckets
      setStep(5);
      console.log('🔍 Step 5: Testing storage...');
      
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          diagnostics.push({
            step: 5,
            name: 'Storage Buckets',
            status: 'error',
            data: { error: bucketsError.message }
          });
        } else {
          const photosBucket = buckets?.find(b => b.id === 'photos');
          diagnostics.push({
            step: 5,
            name: 'Storage Buckets',
            status: photosBucket ? 'success' : 'warning',
            data: { 
              buckets: buckets?.map(b => b.id),
              photosBucketExists: !!photosBucket 
            }
          });
        }
      } catch (err: any) {
        diagnostics.push({
          step: 5,
          name: 'Storage Buckets',
          status: 'error',
          data: { error: err.message }
        });
      }

      // Step 6: Test storage upload
      setStep(6);
      console.log('🔍 Step 6: Testing storage upload...');
      
      try {
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testPath = `test/diagnostic-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(testPath, testBlob);
          
        if (uploadError) {
          diagnostics.push({
            step: 6,
            name: 'Storage Upload Test',
            status: 'error',
            data: { error: uploadError.message }
          });
        } else {
          // Clean up
          await supabase.storage.from('photos').remove([testPath]);
          diagnostics.push({
            step: 6,
            name: 'Storage Upload Test',
            status: 'success',
            data: { message: 'Upload and delete successful' }
          });
        }
      } catch (err: any) {
        diagnostics.push({
          step: 6,
          name: 'Storage Upload Test',
          status: 'error',
          data: { error: err.message }
        });
      }

      setResults(diagnostics);
      
    } catch (error: any) {
      console.error('Diagnostics failed:', error);
      diagnostics.push({
        step: 'error',
        name: 'Diagnostics Error',
        status: 'error',
        data: { error: error.message }
      });
      setResults(diagnostics);
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">SnapWorxx Diagnostics</h1>
        
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">Complete System Check</h3>
          <p>This will test all aspects of your setup and identify exactly what needs to be fixed.</p>
        </div>

        {loading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <h3 className="font-bold">Running Diagnostics...</h3>
            <p>Step {step} of 6: {
              step === 1 ? 'Environment Check' :
              step === 2 ? 'Database Connection' :
              step === 3 ? 'Events Table Test' :
              step === 4 ? 'Photos Table Test' :
              step === 5 ? 'Storage Buckets' :
              step === 6 ? 'Storage Upload Test' : 'Processing...'
            }</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-4 mb-6">
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.status === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                result.status === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
                'bg-red-100 border-red-400 text-red-700'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    {result.status === 'success' ? '✅' : 
                     result.status === 'warning' ? '⚠️' : '❌'} 
                    Step {result.step}: {result.name}
                  </h3>
                  <span className="text-sm font-medium">
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <pre className="text-xs bg-white p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
                
                {result.status === 'error' && result.data.error && (
                  <div className="mt-2">
                    {result.data.error.includes('row-level security') && (
                      <div className="text-sm">
                        <strong>Fix:</strong> Run the RLS policies from <code>fix_rls_policies.sql</code> in Supabase SQL Editor
                      </div>
                    )}
                    {result.data.error.includes('Bucket not found') && (
                      <div className="text-sm">
                        <strong>Fix:</strong> Create 'photos' bucket in Supabase Storage Dashboard
                      </div>
                    )}
                    {result.data.error.includes('relation') && result.data.error.includes('does not exist') && (
                      <div className="text-sm">
                        <strong>Fix:</strong> Run table creation SQL from <code>fix_rls_policies.sql</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-4">
          <button 
            onClick={runDiagnostics}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
          >
            {loading ? 'Running Diagnostics...' : '🔍 Run Complete Diagnostics'}
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/e/sample-event-slug" 
              className="block bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center"
            >
              📸 Test Photo Upload
            </a>
            
            <a 
              href="/test-storage" 
              className="block bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center"
            >
              💾 Test Storage Only
            </a>
            
            <a 
              href="/test-db" 
              className="block bg-orange-500 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-center"
            >
              🗄️ Test Database Only
            </a>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Quick Setup Checklist:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold">Database Setup:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to Supabase SQL Editor</li>
                <li>Run <code>fix_rls_policies.sql</code></li>
                <li>Verify policies are created</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Storage Setup:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to Supabase Storage</li>
                <li>Create 'photos' bucket (public)</li>
                <li>Run <code>supabase_storage_setup.sql</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}