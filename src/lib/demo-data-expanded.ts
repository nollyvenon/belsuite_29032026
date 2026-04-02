// Expanded mock data for high-converting demo
export interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  score: number;
  source: string;
  lastActive: string;
}

export const ENHANCED_MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@techcorp.com', status: 'Qualified', score: 98, source: 'LinkedIn Ad', lastActive: '2 mins ago' },
  { id: '2', name: 'Michael Chen', email: 'm.chen@startup.io', status: 'New', score: 85, source: 'Organic Search', lastActive: '15 mins ago' },
  { id: '3', name: 'Emma Wilson', email: 'emma@creative-agency.net', status: 'Contacted', score: 72, source: 'Referral', lastActive: '1 hour ago' },
  { id: '4', name: 'David Miller', email: 'd.miller@enterprise.com', status: 'Qualified', score: 91, source: 'Webinar', lastActive: '3 hours ago' },
  { id: '5', name: 'Lisa Garcia', email: 'lisa.g@retail-plus.com', status: 'New', score: 64, source: 'Twitter', lastActive: '5 hours ago' },
  { id: '6', name: 'James Taylor', email: 'jtaylor@fintech.co', status: 'Closed', score: 100, source: 'Direct', lastActive: '1 day ago' },
  { id: '7', name: 'Anna Brown', email: 'anna@marketing-pros.com', status: 'Qualified', score: 88, source: 'LinkedIn Ad', lastActive: '2 days ago' },
  { id: '8', name: 'Robert White', email: 'r.white@saas-solutions.io', status: 'New', score: 79, source: 'Organic Search', lastActive: '3 days ago' },
  { id: '9', name: 'Jessica Martinez', email: 'jmartinez@brandco.com', status: 'Qualified', score: 94, source: 'Facebook Ads', lastActive: '45 mins ago' },
  { id: '10', name: 'Chris Anderson', email: 'c.anderson@agency.io', status: 'New', score: 81, source: 'Google Search', lastActive: '1 hour ago' },
  { id: '11', name: 'Rachel Lee', email: 'r.lee@ecommerce.com', status: 'Contacted', score: 76, source: 'Instagram Ad', lastActive: '2 hours ago' },
  { id: '12', name: 'Tom Robinson', email: 't.robinson@consulting.co', status: 'Qualified', score: 89, source: 'Referral', lastActive: '3 hours ago' },
  { id: '13', name: 'Nicole Davis', email: 'ndavis@digital-marketing.net', status: 'New', score: 68, source: 'YouTube Ad', lastActive: '4 hours ago' },
  { id: '14', name: 'Brandon Hall', email: 'bhall@startup-hub.io', status: 'Qualified', score: 92, source: 'LinkedIn Post', lastActive: '5 hours ago' },
  { id: '15', name: 'Olivia Taylor', email: 'otaylor@content-hub.com', status: 'Closed', score: 99, source: 'Direct', lastActive: '6 hours ago' },
  { id: '16', name: 'Kevin Park', email: 'k.park@marketing-agency.co', status: 'New', score: 83, source: 'TikTok Ad', lastActive: '1 day ago' },
];

export const ENHANCED_MOCK_STATS = {
  leads: 2340,
  leadsGrowth: 24.5,
  conversion: 42.8,
  conversionGrowth: 18.3,
  revenue: 84230,
  revenueGrowth: 37.2,
  aiUsage: 84200,
  aiUsageLimit: 100000,
  contentGenerated: 487,
  campaignsActive: 23,
  avgEngagement: 8.7,
};

export const ENHANCED_MOCK_CHART_DATA = [
  { name: 'Mon', leads: 280, revenue: 4200, ai_actions: 145 },
  { name: 'Tue', leads: 320, revenue: 5100, ai_actions: 167 },
  { name: 'Wed', leads: 380, revenue: 6200, ai_actions: 189 },
  { name: 'Thu', leads: 420, revenue: 7400, ai_actions: 212 },
  { name: 'Fri', leads: 510, revenue: 9100, ai_actions: 267 },
  { name: 'Sat', leads: 480, revenue: 8200, ai_actions: 241 },
  { name: 'Sun', leads: 580, revenue: 10300, ai_actions: 298 },
];

