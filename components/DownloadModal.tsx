'use client';

import { useState } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import { SELAgentCard } from '@/types';

interface DownloadModalProps {
  agent: SELAgentCard;
}

export default function DownloadModal({ agent }: DownloadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadGithub = async (formData?: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/agents/${agent['agent id']}/download-github`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          inline-flex items-center gap-2 px-6 py-3 rounded-lg
          bg-blue-600 hover:bg-blue-700 text-white font-bold
          transition-colors duration-200
        "
      >
        <Download className="w-5 h-5" />
        Download
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Download Agent</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm mb-6">
                Download <strong>{agent.name}</strong> agent folder from GitHub:
              </p>

              {/* GitHub Download Option */}
              <button
                onClick={handleDownloadGithub}
                disabled={isLoading}
                className="
                  w-full flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200
                  hover:border-gray-800 hover:bg-gray-50 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <div className="mt-1">
                  <ExternalLink className="w-6 h-6 text-gray-800" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Download Agent Folder</h3>
                  <p className="text-sm text-gray-600">
                    Complete agent folder as ZIP archive
                  </p>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <span className="text-xs text-gray-500">Downloading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">.zip</span>
                  )}
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="
                  flex-1 px-4 py-2 rounded-lg border border-gray-300
                  text-gray-700 font-medium hover:bg-gray-50
                  transition-colors duration-200
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
