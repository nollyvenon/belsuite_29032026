'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, Play, Shield, Users, TrendingUp, Zap, Brain, Phone, MessageSquare, BarChart3, Lock, Headphones, Calendar, Mail, Sparkles, Clock, Workflow, AlertCircle } from 'lucide-react';
import Navbar from './components/navbar';

export default function Home() {
  const [activeTab, setActiveTab] = useState('crm');
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`w-full ${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors duration-300 scroll-smooth`}>
      {/* Navigation */}
      <Navbar isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-black via-black to-orange-900/10' : 'bg-gradient-to-b from-white via-white to-orange-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Badge */}
          <div className={`inline-block mb-8 px-4 py-2 rounded-full border ${isDark ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
            <span className="text-orange-600 dark:text-orange-400 text-sm font-semibold flex items-center gap-2">
              <Zap size={16} /> AI systems for content, CRM, automation, and growth
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            Run Your <span className="text-orange-600">Business Systems</span>
            <br />on Autopilot
          </h1>

          {/* Subheadline */}
          <p className={`text-xl md:text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-3xl mx-auto leading-relaxed`}>
            AI content, CRM + deals, marketing automation, AI calling, and growth autopilot in one platform. <span className="font-bold text-orange-600">One system. Clear outcomes. Less software.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="/billing" className={`${isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg`}>
              Start Free Trial <ArrowRight size={20} />
            </a>
            <a href="/demo" className={`border-2 ${isDark ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' : 'border-orange-300 text-orange-600 hover:bg-orange-50'} px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2`}>
              <Play size={20} /> Watch Demo
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <a href="/content" className={`px-4 py-2 rounded-full border ${isDark ? 'border-orange-700 text-orange-300' : 'border-orange-200 text-orange-600'}`}>
              Content system
            </a>
            <a href="/ai/customer-support" className={`px-4 py-2 rounded-full border ${isDark ? 'border-orange-700 text-orange-300' : 'border-orange-200 text-orange-600'}`}>
              Support agent
            </a>
            <a href="/ai/sales-closer" className={`px-4 py-2 rounded-full border ${isDark ? 'border-orange-700 text-orange-300' : 'border-orange-200 text-orange-600'}`}>
              Sales closer
            </a>
            <a href="/ai/operations-manager" className={`px-4 py-2 rounded-full border ${isDark ? 'border-orange-700 text-orange-300' : 'border-orange-200 text-orange-600'}`}>
              Ops manager
            </a>
            <a href="/ai/influencer" className={`px-4 py-2 rounded-full border ${isDark ? 'border-orange-700 text-orange-300' : 'border-orange-200 text-orange-600'}`}>
              AI influencer
            </a>
          </div>

          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ✓ No credit card • ✓ 14-day free trial • ✓ Built for teams
          </p>

          {/* Social Proof Metrics */}
          <div className={`grid md:grid-cols-3 gap-8 mt-20 p-8 rounded-2xl ${isDark ? 'bg-orange-900/10 border border-orange-700/30' : 'bg-orange-50 border border-orange-200'}`}>
            <div>
              <div className="text-4xl font-black text-orange-600 mb-2">10,000+</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Businesses scaling with AI</p>
            </div>
            <div>
              <div className="text-4xl font-black text-orange-600 mb-2">2M+</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Content pieces generated</p>
            </div>
            <div>
              <div className="text-4xl font-black text-orange-600 mb-2">300%</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Avg. lead & revenue growth</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem → Solution */}
      <section className={`${isDark ? 'bg-black' : 'bg-white'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
                <h2 className={`text-4xl font-black mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
                Stop Managing 10 Different Tools
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Separate apps for content, CRM, campaigns, and calls</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Too many handoffs. Too much switching.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Manual follow-ups and disconnected pipelines</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Leads slip, deals stall, campaigns drift.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Paying for tools that do one job each</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>You buy software, then still need people to connect it.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className={`text-4xl font-black mb-8 text-orange-600`}>
                Belsuite Changes Everything
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <CheckCircle size={20} /> One system. All your growth workflows.
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Content, CRM, deals, automation, and calls work together.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <CheckCircle size={20} /> AI follows up automatically
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>AI handles email, SMS, calls, lead scoring, and routing 24/7.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <CheckCircle size={20} /> Your AI team never sleeps
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Works 24/7 for less than hiring one employee.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Systems */}
      <section id="systems" className={`${isDark ? 'bg-orange-900/10 border-t border-b border-orange-700/30' : 'bg-orange-50 border-t border-b border-orange-200'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">Your Complete AI Business System</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Four systems powering outcomes. Content • CRM + deals • Marketing automation • Autopilot growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* System 1: Content & Video */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Content System</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generate blog posts, scripts, and videos in seconds. Edit with AI. Publish everywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>AI video creation & editing</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Auto captions, effects & transitions</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Multi-format export (Instagram, TikTok, YouTube)</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Content calendar & auto-publishing</span>
                </li>
              </ul>
              <p className="mt-6 font-bold text-orange-600">→ Content output without a content team</p>
            </div>

            {/* System 2: Lead Generation & Sales */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">CRM + Deals System</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Capture leads, score prospects, manage deals, and move opportunities through the pipeline automatically.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Lead capture & enrichment</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Lead scoring & qualification</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Deal pipeline & activity tracking</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Visitor tracking & email identification</span>
                </li>
              </ul>
              <p className="mt-6 font-bold text-orange-600">→ Deals move forward without manual chasing</p>
            </div>

            {/* System 3: Marketing & Automation */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Mail size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Marketing Automation System</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Multi-channel campaigns with intelligent workflows that nurture at scale.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Email, SMS, voice, and AI calling campaigns</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Trigger-based automation workflows</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Conditional logic & smart routing</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Campaign analytics & ROI tracking</span>
                </li>
              </ul>
              <p className="mt-6 font-bold text-orange-600">→ Campaigns run with less manual work</p>
            </div>

            {/* System 4: Business Autopilot */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all md:col-span-2`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Autopilot Growth System</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Your AI team runs follow-up, outreach, optimization, and reporting 24/7.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <Brain size={18} /> AI Assistant
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Strategy, insights, execution</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <Headphones size={18} /> AI Receptionist
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Capture & qualify leads instantly</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <Phone size={18} /> AI Calling
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Follow-ups and bookings via voice</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <TrendingUp size={18} /> Growth Optimizer
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Auto-optimize campaigns and routing</p>
                </div>
              </div>
              <p className="mt-8 text-lg font-bold text-orange-600">
                → Run growth on autopilot
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`${isDark ? 'bg-black' : 'bg-white'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl font-black text-center mb-20">How It Works in 4 Steps</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Create', desc: 'AI generates content and video fast', icon: '✨' },
              { step: 2, title: 'Capture', desc: 'CRM captures and scores leads automatically', icon: '🎯' },
              { step: 3, title: 'Convert', desc: 'Automation handles email, SMS, calls, and follow-ups', icon: '🔄' },
              { step: 4, title: 'Scale', desc: 'Autopilot improves deals, campaigns, and growth', icon: '📈' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto ${isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-100 border border-orange-300'}`}>
                  {item.icon}
                </div>
                <div className={`text-5xl font-black text-orange-600 mb-3`}>{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your AI Team Working 24/7 */}
      <section id="team" className={`${isDark ? 'bg-black' : 'bg-white'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">Your AI Team Working 24/7</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Three specialized AI agents that never sleep, never make mistakes, and always deliver results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* AI Customer Support Agent */}
            <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-blue-900/20 to-black border-blue-700/30 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-900/20'
                : 'bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200/30'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20">
                  <Clock size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-blue-500">24/7 Active</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3">AI Customer Support Agent</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Instantly responds to customer questions on WhatsApp, live chat, and email. Handles FAQs, escalates complex issues, and keeps customers happy around the clock.
              </p>

              <div className={`space-y-3 mb-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">WhatsApp + Website chat support</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Instant response (seconds, not hours)</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Resolves 70% of issues without human help</span>
                </div>
              </div>

              <p className="font-bold text-blue-600">→ Save 20 hours/week on support</p>
            </div>

            {/* AI Sales Closer */}
            <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-green-900/20 to-black border-green-700/30 hover:border-green-600 hover:shadow-lg hover:shadow-green-900/20'
                : 'bg-gradient-to-br from-green-50 to-white border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-200/30'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Users size={32} className="text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-green-500">Always Closing</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3">AI Sales Closer</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Responds to every lead instantly. Qualifies prospects, answers objections, books appointments, and follows up automatically. Your tireless closer that never sleeps.
              </p>

              <div className={`space-y-3 mb-6 p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Qualifies leads in real-time</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Books demos & meetings automatically</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Increases close rate by 40-60%</span>
                </div>
              </div>

              <p className="font-bold text-green-600">→ Never lose a lead again</p>
            </div>

            {/* AI Operations Manager */}
            <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-purple-900/20 to-black border-purple-700/30 hover:border-purple-600 hover:shadow-lg hover:shadow-purple-900/20'
                : 'bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-200/30'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Workflow size={32} className="text-white" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20">
                  <AlertCircle size={14} className="text-purple-500" />
                  <span className="text-xs font-bold text-purple-500">Autopilot On</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3">AI Operations Manager</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Manages workflows, automates internal processes, and executes tasks across your entire system. Connects everything and ensures nothing falls through the cracks.
              </p>

              <div className={`space-y-3 mb-6 p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Automates repetitive tasks</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Syncs data across all tools</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Reduces operational overhead by 75%</span>
                </div>
              </div>

              <p className="font-bold text-purple-600">→ Run your business on autopilot</p>
            </div>
          </div>

          {/* Mini CTA */}
          <div className={`text-center p-8 rounded-2xl border-2 ${
            isDark
              ? 'bg-gradient-to-r from-blue-900/20 via-green-900/20 to-purple-900/20 border-orange-700/50'
              : 'bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-orange-200'
          }`}>
            <p className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Your complete AI team is ready to work for you
            </p>
            <button className={`px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 inline-block ${
              isDark
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}>
              See How It Works →
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${isDark ? 'bg-black' : 'bg-white'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-black text-center mb-20">What Teams Are Saying</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Chen', role: 'Founder', company: '7-Figure Agency', quote: 'Belsuite replaced 6 different tools and reduced my overhead by 60%.' },
              { name: 'Marcus Johnson', role: 'Marketing Director', company: 'Tech Startup', quote: 'We automated 80% of our marketing in one week and tripled our lead quality.' },
              { name: 'Emma Rodriguez', role: 'Sales Leader', company: 'B2B SaaS', quote: 'Our reps now focus on closing. AI handles all the grunt work. Revenue is up 3x.' },
            ].map((testimonial, idx) => (
              <div key={idx} className={`p-8 rounded-2xl border ${isDark ? 'bg-orange-900/10 border-orange-700/30 hover:border-orange-600' : 'bg-orange-50 border-orange-200 hover:border-orange-400'} transition-all`}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-orange-600 text-lg">★</span>
                  ))}
                </div>
                <p className={`mb-6 text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  &quot;{testimonial.quote}&quot;
                </p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${isDark ? 'bg-orange-900/10 border-y border-orange-700/30' : 'bg-orange-50 border-y border-orange-200'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">Simple Pricing for the Full System</h2>
            <p className={`text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Content, CRM, automation, AI calling, and autopilot growth for less than one hire
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$99', users: '1 user', features: ['Content system', 'Basic CRM + deals', 'Email automation', 'AI assistant', 'Up to 500 leads/mo'] },
              { name: 'Professional', price: '$299', users: '5 users', features: ['Everything in Starter', 'Marketing automation', 'AI calling', 'Lead scoring', 'Autopilot workflows', 'Up to 5K leads/mo'], popular: true },
              { name: 'Enterprise', price: 'Custom', users: 'Unlimited', features: ['Everything in Pro', 'Custom systems', 'Advanced routing', 'Dedicated support', 'Custom integrations', 'API access'] },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-8 transition-all ${
                  plan.popular
                    ? isDark
                      ? 'bg-gradient-to-b from-orange-900/50 to-black border-orange-600 ring-2 ring-orange-600 transform scale-105'
                      : 'bg-gradient-to-b from-orange-100 to-white border-orange-500 ring-2 ring-orange-500 transform scale-105'
                    : isDark
                    ? 'bg-black border-orange-700/50 hover:border-orange-600'
                    : 'bg-white border-orange-200 hover:border-orange-400'
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${isDark ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'}`}>
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className={`text-4xl font-black text-orange-600 mb-2`}>{plan.price}</p>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.users}</p>
                <button className={`w-full py-3 rounded-xl font-bold mb-8 transition-all ${
                  plan.popular
                    ? isDark
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                    : isDark
                    ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}>
                  Start Free Trial
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex gap-3">
                      <CheckCircle size={20} className="text-orange-600 flex-shrink-0" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`mt-20 p-8 rounded-2xl text-center ${isDark ? 'bg-black border border-orange-700/30' : 'bg-white border border-orange-200'}`}>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              <span className="font-bold text-lg text-orange-600">Complete Platform Included:</span>
            </p>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              <span className="font-bold">Content System • CRM + Deals • Marketing Automation • AI Calling • Autopilot Growth • AI Assistant • Analytics</span>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${isDark ? 'bg-gradient-to-b from-black via-black to-orange-900/20' : 'bg-gradient-to-b from-white to-orange-50'} py-32`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-6xl font-black mb-6">
            Stop <span className="text-orange-600">Doing Everything Manually</span>
          </h2>
          <p className={`text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-12`}>
            Your AI business team is ready. No credit card. No setup fee. Just results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/billing" className={`${isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-2xl`}>
              Start Free Trial <ArrowRight size={20} />
            </a>
            <a href="/contact" className={`border-2 ${isDark ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' : 'border-orange-300 text-orange-600 hover:bg-orange-50'} px-10 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2`}>
              <Play size={20} /> Contact Us
            </a>
          </div>

          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Join 10,000+ teams already scaling with AI
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-black border-t border-orange-700/30' : 'bg-white border-t border-orange-200'} py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div>
              <p className="font-bold mb-4">Product</p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Features</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Pricing</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Security</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Company</p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>About</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Blog</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Resources</p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Docs</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>API</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Integrations</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Legal</p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Terms</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Privacy</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Cookies</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Connect</p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Twitter</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>LinkedIn</a></li>
                <li><a href="#" className={isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}>Discord</a></li>
              </ul>
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-orange-700/30' : 'border-orange-200'} pt-12 flex flex-col md:flex-row items-center justify-between`}>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2024 Belsuite. All rights reserved. | Your AI Business Operating System
            </p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'}`}>Twitter</a>
              <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'}`}>LinkedIn</a>
              <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'}`}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
