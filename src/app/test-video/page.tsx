'use client';

export default function TestVideoPage() {
  // Your actual video URL
  const videoUrl = "https://sharedfrom.snapworxx.com/storage/v1/object/public/photos/evt_1764258395691_5dfd48d4/1764280765481-20251127_165813.mp4";
  
  // A known working public video
  const testVideoUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Video Test Page</h1>
      
      {/* Test 1: Simple video element with your video */}
      <div className="mb-12">
        <h2 className="text-xl text-white mb-4">Test 1: Your Supabase Video (Direct)</h2>
        <video
          controls
          autoPlay
          muted
          playsInline
          style={{ maxWidth: '100%', maxHeight: '400px', backgroundColor: '#000' }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <p className="text-gray-400 mt-2 text-sm break-all">URL: {videoUrl}</p>
      </div>
      
      {/* Test 2: Known working public video */}
      <div className="mb-12">
        <h2 className="text-xl text-white mb-4">Test 2: Big Buck Bunny (Public Test Video)</h2>
        <video
          controls
          autoPlay
          muted
          playsInline
          style={{ maxWidth: '100%', maxHeight: '400px', backgroundColor: '#000' }}
        >
          <source src={testVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <p className="text-gray-400 mt-2 text-sm break-all">URL: {testVideoUrl}</p>
      </div>

      {/* Test 3: iframe embed */}
      <div className="mb-12">
        <h2 className="text-xl text-white mb-4">Test 3: Your Video in iframe</h2>
        <iframe 
          src={videoUrl}
          style={{ width: '100%', height: '400px', border: 'none' }}
          allow="autoplay; fullscreen"
        />
      </div>

      {/* Test 4: Video with crossOrigin */}
      <div className="mb-12">
        <h2 className="text-xl text-white mb-4">Test 4: Your Video with crossOrigin="anonymous"</h2>
        <video
          controls
          autoPlay
          muted
          playsInline
          crossOrigin="anonymous"
          style={{ maxWidth: '100%', maxHeight: '400px', backgroundColor: '#000' }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg text-white mb-2">Debug Info:</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• If Test 1 works but lightbox doesn't → CSS/JS issue in lightbox</li>
          <li>• If Test 2 works but Test 1 doesn't → CORS or codec issue with your video</li>
          <li>• If neither works → Browser or global CSS issue</li>
          <li>• Check Console (F12) for errors</li>
          <li>• Check Network tab for video loading status</li>
        </ul>
      </div>
    </div>
  );
}
