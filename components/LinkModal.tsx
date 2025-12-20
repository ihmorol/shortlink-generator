import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { ShortLink } from '../types';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>) => void;
  initialData?: ShortLink;
  baseUrl: string;
}

// Generate a random 6-character alphanumeric code
const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSave, initialData, baseUrl }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSlug, setIsLoadingSlug] = useState(false);

  // Generate a unique slug that doesn't exist in the database
  const generateUniqueSlug = useCallback(async () => {
    setIsLoadingSlug(true);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = generateRandomCode();
      const exists = await StorageService.checkSlugExists(code);
      
      if (!exists) {
        setSlug(code);
        setIsLoadingSlug(false);
        return;
      }
      attempts++;
    }
    
    // Fallback: use timestamp-based code if all random attempts fail
    const fallbackCode = Date.now().toString(36).slice(-6);
    setSlug(fallbackCode);
    setIsLoadingSlug(false);
  }, []);

  useEffect(() => {
    if (initialData) {
      setOriginalUrl(initialData.originalUrl);
      setSlug(initialData.slug);
      setDescription(initialData.description || '');
    } else {
      setOriginalUrl('');
      setSlug('');
      setDescription('');
      // Auto-generate unique slug when opening modal for new link
      if (isOpen) {
        generateUniqueSlug();
      }
    }
    setSuggestions([]);
  }, [initialData, isOpen, generateUniqueSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl || !slug || isLoadingSlug) return;
    onSave({ originalUrl, slug, description });
  };

  const handleGenerateSlugs = async () => {
    if (!originalUrl) return;
    setIsGenerating(true);
    setSuggestions([]);
    
    const results = await GeminiService.suggestSlugs(originalUrl, description);
    setSuggestions(results);
    setIsGenerating(false);
  };

  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Edit Shortlink' : 'Create New Link'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Destination URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Destination URL</label>
            <input
              type="url"
              required
              placeholder="https://very-long-url.com/portfolio/projects/2024"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
             <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description (Optional)</label>
             </div>
            <input
              type="text"
              placeholder="My design portfolio 2024"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Short Link / Slug */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Short Link</label>
              <button
                type="button"
                onClick={handleGenerateSlugs}
                disabled={!originalUrl || isGenerating}
                className="text-xs flex items-center gap-1 text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isGenerating ? 'Thinking...' : 'AI Suggest'}
              </button>
            </div>
            
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
              <span className="flex items-center px-4 text-slate-500 bg-slate-900/50 border-r border-slate-800 rounded-l-lg text-sm select-none">
                {cleanBase}
              </span>
              {isLoadingSlug ? (
                <div className="flex-1 flex items-center justify-center px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                  <span className="ml-2 text-sm text-slate-500">Generating unique code...</span>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="portfolio"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                  className="flex-1 bg-transparent border-0 px-4 py-2.5 text-slate-100 focus:ring-0 focus:outline-none placeholder:text-slate-600 font-mono"
                />
              )}
              {!initialData && (
                <button
                  type="button"
                  onClick={generateUniqueSlug}
                  disabled={isLoadingSlug}
                  className="flex items-center px-3 text-slate-400 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-slate-800"
                  title="Generate new code"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSlug ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-slate-500 mb-2">AI Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlug(s)}
                      className="text-xs bg-slate-800 hover:bg-primary-900/40 hover:text-primary-300 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!originalUrl || !slug}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-900/20"
            >
              {initialData ? 'Save Changes' : 'Create Link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};