'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Wand2, Download, Loader, AlertCircle } from 'lucide-react';
import { passthroughImageLoader } from '@/lib/image-loader';
import { useAuthStore } from '@/stores/auth-store';

export interface ImageGeneratorProps {
  onGenerated?: (urls: string[]) => void;
}

export const ImageGenerator = ({ onGenerated }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quantity, setQuantity] = useState(1);
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { accessToken } = useAuthStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter an image description');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          size,
          quantity,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error('Image generation failed');
      }

      const data = await response.json();
      setImages(data.data.images);
      onGenerated?.(data.data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎨 Image Generator</h1>
        <p className="text-black/60 dark:text-white/60">
          Create stunning AI-generated images from text descriptions
        </p>
      </div>

      {/* Controls */}
      <motion.div
        className="p-6 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 mb-8"
      >
        <div className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">Image Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
              className="w-full px-4 py-3 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
              >
                <option>1024x1024</option>
                <option>1792x1024</option>
                <option>1024x1792</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                className="w-full px-3 py-2 border rounded-lg border-black/10 dark:border-white/10 bg-white dark:bg-black/50"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-100/10 border border-red-500/50 text-red-600 dark:text-red-400 flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Generate Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full px-4 py-3 rounded-lg bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating Images...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Images
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Generated Images */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold mb-4">Generated Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="relative group aspect-square"
              >
                <Image
                  src={url}
                  alt={`Generated image ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="rounded-lg object-cover"
                  loader={passthroughImageLoader}
                  unoptimized
                />
                <motion.a
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  href={url}
                  download
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
                >
                  <Download className="w-6 h-6 text-white" />
                </motion.a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && !error && (
        <div className="text-center py-12">
          <Wand2 className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
          <p className="text-black/60 dark:text-white/60">
            Enter a description and click Generate to create images
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageGenerator;
