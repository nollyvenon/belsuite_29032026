'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Film, Music, Image, FileText, Mic, Trash2, Loader2, Wand2,
  ArrowUpDown, Calendar, Hash, SortAsc,
} from 'lucide-react';
import type { MediaAsset } from '@/hooks/useVideoProject';

const MEDIA_ICONS: Record<MediaAsset['mediaType'], React.ElementType> = {
  VIDEO_CLIP:       Film,
  AUDIO_CLIP:       Music,
  IMAGE:            Image,
  SUBTITLE_TRACK:   FileText,
  VOICEOVER:        Mic,
  BACKGROUND_MUSIC: Music,
};

const MEDIA_COLORS: Record<MediaAsset['mediaType'], string> = {
  VIDEO_CLIP:       'text-blue-400',
  AUDIO_CLIP:       'text-purple-400',
  IMAGE:            'text-emerald-400',
  SUBTITLE_TRACK:   'text-zinc-400',
  VOICEOVER:        'text-amber-400',
  BACKGROUND_MUSIC: 'text-pink-400',
};

function AssetRow({
  asset,
  onDelete,
}: {
  asset: MediaAsset;
  onDelete: () => void;
}) {
  const Icon  = MEDIA_ICONS[asset.mediaType];
  const color = MEDIA_COLORS[asset.mediaType];
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-2.5 px-3 py-2.5 group hover:bg-white/5 transition-colors"
    >
      <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-300 truncate font-medium">{asset.name}</p>
        <p className="text-[10px] text-zinc-600">
          {asset.mediaType.replace('_', ' ').toLowerCase()}
          {asset.aiGenerated && ' · AI'}
        </p>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </motion.div>
  );
}

export function MediaPanel({
  assets,
  onUpload,
  onDelete,
}: {
  assets: MediaAsset[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSortChange = (newSortBy: 'date' | 'name' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'type') {
      comparison = a.mediaType.localeCompare(b.mediaType);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const grouped = sortedAssets.reduce<Record<string, MediaAsset[]>>((acc, a) => {
    const key = a.mediaType;
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Drop zone */}
      <div
        className={`mx-2 mt-2 mb-1 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragging
            ? 'border-primary/60 bg-primary/5'
            : 'border-white/10 hover:border-white/20 bg-white/2'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-1.5 py-4">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-zinc-500" />
          )}
          <p className="text-xs text-zinc-500">
            {uploading ? 'Uploading…' : 'Drop files or click to upload'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {sortedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Wand2 className="w-7 h-7 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">No assets yet</p>
            <p className="text-[10px] text-zinc-600 mt-1">Upload videos, images, or audio to use in your project</p>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-2">
              <span className="text-[10px] text-zinc-500">Sort:</span>
              <button
                onClick={() => handleSortChange('date')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortBy === 'date' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3 h-3" /> Date
                {sortBy === 'date' && <ArrowUpDown className={`w-2.5 h-2.5 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
              </button>
              <button
                onClick={() => handleSortChange('name')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortBy === 'name' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <SortAsc className="w-3 h-3" /> Name
                {sortBy === 'name' && <ArrowUpDown className={`w-2.5 h-2.5 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
              </button>
              <button
                onClick={() => handleSortChange('type')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  sortBy === 'type' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Hash className="w-3 h-3" /> Type
                {sortBy === 'type' && <ArrowUpDown className={`w-2.5 h-2.5 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
              </button>
            </div>
            <AnimatePresence>
              {Object.entries(grouped).map(([type, list]) => (
                <div key={type}>
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                    {type.replace('_', ' ')}
                  </p>
                  {list.map((a) => (
                    <AssetRow key={a.id} asset={a} onDelete={() => onDelete(a.id)} />
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
