import { getAllAgents } from '@/lib/agentStore';
import AgentCard from '@/components/AgentCard';
import { SELAgentCard } from '@/types';
import Link from 'next/link';
import { ArrowRight, Zap, Brain, Code2, Share2, Shield, Gauge, Users, BookOpen, Sparkles } from 'lucide-react';

async function getFeaturedAgents(): Promise<SELAgentCard[]> {
  try {
    const agents = await getAllAgents();
    return agents.slice(0, 6);
  } catch (err) {
    console.error('Error loading featured agents:', err);
    return [];
  }
}

export default async function HomePage() {
  const featuredAgents = await getFeaturedAgents();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 text-white py-32 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Enterprise AI Agent
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Skills Directory</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
              Discover, deploy, and manage powerful AI agents at enterprise scale. Build intelligent automation systems with our comprehensive ecosystem of specialized AI agents and advanced skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/agents"
                className="
                  inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg
                  bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                  text-white font-bold text-lg
                  transition-all duration-200 shadow-lg hover:shadow-xl
                "
              >
                Explore 2000+ Agents
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/upload"
                className="
                  inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg
                  bg-white/10 hover:bg-white/20 text-white font-bold text-lg
                  border border-white/30 
                  transition-all duration-200
                "
              >
                Create Your Agent
                <Sparkles className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What are AI Agents Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What are AI Agents?
              </h2>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                AI agents are intelligent software systems that can perceive their environment, make decisions, and take actions to achieve specific goals. They represent a paradigm shift in automation, moving from rigid rule-based systems to adaptive, learning-capable entities.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Brain className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Intelligent Reasoning</h3>
                    <p className="text-gray-600">Agents understand context and make informed decisions based on complex requirements and constraints.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Autonomous Execution</h3>
                    <p className="text-gray-600">Execute complex tasks independently with minimal human intervention required.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Code2 className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Code Generation</h3>
                    <p className="text-gray-600">Automatically generate, refactor, test, and optimize code at enterprise quality standards.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Agent Capabilities</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Code Generation', icon: '⚡' },
                  { label: 'Refactoring & Optimization', icon: '🔧' },
                  { label: 'Test Generation', icon: '✓' },
                  { label: 'Security Analysis', icon: '🔒' },
                  { label: 'Documentation', icon: '📚' },
                  { label: 'Performance Monitoring', icon: '📊' },
                  { label: 'Architecture Extraction', icon: '🏗️' },
                  { label: 'CI/CD Automation', icon: '🚀' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What are Agent Skills Section */}
      <section className="py-20 px-4 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Agent Skills Examples</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Code Analysis', icon: '🔍' },
                  { label: 'Testing & Debugging', icon: '🧪' },
                  { label: 'Documentation', icon: '📖' },
                  { label: 'Performance Profiling', icon: '⚡' },
                  { label: 'Security Scanning', icon: '🔐' },
                  { label: 'Data Processing', icon: '📊' },
                  { label: 'API Integration', icon: '🔌' },
                  { label: 'Deployment Management', icon: '🚀' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What are Agent Skills?
              </h2>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Agent Skills are specialized capabilities that enhance and extend the functionality of AI agents. They represent domain-specific expertise that agents can leverage to perform tasks more effectively and efficiently.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Specialized Expertise</h3>
                    <p className="text-gray-600">Skills provide agents with deep knowledge in specific domains like security, performance, testing, and deployment.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Share2 className="w-6 h-6 text-purple-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Reusable Components</h3>
                    <p className="text-gray-600">Skills can be shared across multiple agents, enabling consistent approaches across your enterprise.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Gauge className="w-6 h-6 text-purple-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Enhanced Performance</h3>
                    <p className="text-gray-600">Agents with skills execute faster and produce higher quality results by leveraging proven methodologies.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Code2 className="w-6 h-6 text-purple-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Easy Integration</h3>
                    <p className="text-gray-600">Attach skills to agents without modifying core code. Skills integrate seamlessly into agent workflows.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Skills & Agents Work Together */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            How Agent Skills Work Together
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Agent skills enhance AI agents by providing specialized capabilities that can be combined for powerful automation.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Agent Framework',
                icon: '🤖',
                description: 'The core AI agent that handles primary tasks like code generation, review, and decision-making.'
              },
              {
                title: 'Skill Modules',
                icon: '🔧',
                description: 'Independent skill modules that provide specialized expertise in specific domains like testing or security.'
              },
              {
                title: 'Composition',
                icon: '🧩',
                description: 'Skills are attached to agents to create custom AI assistants tailored to your workflow needs.'
              },
              {
                title: 'Execution Layer',
                icon: '⚙️',
                description: 'The runtime that orchestrates agent + skills to deliver enhanced results with deeper expertise.'
              },
              {
                title: 'Quality Gates',
                icon: '✅',
                description: 'Skills include validation, testing, and quality checks to ensure enterprise-grade output.'
              },
              {
                title: 'Continuous Learning',
                icon: '📈',
                description: 'Skills improve over time as they learn from execution patterns and user feedback.'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use AI Agents */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            How to Use AI Agents & Skills Effectively
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Learn how to leverage AI agents throughout your development lifecycle for maximum productivity and quality.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Agent',
                description: 'Select an appropriate AI agent from our directory based on your primary task needs.',
                details: ['Browse agent categories', 'Compare agent capabilities', 'Read reviews']
              },
              {
                step: '02',
                title: 'Attach Relevant Skills',
                description: 'Enhance your agent by attaching specialized skills that complement its core capabilities.',
                details: ['Select needed skills', 'Configure skill parameters', 'Enable integrations']
              },
              {
                step: '03',
                title: 'Define Requirements',
                description: 'Clearly specify what you want the agent + skills to accomplish with detailed requirements.',
                details: ['Write specifications', 'Define quality gates', 'Set success criteria']
              },
              {
                step: '04',
                title: 'Execute & Monitor',
                description: 'Run your configured agent with skills and monitor performance in real-time.',
                details: ['Execute tasks', 'Monitor progress', 'Track skill usage']
              },
              {
                step: '05',
                title: 'Review & Refine',
                description: 'Examine results and adjust skill configuration for continuous improvement.',
                details: ['Validate output', 'Provide feedback', 'Adjust parameters']
              },
              {
                step: '06',
                title: 'Scale Capabilities',
                description: 'As you gain confidence, add more agents and skills to automate complex multi-step workflows.',
                details: ['Expand automation', 'Build pipelines', 'Full automation']
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-blue-600 mb-3">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-700 mb-4">{item.description}</p>
                <ul className="space-y-2">
                  {item.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Why Choose Our AI Agent Ecosystem?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Execute complex tasks in seconds, not hours' },
              { icon: Brain, title: 'Intelligent Automation', desc: 'Learn and improve with every execution' },
              { icon: Shield, title: 'Enterprise Grade', desc: 'Built for reliability and security' },
              { icon: Users, title: 'Community Driven', desc: '2000+ ready-to-use agents' },
              { icon: Gauge, title: 'High Quality Output', desc: 'Consistent, professional-grade results' },
              { icon: Share2, title: 'Easy Integration', desc: 'Works seamlessly with your workflow' },
              { icon: BookOpen, title: 'Well Documented', desc: 'Comprehensive guides and examples' },
              { icon: Code2, title: 'Customizable', desc: 'Create and share your own agents' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <Icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured AI Agents</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our most popular and highly-rated AI agents. Each agent specializes in different aspects of the development lifecycle.
          </p>
        </div>

        {featuredAgents.length === 0 ? (
          <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-lg text-center text-blue-700">
            <p className="text-lg font-semibold">No agents available yet.</p>
            <p className="text-blue-600 mt-2">Start by uploading your first agent to the directory.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredAgents.map((agent) => (
                <AgentCard key={agent['agent id']} agent={agent} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/agents"
                className="
                  inline-flex items-center gap-2 px-8 py-4
                  bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                  text-white font-bold rounded-lg
                  transition-all duration-200 shadow-lg hover:shadow-xl
                "
              >
                Explore All {featuredAgents.length > 0 ? '2000+' : ''} Agents
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Getting Started Section */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Accelerate Development?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start using AI agents today. Upload your first agent or explore the directory to find specialized agents for your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/agents"
              className="
                inline-flex items-center justify-center gap-2 px-8 py-4
                bg-white text-gray-900 font-bold rounded-lg
                hover:bg-gray-100 transition-colors duration-200
              "
            >
              Browse Agents
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/upload"
              className="
                inline-flex items-center justify-center gap-2 px-8 py-4
                bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg
                transition-colors duration-200
              "
            >
              Create Agent
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {featuredAgents.length}+
              </div>
              <p className="text-gray-600">Agents in Directory</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
              <p className="text-gray-600">Enterprise Ready</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <p className="text-gray-600">Availability</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

