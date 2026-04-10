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
              <Zap size={16} /> AI-Powered Business Operating System
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            Run Your <span className="text-orange-600">Entire Business</span>
            <br />on Autopilot
          </h1>

          {/* Subheadline */}
          <p className={`text-xl md:text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-3xl mx-auto leading-relaxed`}>
            Create videos, generate leads, manage deals, automate campaigns, and close customers — all from one AI platform. <span className="font-bold text-orange-600">One dashboard. All your business systems. Zero headcount.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className={`${isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg`}>
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button className={`border-2 ${isDark ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' : 'border-orange-300 text-orange-600 hover:bg-orange-50'} px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2`}>
              <Play size={20} /> Watch Demo
            </button>
          </div>

          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ✓ No credit card • ✓ 14-day free trial • ✓ Setup in 2 minutes
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
                Stop Using 10 Different Tools
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Content tool, CRM tool, email tool, SMS tool...</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Too many subscriptions. Too much switching.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Manual follow-ups and lost leads</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No automation. Missed opportunities.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>❌ Hiring expensive team members</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>High salaries. Training. Turnover.</p>
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
                    <CheckCircle size={20} /> One platform. Everything inside.
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Content, CRM, marketing, calls, all connected.</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <CheckCircle size={20} /> AI follows up automatically
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>AI handles email, SMS, calls, lead scoring 24/7.</p>
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
              Four integrated engines powering your entire business. Content • Growth • Sales • Automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* System 1: Content & Video */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Content & Video Engine</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generate blog posts, scripts, and professional videos in seconds. Edit with AI. Publish everywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>AI video creation & editing (CapCut-level)</span>
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
              <p className="mt-6 font-bold text-orange-600">→ Professional content without the team</p>
            </div>

            {/* System 2: Lead Generation & Sales */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Lead Generation & Sales Engine</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generate leads, enrich data, score prospects, manage deals, and close customers. Your growth engine working 24/7.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Lead generation & web scraping</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Lead enrichment & verification (0-100 scoring)</span>
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
              <p className="mt-6 font-bold text-orange-600">→ Never miss a sales opportunity</p>
            </div>

            {/* System 3: Marketing & Automation */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Mail size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Marketing Automation Engine</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Multi-channel campaigns (email, SMS, voice, AI calls) with intelligent workflows that nurture at scale.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                  <span>Email, SMS, voice & AI calling campaigns</span>
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
              <p className="mt-6 font-bold text-orange-600">→ Your campaigns run themselves</p>
            </div>

            {/* System 4: Business Autopilot */}
            <div className={`p-8 rounded-2xl border-2 ${isDark ? 'bg-black border-orange-700/50 hover:border-orange-600' : 'bg-white border-orange-200 hover:border-orange-400'} transition-all md:col-span-2`}>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">🤖 AI Business Autopilot (The Game Changer)</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Your AI team runs your business 24/7. Generate leads, follow up automatically, close deals, and optimize growth — all without you lifting a finger.
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
                    <Phone size={18} /> AI Caller
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Follow-ups & bookings via voice</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <TrendingUp size={18} /> AI Optimizer
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Auto-optimize all campaigns</p>
                </div>
              </div>
              <p className="mt-8 text-lg font-bold text-orange-600">
                → Your business grows 24/7 while you sleep
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
              { step: 1, title: 'Create', desc: 'AI generates videos, blogs, ads, and campaigns in seconds', icon: '✨' },
              { step: 2, title: 'Generate', desc: 'AI captures leads, enriches data, scores prospects 24/7', icon: '🎯' },
              { step: 3, title: 'Convert', desc: 'AI automates email, SMS, calls, and follow-ups', icon: '🔄' },
              { step: 4, title: 'Scale', desc: 'AI optimizes deals, campaigns, and growth metrics', icon: '📈' },
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

      {/* Live Demo Section */}
      <section id="demo" className={`${isDark ? 'bg-orange-900/10 border-y border-orange-700/30' : 'bg-orange-50 border-y border-orange-200'} py-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">See Belsuite in Action</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Watch your AI team work in real-time
            </p>
          </div>

          {/* Demo Tabs */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            {['crm', 'video', 'campaigns', 'calls', 'assistant'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab
                    ? isDark
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-500 text-white'
                    : isDark
                    ? 'bg-orange-900/20 text-gray-300 hover:bg-orange-900/30'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab === 'crm' && '💼 CRM Dashboard'}
                {tab === 'video' && '🎬 Video Editor'}
                {tab === 'campaigns' && '📧 Campaigns'}
                {tab === 'calls' && '📞 AI Calling'}
                {tab === 'assistant' && '🤖 AI Assistant'}
              </button>
            ))}
          </div>

          {/* Demo Content */}
          <div className={`rounded-2xl border-2 p-8 ${isDark ? 'bg-black border-orange-700/50' : 'bg-white border-orange-200'} overflow-hidden`}>
            {activeTab === 'video' && (
              <div>
                <h3 className="font-bold mb-4 text-lg">AI Video Editor</h3>
                <div className={`mb-6 rounded-lg overflow-hidden ${isDark ? 'bg-black border border-orange-700/50' : 'bg-gray-100 border border-orange-200'}`}>
                  <div className={`w-full h-64 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`}>
                    <div className="text-center">
                      <div className="text-5xl mb-3">▶️</div>
                      <p className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timeline Editor Preview</p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Drag • Drop • Auto-Caption • Effects</p>
                    </div>
                  </div>
                </div>
                <div className={`grid md:grid-cols-2 gap-6 ${isDark ? 'text-gray-300' : ''}`}>
                  <div>
                    <p className="font-bold mb-3">Features</p>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Drag & drop timeline editing</li>
                      <li>✓ Auto-generated captions (speech-to-text)</li>
                      <li>✓ Scene detection & highlights</li>
                      <li>✓ Background removal (1 click)</li>
                      <li>✓ Silence auto-removal</li>
                      <li>✓ Transitions & effects library</li>
                      <li>✓ Multi-format export</li>
                    </ul>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <p className="font-bold mb-3">Recent Project</p>
                    <div className="space-y-2 text-sm">
                      <div>📹 <strong>Product Demo Video</strong></div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Duration: 2:35 • Format: 9:16 (Reels)</div>
                      <div className="mt-3 w-full h-2 rounded-full bg-orange-600"></div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rendering: 87% complete</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div>
                <h3 className="font-bold mb-4 text-lg">CRM Dashboard</h3>
                <div className={`grid md:grid-cols-3 gap-4 mb-6 ${isDark ? 'text-gray-300' : ''}`}>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Leads</p>
                    <p className="text-3xl font-bold text-orange-600">1,247</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>↑ 34% this month</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Conversion Rate</p>
                    <p className="text-3xl font-bold text-orange-600">12.4%</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>↑ 3x better than average</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Deals</p>
                    <p className="text-3xl font-bold text-orange-600">47</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>→ $187K pipeline</p>
                  </div>
                </div>
                <table className={`w-full text-sm ${isDark ? 'text-gray-300' : ''}`}>
                  <thead className={`${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <tr>
                      <th className="p-3 text-left">Lead Name</th>
                      <th className="p-3 text-left">Stage</th>
                      <th className="p-3 text-left">AI Score</th>
                      <th className="p-3 text-left">Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`border-b ${isDark ? 'border-orange-700/30' : 'border-orange-100'}`}>
                      <td className="p-3">Sarah Chen (Hot)</td>
                      <td className="p-3"><span className="px-2 py-1 bg-green-900/50 text-green-300 rounded">Qualified</span></td>
                      <td className="p-3"><span className="font-bold text-orange-600">94/100</span></td>
                      <td className="p-3"><span className="text-xs px-2 py-1 bg-orange-900/50 text-orange-300 rounded">Demo Call 2pm</span></td>
                    </tr>
                    <tr className={`border-b ${isDark ? 'border-orange-700/30' : 'border-orange-100'}`}>
                      <td className="p-3">Marcus Johnson</td>
                      <td className="p-3"><span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded">Nurturing</span></td>
                      <td className="p-3"><span className="font-bold text-orange-600">72/100</span></td>
                      <td className="p-3"><span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-300 rounded">Email Sequence</span></td>
                    </tr>
                    <tr>
                      <td className="p-3">Emma Rodriguez</td>
                      <td className="p-3"><span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">Contacted</span></td>
                      <td className="p-3"><span className="font-bold text-orange-600">58/100</span></td>
                      <td className="p-3"><span className="text-xs px-2 py-1 bg-orange-900/50 text-orange-300 rounded">AI Follow-up Call</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div>
                <h3 className="font-bold mb-4 text-lg">Campaign Performance</h3>
                <div className={`grid md:grid-cols-2 gap-6 ${isDark ? 'text-gray-300' : ''}`}>
                  <div>
                    <p className="font-bold mb-4">Email Campaign: "Summer Sale 2024"</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Sent</span>
                          <span>12,450</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}></div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Opened</span>
                          <span className="text-orange-600 font-bold">42.3%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`} style={{width: '42.3%'}}></div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Clicked</span>
                          <span className="text-orange-600 font-bold">18.7%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`} style={{width: '18.7%'}}></div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Converted</span>
                          <span className="text-orange-600 font-bold">8.2%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`} style={{width: '8.2%'}}></div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <p className="font-bold mb-3">AI Insights</p>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Subject line "URGENT" = 34% higher open rate</li>
                      <li>✓ Best send time: Tuesday 10am</li>
                      <li>✓ Recommend A/B test: 40-char subject lines</li>
                      <li>✓ Increase send volume to segment D</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div>
                <h3 className="font-bold mb-4 text-lg">AI Calling Activity</h3>
                <div className={`space-y-4 ${isDark ? 'text-gray-300' : ''}`}>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} border ${isDark ? 'border-orange-700/30' : 'border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Sarah Chen</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Demo Followup Call</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>2 hours ago • 12 min call</p>
                      </div>
                      <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded text-sm">✓ Booked Demo</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} border ${isDark ? 'border-orange-700/30' : 'border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Marcus Johnson</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objection Handling</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>4 hours ago • 8 min call</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded text-sm">Pending</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} border ${isDark ? 'border-orange-700/30' : 'border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Emma Rodriguez</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>First Contact</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>6 hours ago • 14 min call</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">→ Nurture</span>
                    </div>
                  </div>
                </div>
                <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border ${isDark ? 'border-green-700/30' : 'border-green-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <span className="font-bold">This Month:</span> 127 calls • 43% booked • $12,400 pipeline
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'assistant' && (
              <div>
                <h3 className="font-bold mb-4 text-lg">AI Assistant Chat</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} max-w-xs`}>
                    <p className="text-sm">What's our top performing campaign this week?</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-100 border border-orange-300'} max-w-md ml-auto`}>
                    <p className="text-sm font-semibold">Your "Summer Sale" email campaign is crushing it:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>📧 42.3% open rate (industry avg: 21%)</li>
                      <li>🎯 8.2% conversion rate (industry avg: 2%)</li>
                      <li>💰 Generated $4,200 revenue</li>
                      <li>💡 Recommend scaling budget by 40%</li>
                    </ul>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} max-w-xs`}>
                    <p className="text-sm">Which leads should I focus on today?</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-100 border border-orange-300'} max-w-md ml-auto`}>
                    <p className="text-sm font-semibold">Top 3 leads to contact today:</p>
                    <ol className="text-sm mt-2 space-y-2">
                      <li><strong>1. Sarah Chen</strong> - AI score 94/100 - Schedule 2pm demo</li>
                      <li><strong>2. Marcus Johnson</strong> - AI score 72/100 - Send social proof case study</li>
                      <li><strong>3. Emma Rodriguez</strong> - AI score 58/100 - AI call at 4pm</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
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
                  "{testimonial.quote}"
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
            <h2 className="text-5xl font-black mb-4">Your Entire AI Team</h2>
            <p className={`text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Less than hiring <span className="text-orange-600 font-bold">one employee</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$99', users: '1 user', features: ['AI Video Editor', 'Content Generator', 'Basic CRM (50 contacts)', 'Email campaigns', 'Up to 500 leads/mo'] },
              { name: 'Professional', price: '$299', users: '5 users', features: ['All Starter +', 'AI Calling (100 calls/mo)', 'SMS campaigns', 'Lead enrichment', 'AI Workflows', 'Up to 5K leads/mo', 'AI Receptionist'], popular: true },
              { name: 'Enterprise', price: 'Custom', users: 'Unlimited', features: ['Everything +', 'Unlimited calls & leads', 'Priority support', 'Custom workflows', 'Dedicated account manager', 'API access'] },
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
              <span className="font-bold">Content & Video • AI Video Editor • Lead Generation • CRM & Deals • Email • SMS • AI Calling • Marketing Automation • Workflows • AI Assistant • Analytics</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`${isDark ? 'bg-black' : 'bg-white'} py-24`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-center mb-16">Common Questions</h2>

          <div className="space-y-6">
            {[
              { q: 'How long does setup take?', a: 'Under 2 minutes. Connect your email, add your first lead, and AI takes it from there.' },
              { q: 'Can I integrate with my existing tools?', a: 'Yes. We integrate with Stripe, Zapier, Slack, and 500+ tools. Full API available.' },
              { q: 'Do you offer a money-back guarantee?', a: '100%. Try free for 14 days. If not satisfied, full refund. No questions.' },
              { q: 'What if I need custom features?', a: 'Enterprise plan includes custom integrations and dedicated support.' },
              { q: 'Is my data secure?', a: 'Bank-level security. GDPR compliant. Daily backups. SOC 2 certified.' },
            ].map((item, idx) => (
              <div key={idx} className={`p-6 rounded-xl border ${isDark ? 'bg-orange-900/10 border-orange-700/30 hover:border-orange-600' : 'bg-orange-50 border-orange-200 hover:border-orange-400'} transition-all`}>
                <p className="font-bold text-lg mb-2">{item.q}</p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.a}</p>
              </div>
            ))}
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
            <button className={`${isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-2xl`}>
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button className={`border-2 ${isDark ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' : 'border-orange-300 text-orange-600 hover:bg-orange-50'} px-10 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2`}>
              <Play size={20} /> Watch 2-Min Demo
            </button>
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
