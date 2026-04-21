'use client';

import { SELAgentCard } from '@/types';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface DownloadButtonProps {
  agent: SELAgentCard;
}

export default function DownloadButton({ agent }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    try {
      setIsLoading(true);

      // Convert agent object to YAML format
      const yamlString = convertToYAML(agent);
      const blob = new Blob([yamlString], { type: 'application/yaml' });

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent['agent id']}.yaml`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple YAML converter
  const convertToYAML = (obj: any, indent = 0): string => {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return `"${obj}"`;
      }
      return String(obj);
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        yaml += `${spaces}- ${convertToYAML(item, 0).trim()}\n`;
      });
      return yaml;
    }

    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += convertToYAML(value, indent + 2);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}  - `;
            yaml += convertToYAML(item, indent + 4).trim() + '\n';
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        const stringValue = convertToYAML(value, 0);
        yaml += `${spaces}${key}: ${stringValue}\n`;
      }
    });

    return yaml;
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="
        inline-flex items-center gap-2 px-4 py-2
        bg-blue-600 hover:bg-blue-700
        text-white font-medium rounded-lg
        transition-colors duration-200
        disabled:bg-gray-400 disabled:cursor-not-allowed
      "
    >
      <Download className="w-4 h-4" />
      {isLoading ? 'Downloading...' : 'Download YAML'}
    </button>
  );
}