export const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Summer Sale - Social Media Blitz', status: 'Active', leads: 450, conversion: 31.2, roi: 340 },
  { id: '2', name: 'Email Nurture Series', status: 'Active', leads: 320, conversion: 28.5, roi: 280 },
  { id: '3', name: 'LinkedIn B2B Outreach', status: 'Active', leads: 280, conversion: 45.3, roi: 520 },
  { id: '4', name: 'Influencer Partnerships', status: 'Paused', leads: 210, conversion: 52.1, roi: 680 },
  { id: '5', name: 'Retargeting Campaign', status: 'Active', leads: 380, conversion: 38.9, roi: 410 },
];

export const MOCK_AI_OUTPUTS = {
  social: `🚀 **UNLOCK YOUR GROWTH POTENTIAL WITH BELSUITE** 🚀

Join the revolution of AI-powered marketing automation. We've helped 1000+ creators scale their content with AI — no experience needed.

✨ What You Get:
🎬 AI-Powered Content Generation
📸 Smart Caption Optimization  
📊 Real-time Analytics Dashboard
💰 Revenue Tracking & Insights
⚡ 1-Click Automation

👉 **Start your FREE trial today. No credit card needed.**

Belsuite is used by top creators, agencies, and brands worldwide.

#AI #MarketingAutomation #ContentCreation #Growth #SaaS`,

  email: `Subject: 🎯 Grow Your Business 3x Faster With AI

Hi [Name],

I noticed your recent activity on LinkedIn and think you'd benefit from what we're doing at Belsuite.

The problem? Creating content takes 10+ hours per week, and most creators don't have a system to track what's actually working.

Belsuite solves this with:
✅ AI generates your content (Instagram posts, emails, ads in seconds)
✅ Auto-posts to all your channels on the perfect timing
✅ Tracks every metric that matters (leads, revenue, engagement)
✅ Automatically optimizes based on what's working

The result? Most users go from 0-6 figures within months.

I'm extending a special invite for you to try it free for 14 days. Most people see results within the first week.

[Start Your Free Trial] ← Click here

Cheers,
[Your Name]
Founder, Belsuite`,

  ad: `"I Grew My Business From $0 To $100K/Month Using AI" 

Discover how 1000+ creators, agencies, and brands are using Belsuite to automate their entire content and marketing workflow.

🚀 See Results In Days, Not Months
Generate unlimited content with AI
Auto-post across all channels
Track ROI in real-time

Get 14 days free. No credit card needed.`,

  linkedin: `🎯 Scaling content creation is NO LONGER a bottleneck.

For 3 years I manually created all my content. Post, wait for engagement, analyze, repeat. 

Then I switched to AI-powered automation and everything changed.

Now? My system creates 50+ pieces of content per week. Automatically posts them at peak times. And tracks every metric that drives revenue.

Result: Revenue grew 3x. Time spent on content management dropped from 20 hours/week to 2 hours.

If you're serious about scaling your business, AI adoption isn't optional—it's essential.

I'm sharing exactly how I did this with select founders, agencies, and creators.

[Learn About Belsuite] → The platform I built for this exact problem.`,
};

export const MOCK_AUTOMATIONS = [
  { 
    id: '1', 
    name: 'Daily Instagram Posts', 
    trigger: 'Every day at 8am', 
    actions: ['Generate Post', 'Optimize Caption', 'Post to Instagram', 'Auto-Comment'],
    status: 'Active',
    executions: 28,
    nextRun: 'Tomorrow, 8:00 am'
  },
  { 
    id: '2', 
    name: 'Lead Scoring & Email', 
    trigger: 'Lead score >80',
    actions: ['Add to CRM', 'Send Welcome Email', 'Schedule Follow-up', 'Tag as VIP'],
    status: 'Active',
    executions: 156,
    nextRun: 'Immediate (on trigger)'
  },
  { 
    id: '3', 
    name: 'Weekly Analytics Summary', 
    trigger: 'Every Monday 9am',
    actions: ['Generate Report', 'Analyze Metrics', 'Create Insights', 'Send Email'],
    status: 'Active',
    executions: 8,
    nextRun: 'Next Monday, 9:00 am'
  },
  { 
    id: '4', 
    name: 'Trending Topic Posts', 
    trigger: 'Trending topic detected',
    actions: ['Generate Post', 'Add Trending Hashtags', 'Schedule Post', 'Notify Team'],
    status: 'Active',
    executions: 47,
    nextRun: 'Immediate (on trigger)'
  },
];

