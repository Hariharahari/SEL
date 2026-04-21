'use client';

import { useState } from 'react';
import { Download, X, FileJson, Code2 } from 'lucide-react';
import { SELAgentCard } from '@/types';

interface DownloadModalProps {
  agent: SELAgentCard;
}

export default function DownloadModal({ agent }: DownloadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadYAML = async () => {
    try {
      setIsLoading(true);
      
      // Convert agent object to YAML format
      const yamlString = convertToYAML(agent);
      const blob = new Blob([yamlString], { type: 'application/yaml' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent['agent id']}.yaml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download YAML. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAgent = async () => {
    try {
      setIsLoading(true);
      
      // Create a simulated agent package
      const agentContent = generateAgentContent(agent);
      const blob = new Blob([agentContent], { type: 'text/plain' });

      // Determine file extension based on technology
      const pythonKeywords = ['python', 'flask', 'django', 'fastapi', 'celery', 'sqlalchemy'];
      const isPython = agent.technology.some(t => 
        pythonKeywords.some(keyword => t.toLowerCase().includes(keyword))
      );
      const extension = isPython ? 'py' : 'js';

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    keys.forEach((key) => {
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

  const generateAgentContent = (agent: SELAgentCard): string => {
    const pythonKeywords = ['python', 'flask', 'django', 'fastapi', 'celery', 'sqlalchemy'];
    const isPython = agent.technology.some(t => 
      pythonKeywords.some(keyword => t.toLowerCase().includes(keyword))
    );
    
    if (isPython) {
      return `"""
${agent.name}
${agent.description}

Version: ${agent.version}
Status: ${agent.status}
"""

class ${agent.name.replace(/\s+/g, '')}:
    """${agent.name} - Agent Implementation"""
    
    def __init__(self):
        self.name = "${agent.name}"
        self.version = "${agent.version}"
        self.status = "${agent.status}"
        self.technologies = ${JSON.stringify(agent.technology)}
        
    async def execute(self, task_input):
        """Execute the agent task"""
        try:
            # Task execution logic here
            result = {
                "status": "success",
                "output": "Agent executed successfully",
                "agent": self.name,
                "version": self.version
            }
            return result
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "agent": self.name
            }

# Entry point
if __name__ == "__main__":
    agent = ${agent.name.replace(/\s+/g, '')}()
    print(f"Initialized {agent.name} v{agent.version}")
`;
    } else {
      return `/**
 * ${agent.name}
 * ${agent.description}
 * 
 * Version: ${agent.version}
 * Status: ${agent.status}
 */

class ${agent.name.replace(/\s+/g, '')} {
  constructor() {
    this.name = "${agent.name}";
    this.version = "${agent.version}";
    this.status = "${agent.status}";
    this.technologies = ${JSON.stringify(agent.technology)};
  }

  async execute(taskInput) {
    try {
      // Task execution logic here
      const result = {
        status: "success",
        output: "Agent executed successfully",
        agent: this.name,
        version: this.version,
      };
      return result;
    } catch (error) {
      return {
        status: "error",
        message: error.message,
        agent: this.name,
      };
    }
  }
}

// Export for use
module.exports = ${agent.name.replace(/\s+/g, '')};
`;
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
                Choose how you want to download <strong>{agent.name}</strong>:
              </p>

              {/* YAML Option */}
              <button
                onClick={handleDownloadYAML}
                disabled={isLoading}
                className="
                  w-full flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200
                  hover:border-blue-600 hover:bg-blue-50 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <div className="mt-1">
                  <FileJson className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Download YAML</h3>
                  <p className="text-sm text-gray-600">
                    Configuration file with all agent metadata
                  </p>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <span className="text-xs text-gray-500">Loading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">.yaml</span>
                  )}
                </div>
              </button>

              {/* Agent Option */}
              <button
                onClick={handleDownloadAgent}
                disabled={isLoading}
                className="
                  w-full flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200
                  hover:border-green-600 hover:bg-green-50 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <div className="mt-1">
                  <Code2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Download Agent Code</h3>
                  <p className="text-sm text-gray-600">
                    Sample implementation ({agent.technology[0]} based)
                  </p>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <span className="text-xs text-gray-500">Loading...</span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      .{agent.technology.some(t => 
                        ['python', 'flask', 'django', 'fastapi', 'celery', 'sqlalchemy'].some(keyword => 
                          t.toLowerCase().includes(keyword)
                        )
                      ) ? 'py' : 'js'}
                    </span>
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
