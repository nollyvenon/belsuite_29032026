'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Zap, 
  BarChart3, 
  Cpu, 
  Menu, 
  X, 
  Bell, 
  Search, 
  Moon, 
  Sun,
  ArrowRight
} from 'lucide-react';
import { useDemo } from './DemoContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';

const SidebarItem = ({ icon: Icon, label, tab, active, onClick }: any) => (
  <button 
    onClick={() => onClick(tab)}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-xl transition-all",
      active 
        ? "bg-primary text-white orange-glow" 
        : "text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
    )}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

export const DemoLayout = ({ children }: { children: React.ReactNode }) => {
  const { activeTab, setActiveTab } = useDemo();
  const { isDark, toggle } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0D0D0D] text-[#0D0D0D] dark:text-white">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: isMobileMenuOpen ? 0 : -300 }}
        className="fixed inset-y-0 left-0 z-[60] w-[280px] border-r dark:border-white/10 border-black/5 bg-white dark:bg-black lg:hidden"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter font-display">Belsuite</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="px-4 space-y-2 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" tab="dashboard" active={activeTab === 'dashboard'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Users} label="Leads" tab="leads" active={activeTab === 'leads'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Sparkles} label="AI Content" tab="ai" active={activeTab === 'ai'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Zap} label="Automation" tab="automation" active={activeTab === 'automation'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={BarChart3} label="Analytics" tab="analytics" active={activeTab === 'analytics'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Cpu} label="Usage" tab="usage" active={activeTab === 'usage'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          
          <div className="my-2 px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Advanced</div>
          <SidebarItem icon={Sparkles} label="Builder" tab="builder" active={activeTab === 'builder'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Zap} label="Integrations" tab="integrations" active={activeTab === 'integrations'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={BarChart3} label="Live Metrics" tab="metrics" active={activeTab === 'metrics'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Sparkles} label="Tutorials" tab="videos" active={activeTab === 'videos'} onClick={(t: any) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
        </div>
      </motion.aside>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="hidden lg:flex flex-col border-r dark:border-white/10 border-black/5 bg-white dark:bg-black/20 backdrop-blur-xl"
      >
        <div className="p-6 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter font-display">Belsuite</span>
        </div>

        <div className="flex-grow px-4 space-y-2 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" tab="dashboard" active={activeTab === 'dashboard'} onClick={setActiveTab} />
          <SidebarItem icon={Users} label="Leads" tab="leads" active={activeTab === 'leads'} onClick={setActiveTab} />
          <SidebarItem icon={Sparkles} label="AI Content" tab="ai" active={activeTab === 'ai'} onClick={setActiveTab} />
          <SidebarItem icon={Zap} label="Automation" tab="automation" active={activeTab === 'automation'} onClick={setActiveTab} />
          <SidebarItem icon={BarChart3} label="Analytics" tab="analytics" active={activeTab === 'analytics'} onClick={setActiveTab} />
          <SidebarItem icon={Cpu} label="Usage" tab="usage" active={activeTab === 'usage'} onClick={setActiveTab} />
          
          {/* New Items */}
          <div className="my-2 px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Advanced</div>
          <SidebarItem icon={Sparkles} label="Builder" tab="builder" active={activeTab === 'builder'} onClick={setActiveTab} />
          <SidebarItem icon={Zap} label="Integrations" tab="integrations" active={activeTab === 'integrations'} onClick={setActiveTab} />
          <SidebarItem icon={BarChart3} label="Live Metrics" tab="metrics" active={activeTab === 'metrics'} onClick={setActiveTab} />
          <SidebarItem icon={Sparkles} label="Tutorials" tab="videos" active={activeTab === 'videos'} onClick={setActiveTab} />
        </div>

        <div className="p-4 border-t dark:border-white/10 border-black/5">
          <button 
            onClick={() => setShowConversionModal(true)}
            className="flex items-center justify-center gap-2 w-full py-4 font-bold text-white rounded-xl bg-primary hover:orange-glow transition-all"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b dark:border-white/10 border-black/5 flex items-center justify-between px-6 bg-white/50 dark:bg-black/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors lg:block hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 text-sm border rounded-xl dark:border-white/10 border-black/5 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggle}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l dark:border-white/10 border-black/5">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">Demo User</div>
                <div className="text-xs text-gray-500">Pro Plan</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                DU
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Conversion Modal */}
      <AnimatePresence>
        {showConversionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg p-10 border rounded-[40px] dark:border-white/10 border-black/5 bg-white dark:bg-black shadow-2xl text-center relative"
            >
              <button 
                onClick={() => setShowConversionModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary/10 text-primary">
                <Zap className="w-10 h-10 fill-current" />
              </div>
              
              <h2 className="text-3xl font-bold font-display mb-4">Ready to scale your business?</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                You&apos;ve seen what Belsuite can do. Now it&apos;s time to put it to work for your real business. Join 10,000+ creators and brands today.
              </p>
              
              <div className="space-y-4">
                <button className="w-full py-5 text-xl font-bold text-white rounded-full bg-primary hover:orange-glow transition-all">
                  Start Your Free Trial
                </button>
                <p className="text-sm text-gray-500">No credit card required • 14-day free trial</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating CTA */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 right-8 z-50 lg:hidden"
      >
        <button 
          onClick={() => setShowConversionModal(true)}
          className="flex items-center gap-2 px-8 py-4 font-bold text-white rounded-full bg-primary shadow-2xl orange-glow"
        >
          Start Free Trial <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};
