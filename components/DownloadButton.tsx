'use client';

import { SELAgentCard } from '@/types';
import { Download } from 'lucide-react';
import { useState } from 'react';
import DownloadFormModal, { UserFormData } from './DownloadFormModal';

interface DownloadButtonProps {
  agent: SELAgentCard;
}

export default function DownloadButton({ agent }: DownloadButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (formData: UserFormData) => {
    try {
      setIsLoading(true);

      // 1. Retrieve the JWT from localStorage
      const token = localStorage.getItem('auth_token');

      // 2. Pass the token in the Authorization header
      const response = await fetch(`/api/agents/${agent['agent id']}/download-github`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        alert('Your session has expired. Please login again.');
        return;
      }

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

      setIsFormOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
      >
        <Download className="w-4 h-4" />
        {isLoading ? 'Downloading...' : 'Download Agent'}
      </button>

      <DownloadFormModal
        agent={agent}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleDownload}
      />
    </>
  );
}