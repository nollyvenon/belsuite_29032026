'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, Mail, Phone, ExternalLink } from 'lucide-react';
import { useDemo } from './DemoContext';
import { cn } from '@/lib/utils';

export const LeadsView = () => {
  const { leads } = useDemo();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold font-display">Leads Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-10 pr-4 py-2 text-sm border rounded-xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="p-2 border rounded-xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40 hover:bg-black/5 dark:hover:bg-white/5">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden border rounded-2xl dark:border-white/10 border-black/5 bg-white dark:bg-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-white/10 border-black/5 bg-black/5 dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Source</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Last Active</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <motion.tr 
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group border-b dark:border-white/5 border-black/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold uppercase rounded-full",
                      lead.status === 'New' ? "bg-blue-500/10 text-blue-500" :
                      lead.status === 'Contacted' ? "bg-yellow-500/10 text-yellow-500" :
                      lead.status === 'Qualified' ? "bg-green-500/10 text-green-500" :
                      "bg-purple-500/10 text-purple-500"
                    )}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[60px] h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            lead.score > 80 ? "bg-green-500" :
                            lead.score > 50 ? "bg-yellow-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{lead.source}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{lead.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-gray-500"><Mail className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-gray-500"><Phone className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
