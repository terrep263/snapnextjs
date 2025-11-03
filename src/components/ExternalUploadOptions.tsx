'use client';

import { ExternalUploadService } from '@/lib/externalUpload';
import { ExternalLink, Mail, Cloud, Download, X } from 'lucide-react';

interface ExternalUploadOptionsProps {
  file: File;
  eventId: string;
  maxSizeMB: number;
  onClose: () => void;
}

export default function ExternalUploadOptions({ file, eventId, maxSizeMB, onClose }: ExternalUploadOptionsProps) {
  const instructions = ExternalUploadService.generateExternalUploadInstructions(eventId, maxSizeMB);
  const emailLink = ExternalUploadService.createEmailLink(eventId, maxSizeMB);
  const fileSize = ExternalUploadService.getHumanFileSize(file.size);

  const handleEmailClick = () => {
    window.location.href = emailLink;
  };

  const handleServiceClick = (url: string) => {
    if (url === '#compression') {
      // Handle compression option - you could show compression help here
      onClose();
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                File Too Large for Direct Upload
              </h2>
              <p className="text-gray-600">
                "{file.name}" ({fileSize}) exceeds the {maxSizeMB}MB upload limit.
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

        <div className="p-6">
          {/* Email Option */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Your File
              </h3>
              <p className="text-blue-800 mb-3">
                Send us an email and we'll help you upload your large file manually.
              </p>
              <button
                onClick={handleEmailClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Open Email
              </button>
            </div>
          </div>

          {/* Alternative Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Alternative Upload Methods
            </h3>
            
            <div className="grid gap-4">
              {instructions.alternativeServices.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <button
                      onClick={() => handleServiceClick(service.url)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      {service.url === '#compression' ? (
                        <>Guide <Download className="h-3 w-3" /></>
                      ) : (
                        <>Open <ExternalLink className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Steps:</p>
                    <ol className="text-sm text-gray-600 space-y-1">
                      {service.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2">
                          <span className="text-blue-600 font-medium min-w-[1.2rem]">
                            {stepIndex + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 For fastest processing, compression is usually the best option
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}