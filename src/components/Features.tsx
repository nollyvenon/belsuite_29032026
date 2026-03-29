'use client';

import { FadeIn } from './FadeIn';
import { Sparkles, Video, Share2, BarChart3, Target, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Content Generator",
    description: "Generate high-converting copy, blog posts, and social captions in seconds with our advanced LLM engine."
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: "AI Video Creator",
    description: "Turn text into stunning videos. Edit, caption, and enhance your footage automatically with AI-powered tools."
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "Auto Posting System",
    description: "Schedule and auto-post to all major platforms. Our AI finds the best time to post for maximum engagement."
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "AI Ads Engine",
    description: "Create and automate ad campaigns that actually convert. AI-driven creative testing and budget optimization."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "UGC Creator",
    description: "Generate authentic user-generated content style videos and images to build massive trust with your audience."
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Advanced Analytics",
    description: "Deep insights into your content performance. Understand what works and scale your growth predictably."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <FadeIn>
            <h2 className="mb-6 text-4xl font-bold md:text-6xl font-display">
              Everything you need to <span className="text-primary">dominate</span> the feed.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Stop juggling 10 different tools. Belsuite brings your entire content and marketing workflow into one powerful, AI-driven command center.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FadeIn key={i} delay={i * 0.1} className="group">
              <div className="h-full p-8 transition-all border rounded-3xl dark:border-white/5 border-black/5 bg-white/50 dark:bg-black/50 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl dark:hover:shadow-primary/5">
                <div className="flex items-center justify-center w-12 h-12 mb-6 transition-colors rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold font-display">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
