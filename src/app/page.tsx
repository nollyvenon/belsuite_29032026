'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Play, Shield, Users, TrendingUp, Zap, Brain, Phone, MessageSquare, BarChart3, Lock, Headphones, Calendar, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">BelSuite</div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Product</a>
            <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Pricing</a>
            <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Integrations</a>
          </div>
          <div className="flex gap-4">
            <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium">
              Sign In
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
          <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">✨ Powered by AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
          Run Your Entire Content, Marketing & Sales Engine with AI
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
          Create content, capture leads, run campaigns, and close deals — all from one AI-powered platform designed to grow your business on autopilot.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            Start Free Trial <ArrowRight size={20} />
          </button>
          <button className="border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            <Play size={20} /> Watch Live Demo
          </button>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-12">
          No credit card required • Setup in under 2 minutes
        </p>

        {/* Social Proof */}
        <div className="grid md:grid-cols-3 gap-8 border-t border-b border-slate-200 dark:border-slate-800 py-12">
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">10,000+</div>
            <p className="text-slate-600 dark:text-slate-400">Users scaling with AI</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">2M+</div>
            <p className="text-slate-600 dark:text-slate-400">Content pieces generated</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">300%</div>
            <p className="text-slate-600 dark:text-slate-400">Average lead increase</p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">"Belsuite replaced 5 tools for us overnight."</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sarah Chen, Founder</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">"We automated 80% of our marketing in one week."</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Marcus Johnson, Marketing Director</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">"Our leads literally doubled without extra effort."</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Emma Rodriguez, Sales Manager</p>
          </div>
        </div>
      </section>

      {/* Core Value Section */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              One Platform. Total Business Control.
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Stop juggling tools. Belsuite combines everything you need to grow — powered by AI.
            </p>
          </div>

          <div id="features" className="grid md:grid-cols-2 gap-12">
            {/* Feature 1: Content */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                AI Content & Media Engine
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Create everything in seconds.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Blog posts, ads, captions, and scripts
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> AI video editing and auto-formatting
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> UGC-style content generation
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Multi-language content
                </li>
              </ul>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">✓ Never run out of content again.</p>
            </div>

            {/* Feature 2: CRM */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                AI Sales & CRM Engine
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Turn leads into paying customers automatically.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Lead capture & tracking
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Smart deal pipelines (Kanban)
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> AI lead scoring
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Contact & activity management
                </li>
              </ul>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">✓ Know who to focus on and close faster.</p>
            </div>

            {/* Feature 3: Marketing */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                AI Marketing & Campaign Engine
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Launch campaigns that run themselves.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Email & SMS marketing
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Automated workflows & drip sequences
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Funnel and campaign builder
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Multi-channel publishing
                </li>
              </ul>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">✓ Reach your audience everywhere — without manual work.</p>
            </div>

            {/* Feature 4: Autopilot */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                AI Business Autopilot
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Let AI handle the heavy lifting.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> AI Assistants (strategy, execution, insights)
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> AI Receptionist (captures & qualifies leads)
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> AI Cold Calling agents (follow-ups, booking)
                </li>
                <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Auto-optimization of campaigns
                </li>
              </ul>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">✓ Your business runs 24/7 — even while you sleep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Create', desc: 'Generate content, campaigns, and funnels with AI.' },
            { step: 2, title: 'Capture', desc: 'Turn visitors into leads using forms, AI chat, and smart funnels.' },
            { step: 3, title: 'Convert', desc: 'AI follows up via email, SMS, and even calls — automatically.' },
            { step: 4, title: 'Scale', desc: 'AI analyzes performance and optimizes everything for growth.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Team Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your AI Team Working 24/7
          </h2>
          <p className="text-xl text-blue-100 mb-12">No hiring. No overhead. Just results.</p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🧠', title: 'AI Assistant', desc: 'Plans and executes strategies' },
              { icon: '📞', title: 'AI Caller', desc: 'Follows up with leads instantly' },
              { icon: '💬', title: 'AI Receptionist', desc: 'Captures and qualifies prospects' },
              { icon: '📢', title: 'AI Marketer', desc: 'Runs campaigns across channels' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-blue-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Make Smarter Decisions with AI Insights
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Track engagement, leads, and revenue. Identify what's working instantly. Get AI-powered recommendations.
          </p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Stop guessing. Start scaling.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 dark:bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Your Entire AI Growth Team — For Less Than Hiring One Employee
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Everything included. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$99', desc: 'For individuals' },
              { name: 'Pro', price: '$299', desc: 'For growing businesses', popular: true },
              { name: 'Business', price: '$999', desc: 'For teams & agencies' },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 border transition-all ${
                  plan.popular
                    ? 'bg-blue-600 text-white border-blue-600 transform scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="inline-block bg-blue-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${!plan.popular && 'text-slate-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                  {plan.desc}
                </p>
                <div className={`text-4xl font-bold mb-6 ${!plan.popular && 'text-slate-900 dark:text-white'}`}>
                  {plan.price}
                  <span className={`text-sm font-normal ${plan.popular ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                    /month
                  </span>
                </div>

                <ul className={`space-y-3 mb-8 ${plan.popular ? 'text-blue-50' : 'text-slate-700 dark:text-slate-300'}`}>
                  <li className="flex gap-2">
                    <CheckCircle size={20} className={plan.popular ? 'text-blue-100' : 'text-green-500'} />
                    AI content creation
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle size={20} className={plan.popular ? 'text-blue-100' : 'text-green-500'} />
                    CRM & lead management
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle size={20} className={plan.popular ? 'text-blue-100' : 'text-green-500'} />
                    Email & SMS campaigns
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle size={20} className={plan.popular ? 'text-blue-100' : 'text-green-500'} />
                    AI assistants & automation
                  </li>
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div>
            <Shield size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Enterprise-grade security</h3>
            <p className="text-slate-600 dark:text-slate-300">Your data is encrypted and protected</p>
          </div>
          <div>
            <Users size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure API integrations</h3>
            <p className="text-slate-600 dark:text-slate-300">Connect with your favorite tools safely</p>
          </div>
          <div>
            <TrendingUp size={40} className="text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Data privacy guaranteed</h3>
            <p className="text-slate-600 dark:text-slate-300">GDPR and compliance ready</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Running Your Business on Autopilot
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Create. Capture. Convert. Scale — all with AI.
          </p>
          <button className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-lg font-bold text-lg transition-colors inline-flex items-center gap-2">
            Start Free Trial <ArrowRight size={20} />
          </button>
          <p className="text-blue-100 mt-8">Join thousands already growing with Belsuite</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Integrations</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Webhooks</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Marketplace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Social</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">LinkedIn</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12 flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-600 dark:text-slate-400 mb-4 md:mb-0">&copy; 2024 BelSuite. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Twitter</a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">LinkedIn</a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
