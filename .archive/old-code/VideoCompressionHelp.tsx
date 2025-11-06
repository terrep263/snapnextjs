'use client';

import { useState } from 'react';
import { VideoCompressor } from '@/lib/videoCompressor';
import { SmartphoneVideoOptimizer } from '@/lib/smartphoneVideoOptimizer';
import { AlertCircle, ExternalLink, Minimize2, Scissors, Settings, Download, Smartphone } from 'lucide-react';

interface VideoCompressionHelpProps {
  file: File;
  onClose: () => void;
}

export default function VideoCompressionHelp({ file, onClose }: VideoCompressionHelpProps) {
  const [activeTab, setActiveTab] = useState<'smartphone' | 'recommendations' | 'tools' | 'online'>('smartphone');
  
  const recommendations = VideoCompressor.getVideoCompressionRecommendations(file);
  const smartphoneAnalysis = SmartphoneVideoOptimizer.isLikelySmartphoneVideo(file);
  const smartphoneOpts = SmartphoneVideoOptimizer.getSmartphoneOptimizations(file);

  const compressionTools = [
    {
      name: 'HandBrake',
      description: 'Free, open-source video compressor',
      url: 'https://handbrake.fr/',
      platform: 'Windows, Mac, Linux',
      difficulty: 'Easy',
      presets: 'Many built-in presets for different devices'
    },
    {
      name: 'VLC Media Player',
      description: 'Free media player with conversion features',
      url: 'https://www.videolan.org/vlc/',
      platform: 'Windows, Mac, Linux',
      difficulty: 'Medium',
      presets: 'Basic conversion profiles available'
    },
    {
      name: 'FFmpeg',
      description: 'Powerful command-line video processing',
      url: 'https://ffmpeg.org/',
      platform: 'All platforms',
      difficulty: 'Advanced',
      presets: 'Complete control over compression settings'
    }
  ];

  const onlineTools = [
    {
      name: 'CloudConvert',
      url: 'https://cloudconvert.com/video-compressor',
      description: 'Online video compressor with quality presets',
      freeLimit: 'Up to 1GB per day'
    },
    {
      name: 'Clideo',
      url: 'https://clideo.com/compress-video',
      description: 'Simple drag & drop video compression',
      freeLimit: 'Files up to 500MB'
    },
    {
      name: 'VideoSmaller',
      url: 'https://www.videosmaller.com/',
      description: 'Free video compression with no signup',
      freeLimit: 'Files up to 500MB'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Video Compression Guide
              </h2>
              <p className="text-gray-600">
                Your video "{file.name}" is {recommendations.currentSizeMB}MB. 
                Here's how to reduce its size:
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'smartphone', label: '📱 Phone Tips', icon: Smartphone },
              { id: 'recommendations', label: 'Methods', icon: Settings },
              { id: 'tools', label: 'Software', icon: Download },
              { id: 'online', label: 'Online Tools', icon: ExternalLink }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'smartphone' && (
            <div className="space-y-6">
              {/* 1080p Limit Warning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  📺 Resolution Limit: 1080p Maximum
                </h3>
                <p className="text-blue-800 text-sm mb-2">
                  This platform supports videos up to 1080p Full HD resolution only. 
                  4K videos must be reduced before upload.
                </p>
                <div className="text-xs text-blue-700">
                  Target: 30-60MB for 3-minute 1080p videos
                </div>
              </div>

              {smartphoneAnalysis.isLikely && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Smartphone Video Detected!
                  </h3>
                  <div className="text-sm text-green-800 space-y-1">
                    {smartphoneAnalysis.indicators.map((indicator, i) => (
                      <div key={i}>• {indicator}</div>
                    ))}
                  </div>
                  {smartphoneAnalysis.estimatedSpecs.estimatedDuration && (
                    <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                      <strong>Estimated Duration:</strong> ~{smartphoneAnalysis.estimatedSpecs.estimatedDuration} minutes
                      <br />
                      <strong>Resolution:</strong> {smartphoneAnalysis.estimatedSpecs.possibleResolution}
                      {smartphoneAnalysis.estimatedSpecs.compressionSuggestion && (
                        <>
                          <br />
                          <strong>Suggestion:</strong> {smartphoneAnalysis.estimatedSpecs.compressionSuggestion}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Phone-Friendly Solutions</h3>
                <div className="grid gap-4">
                  {smartphoneOpts.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                          <Smartphone className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.action}</h4>
                          <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Result:</span> <strong>{rec.expectedResult}</strong>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              rec.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                              rec.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {rec.difficulty}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🎯 Quick Phone Tips (1080p Max)</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>📱 Record in 1080p MAXIMUM (Full HD limit)</li>
                  <li>⏱️ Keep videos under 3 minutes for quick sharing</li>
                  <li>📶 Use Wi-Fi when uploading large videos</li>
                  <li>🔋 Ensure phone is charged or plugged in during upload</li>
                  <li>🚫 4K not supported - always reduce to 1080p or lower</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ 1080p Maximum Resolution Enforced</h3>
                <p className="text-red-800 text-sm mb-3">
                  This platform only accepts videos up to 1080p Full HD. Higher resolution videos will be rejected.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-700">Current Size:</span> {recommendations.currentSizeMB}MB
                  </div>
                  <div>
                    <span className="text-red-700">Target Size:</span> ≤60MB (1080p, 3min)
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        {rec.method.includes('Resolution') && <Minimize2 className="h-4 w-4 text-green-600" />}
                        {rec.method.includes('Bitrate') && <Settings className="h-4 w-4 text-green-600" />}
                        {rec.method.includes('Length') && <Scissors className="h-4 w-4 text-green-600" />}
                        {rec.method.includes('Format') && <AlertCircle className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{rec.method}</h4>
                        <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Expected size:</span> <strong>{rec.expectedSizeMB}MB</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Tools:</span> {rec.tools.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              {compressionTools.map((tool, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Download <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-gray-600 mb-3">{tool.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Platform:</span>
                      <div className="font-medium">{tool.platform}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Difficulty:</span>
                      <div className={`font-medium ${
                        tool.difficulty === 'Easy' ? 'text-green-600' : 
                        tool.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{tool.difficulty}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Features:</span>
                      <div className="font-medium">{tool.presets}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Privacy Notice</h3>
                </div>
                <p className="text-amber-800 text-sm">
                  Online tools require uploading your video to external servers. 
                  Consider privacy implications for sensitive content.
                </p>
              </div>

              {onlineTools.map((tool, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-gray-600 mb-2">{tool.description}</p>
                  <div className="text-sm">
                    <span className="text-gray-500">Free limit:</span>
                    <span className="font-medium ml-1">{tool.freeLimit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 For best results, aim for 50MB or less for quick upload
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}