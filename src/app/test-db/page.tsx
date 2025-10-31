'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDatabasePage() {
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test 1: Try to read events
      console.log('🔍 Testing events table access...');
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(5);
      
      if (eventsError) {
        console.error('❌ Events query error:', eventsError);
        setError(`Events table error: ${eventsError.message}`);
        return;
      }
      
      console.log('✅ Events query successful:', events);
      
      // Test 2: Try to read photos
      console.log('🔍 Testing photos table access...');
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .limit(5);
      
      if (photosError) {
        console.error('❌ Photos query error:', photosError);
        setError(`Photos table error: ${photosError.message}`);
        return;
      }
      
      console.log('✅ Photos query successful:', photos);
      
      // Test 3: Try to create a test event
      console.log('🔍 Testing event creation...');
      const testEvent = {
        id: 'test-event-' + Date.now(),
        name: 'Test Event',
        slug: 'test-event-' + Date.now(),
        status: 'active'
      };
      
      const { data: createResult, error: createError } = await supabase
        .from('events')
        .insert([testEvent])
        .select();
      
      if (createError) {
        console.error('❌ Event creation error:', createError);
        setError(`Event creation error: ${createError.message}`);
        return;
      }
      
      console.log('✅ Event creation successful:', createResult);
      
      // Test 4: Try to delete the test event
      console.log('🔍 Testing event deletion...');
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', testEvent.id);
      
      if (deleteError) {
        console.error('❌ Event deletion error:', deleteError);
        setError(`Event deletion error: ${deleteError.message}`);
        return;
      }
      
      console.log('✅ Event deletion successful');
      
      setResults([
        { test: 'Events table read', status: 'success', data: events },
        { test: 'Photos table read', status: 'success', data: photos },
        { test: 'Event creation', status: 'success', data: createResult },
        { test: 'Event deletion', status: 'success', data: 'Deleted successfully' }
      ]);
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      setError(`Database test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
          <div className="animate-pulse">Testing database connection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-600">✅ All tests passed!</h2>
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">{result.test}</h3>
                <p className="text-sm text-gray-600">Status: {result.status}</p>
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6">
          <button 
            onClick={testDatabaseConnection}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Run Test Again
          </button>
        </div>
      </div>
    </div>
  );
}