'use client';

import UploadForm from '@/components/UploadForm';
import { Upload, CheckCircle, Shield, Zap, BookOpen, Code2 } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 text-white py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <Upload className="w-12 h-12 text-purple-300" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Share Your
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> AI Agent</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed max-w-2xl mx-auto">
              Contribute to the ecosystem by uploading your custom AI agent. Empower developers worldwide with your innovative solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Share Your Agent?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Instant Impact</h3>
              </div>
              <p className="text-gray-600">Reach thousands of developers who need your solution right away.</p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Enterprise Ready</h3>
              </div>
              <p className="text-gray-600">Your agent gets enterprise validation and rating on our platform.</p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community Trust</h3>
              </div>
              <p className="text-gray-600">Build reputation and establish yourself as thought leader.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Form Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Agent
            </h2>
            <p className="text-gray-600 mb-8">
              Follow the SEL schema specifications to ensure your agent is compatible with our ecosystem.
            </p>
            
            <UploadForm />
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Agent Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Required Fields */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Code2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Required Fields</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'agent id - Unique identifier (e.g., agent.nlp.summarizer)',
                  'name - Human-readable name',
                  'description - What the agent does',
                  'origin - Organization and creator info',
                  'maintainers - Contact information',
                  'version - Agent version (semver)',
                  'status - Alpha, Beta, RC, Stable, Deprecated',
                  'technology - Array of tech stack',
                  'specialization - Primary domain & capabilities',
                  'tasks - Array of supported tasks',
                  'documentation - README, how-to, changelog'
                ].map((field, idx) => (
                  <li key={idx} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best Practices */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Best Practices</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Write descriptive documentation for your agent',
                  'Use clear, meaningful agent IDs with domain prefixes',
                  'Specify all technologies used accurately',
                  'Include comprehensive task descriptions',
                  'Keep the agent ID lowercase with dots as separators',
                  'Provide multiple supported harnesses when possible',
                  'Include example usage in documentation',
                  'Regularly update version numbers',
                  'Mark deprecated agents appropriately',
                  'Test agent metadata before uploading',
                  'Provide valid contact information'
                ].map((practice, idx) => (
                  <li key={idx} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Schema Reference Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">
            Agent Schema Reference
          </h2>
          
          <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap break-words">
{`{
  "agent id": "agent.nlp.summarizer",
  "name": "Text Summarizer Agent",
  "description": "Intelligent text summarization using NLP",
  "origin": {
    "org": "TechCorp",
    "sub_org": "AI Division",
    "creator": "John Doe"
  },
  "maintainers": [
    {
      "name": "Jane Smith",
      "contact": "jane@techcorp.com"
    }
  ],
  "version": "1.0.0",
  "status": "stable",
  "technology": ["Python", "TensorFlow", "FastAPI"],
  "specialization": {
    "primary": "Natural Language Processing",
    "domain specific": ["Text Analysis", "Summarization"]
  },
  "tasks": [
    {
      "name": "Summarize Text",
      "description": "Generate a concise summary",
      "async": true
    }
  ],
  "documentation": {
    "readme": "Complete documentation...",
    "howto": "Usage instructions...",
    "changelog": "Version history..."
  },
  "supported harness": ["Claude", "OpenAI", "LangChain"],
  "rating": {
    "Jast score": 4.5,
    "grade": "A+"
  },
  "stars": 42
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Share Your Innovation?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Your agent could be the solution thousands of developers are looking for.
          </p>
          <a
            href="#upload"
            className="
              inline-flex items-center gap-2 px-8 py-4 rounded-lg
              bg-white text-purple-600 font-bold text-lg
              hover:bg-gray-100 transition-all duration-200
            "
          >
            <Upload className="w-5 h-5" />
            Start Uploading Now
          </a>
        </div>
      </section>
    </div>
  );
}