export const MOCK_ANALYTICS = {
  engagement: { 
    overall: 8.7, 
    trend: 'up', 
    previousMonth: 6.2,
    change: '+40.3%'
  },
  topChannel: { 
    name: 'LinkedIn',
    performance: 340,
    growth: 45,
    avgEngagement: 12.4
  },
  roi: { 
    currentMonth: 3.4,
    avgPerCampaign: 420,
    bestCampaign: 'LinkedIn B2B Outreach',
    unitEconomics: 280,
  },
  insights: [
    '📈 Your LinkedIn content performs 3.2x better than industry average (8.7% vs 2.7%)',
    '⏰ Email campaigns see 45% higher conversion when sent between 9-11am EST',
    '👥 User-generated content drives 2.8x more engagement than branded posts',
    '📱 Your audience is most active on Tuesday and Wednesday evenings (7-9pm)',
    '✅ Product pages convert 34% better with social proof elements',
    '💬 Video content generates 5.2x more comments than static posts',
    '🔗 Your best performing link: "AI Marketing Guide" (2.3K CTR)',
  ],
};

export const MOCK_USAGE = {
  tokensUsed: 84200,
  tokensLimit: 100000,
  percentUsed: 84.2,
  costEstimate: 42.10,
  monthlyBudget: 100,
  videosGenerated: 47,
  imagesGenerated: 312,
  postsGenerated: 1230,
  emailsGenerated: 89,
  costPerVideo: 0.89,
  costPerImage: 0.12,
  costPerPost: 0.02,
  costPerEmail: 0.18,
};

export const ENHANCED_MOCK_ACTIVITY = [
  { id: '1', type: 'ai', message: 'AI generated 12 Instagram posts for Summer Campaign', time: 'Just now' },
  { id: '2', type: 'ai', message: 'Video thumbnail optimized with AI (estimated CTR +18%)', time: '2 mins ago' },
  { id: '3', type: 'lead', message: '✨ New qualified lead: Jessica Martinez (score: 94)', time: '8 mins ago' },
  { id: '4', type: 'campaign', message: '🚀 Email sequence "Welcome Series" launched to 450 leads', time: '12 mins ago' },
  { id: '5', type: 'ai', message: '📊 AI optimized Facebook Ads spend (+24% ROI achieved)', time: '25 mins ago' },
  { id: '6', type: 'revenue', message: '💰 New revenue tracked: $4,230 from LinkedIn campaign', time: '35 mins ago' },
  { id: '7', type: 'automation', message: '⚡ Automation executed: Daily Instagram Posts batch (3 posts scheduled)', time: '1 hour ago' },
  { id: '8', type: 'system', message: '🏆 Your best performing content: "AI Tips 101" - 12.4K engagement', time: '2 hours ago' },
  { id: '9', type: 'ai', message: 'AI analyzed competitor content and generated 5 new post ideas', time: '3 hours ago' },
  { id: '10', type: 'campaign', message: '✅ A/B test completed: Red CTA button beat blue by 18%', time: '4 hours ago' },
];

export const AI_RESPONSES = {
  'generate ad': "🚀 **Boost Your Content Creation with Belsuite!** \n\nAre you tired of spending hours on manual marketing? Belsuite's AI-powered platform helps you create, automate, and scale your content effortlessly. \n\n✅ AI Video Editing \n✅ Auto-Posting \n✅ Advanced Analytics \n\n**Start your free trial today and dominate the feed!** #Belsuite #AI #MarketingAutomation",
  'optimize campaign': "Based on your recent data, I recommend increasing your budget on **LinkedIn Ads** by 20%. Your current CPA is $4.50, which is 30% lower than the industry average. I've also drafted 3 new ad variants focused on 'ROI' to test against your current best performer.",
};

// Backwards compatibility
export const MOCK_LEADS = ENHANCED_MOCK_LEADS;
export const MOCK_STATS = ENHANCED_MOCK_STATS;
export const MOCK_CHART_DATA = ENHANCED_MOCK_CHART_DATA;
export const MOCK_ACTIVITY = ENHANCED_MOCK_ACTIVITY;
