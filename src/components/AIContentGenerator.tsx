'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Copy, DownloadCloud, Loader } from 'lucide-react';

export interface ContentGeneratorProps {
  type?: 'blog' | 'social' | 'ad' | 'email' | 'product' | 'video' | 'headlines' | 'image';
  contentType?: string;
  onGenerate?: (content: string) => void;
}

const CONTENT_TYPE_MAP: Record<string, NonNullable<ContentGeneratorProps['type']>> = {
  blog_post: 'blog',
  social_post: 'social',
  ad_copy: 'ad',
  email_campaign: 'email',
  product_description: 'product',
  video_script: 'video',
  headlines: 'headlines',
  image: 'image',
};

const ContentGenerator = ({ type, contentType, onGenerate }: ContentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const resolvedType = type ?? (contentType ? CONTENT_TYPE_MAP[contentType] : 'blog');

  // Display configuration by type
  const configs: Record<string, any> = {
    blog: {
      title: 'Blog Post Generator',
      icon: '📝',
      fields: ['Topic', 'Tone', 'Word Count', 'Keywords'],
      minWords: 500,
      maxWords: 5000,
    },
    social: {
      title: 'Social Media Post',
      icon: '📱',
      fields: ['Platform', 'Topic', 'Tone', 'Include Emojis?'],
      platforms: ['Twitter', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok'],
    },
    ad: {
      title: 'Ad Copy Generator',
      icon: '📢',
      fields: ['Product', 'Target Audience', 'Medium', 'CTA'],
      mediums: ['Google', 'Facebook', 'LinkedIn', 'Instagram', 'Email'],
    },
    email: {
      title: 'Email Campaign',
      icon: '📧',
      fields: ['Email Type', 'Recipient Type', 'Goal', 'Tone'],
      types: ['Promotional', 'Newsletter', 'Follow-up', 'Welcome'],
    },
    product: {
      title: 'Product Description',
      icon: '🛍️',
      fields: ['Product Name', 'Features', 'Target Customer', 'Price Point'],
    },
    video: {
      title: 'Video Script Generator',
      icon: '🎬',
      fields: ['Topic', 'Duration (seconds)', 'Video Type', 'Key Messages'],
      types: ['Tutorial', 'Promotional', 'Educational', 'Comedy', 'Story'],
    },
    headlines: {
      title: 'Headline Generator',
      icon: '📰',
      fields: ['Content Type', 'Topic', 'Audience', 'Number of Headlines'],
    },
    image: {
      title: 'Image Generator',
      icon: '🖼️',
      fields: ['Prompt', 'Style'],
    },
  };

  const config = configs[resolvedType] ?? configs.blog;

  const handleGenerate = async (formData: any) => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = resolvedType === 'blog' ? '/api/ai/blog-post'
        : resolvedType === 'social' ? '/api/ai/social-post'
        : resolvedType === 'ad' ? '/api/ai/ad-copy'
        : resolvedType === 'email' ? '/api/ai/email-campaign'
        : resolvedType === 'product' ? '/api/ai/product-description'
        : resolvedType === 'video' ? '/api/ai/video-script'
        : resolvedType === 'image' ? '/api/ai/image'
        : '/api/ai/headlines';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const content = data.data.content
        || data.data.script
        || data.data.email
        || data.data.description
        || data.data.copies?.join('\n\n')
        || data.data.headlines?.join('\n')
        || data.data.images?.join('\n');
      
      setGeneratedContent(content);
      onGenerate?.(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="text-4xl mb-3">{config.icon}</div>
        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        <p className="text-black/60 dark:text-white/60">
          AI-powered content generation with smart provider selection
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData);
              handleGenerate(data);
            }}
            className="space-y-4"
          >
            {config.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-2">{field}</label>
                {field === 'Tone' ? (
                  <select
                    name={field.toLowerCase().replace(' ', '_')}
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                  >
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Humorous</option>
                    <option>Engaging</option>
                  </select>
                ) : field === 'Platform' ? (
                  <select
                    name="platform"
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                  >
                    {config.platforms?.map((p) => (
                      <option key={p}>{p.toLowerCase()}</option>
                    ))}
                  </select>
                ) : field === 'Video Type' || field === 'Email Type' ? (
                  <select
                    name={field.toLowerCase().replace(' ', '_')}
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                  >
                    {config.types?.map((t) => (
                      <option key={t}>{t.toLowerCase()}</option>
                    ))}
                  </select>
                ) : field === 'Include Emojis?' ? (
                  <select
                    name="include_emojis"
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : field.includes('Word Count') || field.includes('Number of') || field.includes('Duration') ? (
                  <input
                    type="number"
                    name={field.toLowerCase().replace(/[ ()]/g, '_')}
                    placeholder={field}
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    name={field.toLowerCase().replace(/ /g, '_')}
                    placeholder={field}
                    className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
                    required
                  />
                )}
              </div>
            ))}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-red-100/10 border border-red-500/50 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Content
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Output Section */}
        <motion.div
          className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50"
        >
          <h2 className="text-lg font-semibold mb-4">Generated Content</h2>

          {generatedContent ? (
            <div className="space-y-4">
              <div className="min-h-[400px] p-4 rounded-lg bg-white dark:bg-black/30 border border-black/5 dark:border-white/5">
                <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">
                  {generatedContent}
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyToClipboard}
                  className="flex-1 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center rounded-lg bg-black/2 dark:bg-white/2 border border-dashed border-black/20 dark:border-white/20">
              <p className="text-black/60 dark:text-white/60 text-center">
                Your generated content will appear here
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ContentGenerator;
