'use client';

import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';

export default function UploadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setStatus('error');
      setMessage('Please select a valid JSON file.');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('idle');

      // Read file as text
      const fileContent = await file.text();

      // Parse and validate JSON structure
      let agentData;
      try {
        agentData = JSON.parse(fileContent);
      } catch {
        setStatus('error');
        setMessage('Invalid JSON format. Please check the file.');
        setIsLoading(false);
        return;
      }

      // Validate required fields
      if (!agentData['agent id'] || !agentData.name) {
        setStatus('error');
        setMessage('Agent must have "agent id" and "name" fields.');
        setIsLoading(false);
        return;
      }

      // Send to API
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setStatus('success');
      setMessage(`Agent "${agentData.name}" uploaded successfully!`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="
          border-2 border-dashed border-gray-300 rounded-lg p-8
          bg-gray-50 hover:bg-gray-100 transition-colors duration-200
          cursor-pointer
        "
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-blue-600" />
          <p className="text-center text-gray-700 font-medium">
            Click to upload a JSON file
          </p>
          <p className="text-center text-gray-500 text-sm">
            or drag and drop your agent card
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={isLoading}
          className="hidden"
        />
      </div>

      {message && (
        <div
          className={`
            mt-4 p-4 rounded-lg flex items-start gap-2
            ${
              status === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }
          `}
        >
          {status === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{message}</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
