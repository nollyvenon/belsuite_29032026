'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useCalendar, type CalendarDay } from '@/hooks/useSocial';
import { PostStatusBadge } from './PostStatusBadge';
import { PlatformDot } from './PlatformBadge';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay(); // 0-6
  const total = new Date(year, month + 1, 0).getDate();
  return { first, total };
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const from = useMemo(() => new Date(year, month, 1), [year, month]);
  const to   = useMemo(() => new Date(year, month + 1, 0, 23, 59, 59), [year, month]);

  const { days, loading, error } = useCalendar(from, to);

  const dayMap = useMemo(() => {
    const m: Record<string, CalendarDay> = {};
    for (const d of days) m[d.date] = d;
    return m;
  }, [days]);

  const { first, total } = getMonthDays(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar grid */}
      <div className="lg:col-span-2">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 uppercase py-2">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: total }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data    = dayMap[dateStr];
              const isToday = dateStr === today.toISOString().slice(0, 10);
              const isSelected = selectedDay === dateStr;
              const hasPosts = data && data.posts.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-start p-1.5 transition-colors text-left ${
                    isSelected
                      ? 'bg-primary/20 border border-primary/40'
                      : isToday
                      ? 'bg-white/10 border border-white/20'
                      : hasPosts
                      ? 'bg-white/3 border border-white/5 hover:bg-white/8'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-zinc-400'}`}>
                    {day}
                  </span>

                  {hasPosts && (
                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                      {data.posts.slice(0, 3).flatMap((p) =>
                        p.platforms.slice(0, 2).map((pl, j) => (
                          <PlatformDot key={`${p.id}-${j}`} platform={pl} />
                        )),
                      ).slice(0, 4)}
                    </div>
                  )}

                  {hasPosts && data.posts.length > 1 && (
                    <span className="text-[9px] text-zinc-500 mt-0.5">{data.posts.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side panel */}
      <div>
        {selectedDayData ? (
          <div>
            <h3 className="text-base font-bold text-white mb-4">
              {new Date(selectedDayData.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </h3>
            <div className="space-y-3">
              {selectedDayData.posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl border border-white/5 p-4"
                >
                  <p className="text-sm text-zinc-300 line-clamp-2 mb-2">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <PostStatusBadge status={post.status} />
                    <div className="flex gap-1">
                      {post.platforms.map((p, i) => <PlatformDot key={i} platform={p} />)}
                    </div>
                  </div>
                  {post.scheduledAt && (
                    <p className="text-[10px] text-zinc-500 mt-2">
                      {new Date(post.scheduledAt).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-zinc-500 text-sm">Click a day to see scheduled posts</p>
          </div>
        )}
      </div>
    </div>
  );
}
