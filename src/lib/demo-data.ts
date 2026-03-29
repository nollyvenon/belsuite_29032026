export interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  score: number;
  source: string;
  lastActive: string;
}

export const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@techcorp.com', status: 'Qualified', score: 98, source: 'LinkedIn Ad', lastActive: '2 mins ago' },
  { id: '2', name: 'Michael Chen', email: 'm.chen@startup.io', status: 'New', score: 85, source: 'Organic Search', lastActive: '15 mins ago' },
  { id: '3', name: 'Emma Wilson', email: 'emma@creative-agency.net', status: 'Contacted', score: 72, source: 'Referral', lastActive: '1 hour ago' },
  { id: '4', name: 'David Miller', email: 'd.miller@enterprise.com', status: 'Qualified', score: 91, source: 'Webinar', lastActive: '3 hours ago' },
  { id: '5', name: 'Lisa Garcia', email: 'lisa.g@retail-plus.com', status: 'New', score: 64, source: 'Twitter', lastActive: '5 hours ago' },
  { id: '6', name: 'James Taylor', email: 'jtaylor@fintech.co', status: 'Closed', score: 100, source: 'Direct', lastActive: '1 day ago' },
  { id: '7', name: 'Anna Brown', email: 'anna@marketing-pros.com', status: 'Qualified', score: 88, source: 'LinkedIn Ad', lastActive: '2 days ago' },
  { id: '8', name: 'Robert White', email: 'r.white@saas-solutions.io', status: 'New', score: 79, source: 'Organic Search', lastActive: '3 days ago' },
];

export const MOCK_STATS = {
  leads: 2340,
  leadsGrowth: 12.5,
  conversion: 38.2,
  conversionGrowth: 4.1,
  revenue: 12430,
  revenueGrowth: 18.7,
  aiUsage: 84200,
  aiUsageLimit: 100000,
};

export const MOCK_CHART_DATA = [
  { name: 'Mon', leads: 120, revenue: 800 },
  { name: 'Tue', leads: 150, revenue: 1200 },
  { name: 'Wed', leads: 180, revenue: 1100 },
  { name: 'Thu', leads: 220, revenue: 1600 },
  { name: 'Fri', leads: 250, revenue: 2100 },
  { name: 'Sat', leads: 210, revenue: 1800 },
  { name: 'Sun', leads: 280, revenue: 2400 },
];

export const MOCK_ACTIVITY = [
  { id: '1', type: 'ai', message: 'AI generated 12 Instagram posts for Summer Campaign', time: 'Just now' },
  { id: '2', type: 'campaign', message: 'Email sequence "Welcome Series" launched', time: '10 mins ago' },
  { id: '3', type: 'lead', message: 'New high-score lead captured: Sarah Johnson (98)', time: '15 mins ago' },
  { id: '4', type: 'ai', message: 'AI optimized ad spend for Facebook Ads (+15% ROI)', time: '1 hour ago' },
  { id: '5', type: 'system', message: 'Monthly analytics report generated', time: '3 hours ago' },
];

export const AI_RESPONSES = {
  'generate ad': "🚀 **Boost Your Content Creation with Belsuite!** \n\nAre you tired of spending hours on manual marketing? Belsuite's AI-powered platform helps you create, automate, and scale your content effortlessly. \n\n✅ AI Video Editing \n✅ Auto-Posting \n✅ Advanced Analytics \n\n**Start your free trial today and dominate the feed!** #Belsuite #AI #MarketingAutomation",
  'optimize campaign': "Based on your recent data, I recommend increasing your budget on **LinkedIn Ads** by 20%. Your current CPA is $4.50, which is 30% lower than the industry average. I've also drafted 3 new ad variants focused on 'ROI' to test against your current best performer.",
};
