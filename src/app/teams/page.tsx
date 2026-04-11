'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeamDashboard from '@/components/teams/TeamDashboard';

export default function TeamsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (loading && token) {
    setIsAuthenticated(true);
    setLoading(false);
  } else if (loading && !token) {
    router.push('/');
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <TeamDashboard />;
}
