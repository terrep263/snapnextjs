'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StatusCheckPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const checks: any = {};
    
    try {
      // Check 1: Environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      checks.environment = {
        configured: !!(supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')),
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Missing'
      };

      // Check 2: Database connection
      try {
        const { data, error } = await supabase.from('events').select('count').limit(1);
        checks.database = {
          connected: !error,
          error: error?.message || null
        };
      } catch (err) {
        checks.database = {
          connected: false,
          error: 'Connection failed'
        };
      }

      // Check 3: Can we create an event?
      try {
        const testId = `status-test-${Date.now()}`;
        const { data, error } = await supabase
          .from('events')
          .insert([{
            id: testId,
            name: 'Status Test Event',
            slug: `status-test-${Date.now()}`,
            email: 'test@status.com'
          }])
          .select();

        if (!error && data) {
          // Clean up
          await supabase.from('events').delete().eq('id', testId);
          checks.eventInsert = { working: true };
        } else {
          checks.eventInsert = { working: false, error: error?.message || 'Unknown error' };
        }
      } catch (err) {
        checks.eventInsert = { working: false, error: 'Insert test failed' };
      }

      // Check 4: Storage bucket
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        const photosBucket = buckets?.find(b => b.id === 'photos');
        checks.storage = {
          bucketsAccessible: !error,
          photosBucketExists: !!photosBucket,
          error: error?.message || null
        };
      } catch (err) {
        checks.storage = {
          bucketsAccessible: false,
          error: 'Storage access failed'
        };
      }

      // Check 5: Can we upload to storage?
      if (checks.storage?.photosBucketExists) {
        try {
          const testBlob = new Blob(['test'], { type: 'text/plain' });
          const testPath = `status-test/test-${Date.now()}.txt`;
          
          const { data, error } = await supabase.storage
            .from('photos')
            .upload(testPath, testBlob);

          if (!error) {
            // Clean up
            await supabase.storage.from('photos').remove([testPath]);
            checks.storageUpload = { working: true };
          } else {
            checks.storageUpload = { working: false, error: error.message };
          }
        } catch (err) {
          checks.storageUpload = { working: false, error: 'Upload test failed' };
        }
      }

      setStatus(checks);
    } catch (error) {
      console.error('Status check failed:', error);
      setStatus({ error: 'Status check failed' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (check: any) => {
    if (check === true || check?.working === true || check?.connected === true || check?.configured === true) {
      return '✅';
    }
    return '❌';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Checking Status...</h1>
          <div className="animate-pulse">Running system checks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">SnapWorxx Status Check</h1>
        
        <div className="space-y-4">
          {/* Environment Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {getStatusIcon(status.environment?.configured)} Environment Configuration
            </h2>
            <p className="text-sm text-gray-600">
              Supabase URL: {status.environment?.url}
            </p>
            <p className="text-sm text-gray-600">
              Status: {status.environment?.configured ? 'Configured' : 'Not configured'}
            </p>
          </div>

          {/* Database Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {getStatusIcon(status.database?.connected)} Database Connection
            </h2>
            <p className="text-sm text-gray-600">
              Connection: {status.database?.connected ? 'Working' : 'Failed'}
            </p>
            {status.database?.error && (
              <p className="text-sm text-red-600">Error: {status.database.error}</p>
            )}
          </div>

          {/* Event Insert Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {getStatusIcon(status.eventInsert?.working)} Event Creation (RLS Policies)
            </h2>
            <p className="text-sm text-gray-600">
              Status: {status.eventInsert?.working ? 'Working - Policies applied!' : 'Failed - Need to apply RLS policies'}
            </p>
            {status.eventInsert?.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">Error: {status.eventInsert.error}</p>
                <p className="text-sm text-red-600 mt-1">
                  Run the COMPLETE_DATABASE_SETUP.sql in Supabase SQL Editor
                </p>
              </div>
            )}
          </div>

          {/* Storage Bucket Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {getStatusIcon(status.storage?.photosBucketExists)} Storage Bucket
            </h2>
            <p className="text-sm text-gray-600">
              Bucket Access: {status.storage?.bucketsAccessible ? 'Working' : 'Failed'}
            </p>
            <p className="text-sm text-gray-600">
              Photos Bucket: {status.storage?.photosBucketExists ? 'Exists' : 'Missing'}
            </p>
            {status.storage?.error && (
              <p className="text-sm text-red-600">Error: {status.storage.error}</p>
            )}
          </div>

          {/* Storage Upload Check */}
          {status.storage?.photosBucketExists && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {getStatusIcon(status.storageUpload?.working)} Storage Upload
              </h2>
              <p className="text-sm text-gray-600">
                Upload Test: {status.storageUpload?.working ? 'Working' : 'Failed'}
              </p>
              {status.storageUpload?.error && (
                <p className="text-sm text-red-600">Error: {status.storageUpload.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Overall Status */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Overall Status</h2>
          {status.eventInsert?.working && status.storage?.photosBucketExists ? (
            <div className="text-green-600">
              <p className="font-semibold">🎉 All systems operational!</p>
              <p>Photo uploads should work perfectly now.</p>
              <a href="/e/sample-event-slug" className="inline-block mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Test Photo Upload →
              </a>
            </div>
          ) : (
            <div className="text-orange-600">
              <p className="font-semibold">⚠️ Setup required</p>
              <p>Some components need configuration before photo uploads will work.</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button 
            onClick={checkStatus}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}