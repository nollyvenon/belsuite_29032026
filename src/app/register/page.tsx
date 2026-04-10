'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Lock, User, Building, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    // TODO: Implement actual registration
    setTimeout(() => {
      setLoading(false);
      alert('Registration functionality coming soon');
    }, 1000);
  };

  return (
    <div className={`w-full min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors duration-300 flex flex-col`}>
      {/* Simple Header */}
      <div className={`border-b ${isDark ? 'border-orange-900/30 bg-black/80' : 'border-orange-100 bg-white/80'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold hidden sm:inline">Belsuite</span>
          </Link>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className={`w-full max-w-md rounded-2xl border-2 p-8 ${isDark ? 'bg-black border-orange-700/50' : 'bg-white border-orange-200'}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">Start Free Trial</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              No credit card required • 14 days free • Full access
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Name
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                  <User size={20} className="text-orange-600 flex-shrink-0" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Last Name
                </label>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                  <User size={20} className="text-orange-600 flex-shrink-0" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                <Mail size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            {/* Company Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Company
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                <Building size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="text"
                  name="company"
                  placeholder="Your Company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                <Lock size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50 border-orange-200'}`}>
                <Lock size={20} className="text-orange-600 flex-shrink-0" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-600'}`}
                  required
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5"
                required
              />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                I agree to the{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-white mt-6 ${
                isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'} {!loading && <ArrowRight size={20} />}
            </button>

            {/* Login Link */}
            <p className={`text-center mt-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
