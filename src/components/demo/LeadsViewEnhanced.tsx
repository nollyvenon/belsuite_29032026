'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Filter, Star, Mail, Phone, Calendar, TrendingUp } from 'lucide-react';
import { useDemo } from './DemoContext';
import { ENHANCED_MOCK_LEADS } from '@/lib/demo-data-expanded';
import { cn } from '@/lib/utils';

const ScoreBar = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-emerald-500';
    if (s >= 80) return 'bg-blue-500';
    if (s >= 70) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 80) return 'Good';
    if (s >= 70) return 'Qualified';
    return 'Cold';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Score</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className={cn('h-full rounded-full', getColor(score))}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{getLabel(score)}</span>
    </div>
  );
};

const LeadCard = ({ lead, index }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Contacted': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Qualified': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      case 'Closed': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="p-5 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 dark:text-white">{lead.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
        </div>
        <motion.div
          animate={{ scale: isHovered ? 1.2 : 1 }}
          className="text-yellow-500"
        >
          <Star className={cn('w-5 h-5', lead.score >= 90 && 'fill-current')} />
        </motion.div>
      </div>

      <div className="space-y-3 mb-4">
        <ScoreBar score={lead.score} />

        <div className="flex items-center justify-between text-xs">
          <span className={cn('px-2.5 py-1 rounded-lg font-medium', getStatusColor(lead.status))}>
            {lead.status}
          </span>
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {lead.lastActive}
          </span>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            From {lead.source}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-3 border-t dark:border-white/5 border-black/5"
          >
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:orange-glow transition-all">
              <Mail className="w-4 h-4" />
              Contact
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold border rounded-lg dark:border-white/10 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              <Phone className="w-4 h-4" />
              Call
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const LeadsViewEnhanced = () => {
  const { leads } = useDemo();
  const [filter, setFilter] = useState<'all' | 'new' | 'qualified' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status.toLowerCase() === filter;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    newLeads: leads.filter(l => l.status === 'New').length,
    qualifiedLeads: leads.filter(l => l.status === 'Qualified').length,
    closedLeads: leads.filter(l => l.status === 'Closed').length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length),
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 text-center">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Total Leads</p>
          <p className="text-3xl font-bold font-display text-gray-900 dark:text-white">{leads.length}</p>
        </div>
        <div className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 text-center">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">New</p>
          <p className="text-3xl font-bold font-display text-blue-600 dark:text-blue-400">{stats.newLeads}</p>
        </div>
        <div className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 text-center">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Qualified</p>
          <p className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">{stats.qualifiedLeads}</p>
        </div>
        <div className="p-4 border rounded-xl dark:border-white/10 border-black/5 bg-white/50 dark:bg-black/20 text-center">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Avg Score</p>
          <p className="text-3xl font-bold font-display text-orange-600 dark:text-orange-400">{stats.avgScore}</p>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search leads by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {(['all', 'new', 'qualified', 'closed'] as const).map(label => (
            <button
              key={label}
              onClick={() => setFilter(label)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all capitalize',
                filter === label
                  ? 'bg-primary text-white'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Leads Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No leads match your filters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
