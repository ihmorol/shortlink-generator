/// <reference types="vite/client" />
import { ShortLink, AppSettings } from '../types';

const API_BASE = '/api';

// Check if we're in development mode without Vercel's runtime
const isDevelopment = import.meta.env.DEV;

// LocalStorage keys for fallback
const LINKS_KEY = 'linkmaster_links';
const SETTINGS_KEY = 'linkmaster_settings';

// LocalStorage fallback functions
const localStorageFallback = {
  getLinks: (): ShortLink[] => {
    try {
      const stored = localStorage.getItem(LINKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load links from localStorage", e);
      return [];
    }
  },

  saveLinks: (links: ShortLink[]) => {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  },

  getSettings: (): AppSettings | null => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to load settings from localStorage");
      return null;
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

// Helper to check if API is available and returning JSON (not static file)
async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/links`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    // Check if it's JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    return response.ok && !!isJson;
  } catch {
    return false;
  }
}

let useLocalStorage: boolean | null = null;

async function shouldUseLocalStorage(): Promise<boolean> {
  if (useLocalStorage !== null) return useLocalStorage;
  
  // Always try to detect API first, even in production (just in case)
  // But prioritize dev mode check to avoid unnecessary requests in obvious cases
  if (isDevelopment) {
    const apiAvailable = await isApiAvailable();
    useLocalStorage = !apiAvailable;
    
    if (useLocalStorage) {
      console.info('📦 DEV MODE: Using localStorage fallback. Run `npm start` (vercel dev) to use Supabase.');
    } else {
      console.info('🔌 DEV MODE: Connected to local API (vercel dev).');
    }
  } else {
    // Production: Assume API is available, but if it fails, we might want fallback? 
    // Usually no, we want it to fail or retry. But for safety:
    useLocalStorage = false;
  }
  
  return useLocalStorage;
}

export const StorageService = {
  getLinks: async (token?: string | null): Promise<ShortLink[]> => {
    if (await shouldUseLocalStorage()) {
      return localStorageFallback.getLinks();
    }
    
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/links`, { headers });
      if (!response.ok) throw new Error('Failed to fetch links');
      return await response.json();
    } catch (e) {
      console.error("Failed to load links", e);
      return localStorageFallback.getLinks();
    }
  },

  addLink: async (link: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>, token?: string | null): Promise<ShortLink> => {
    if (await shouldUseLocalStorage()) {
      const newLink: ShortLink = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        clicks: 0,
        ...link
      };
      const links = localStorageFallback.getLinks();
      localStorageFallback.saveLinks([newLink, ...links]);
      return newLink;
    }
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify(link)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create link');
    }
    return await response.json();
  },

  updateLink: async (updatedLink: ShortLink, token?: string | null): Promise<void> => {
    if (await shouldUseLocalStorage()) {
      const links = localStorageFallback.getLinks();
      const newLinks = links.map(link => link.id === updatedLink.id ? updatedLink : link);
      localStorageFallback.saveLinks(newLinks);
      return;
    }
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedLink)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update link');
    }
  },

  deleteLink: async (id: string, token?: string | null): Promise<void> => {
    if (await shouldUseLocalStorage()) {
      const links = localStorageFallback.getLinks();
      localStorageFallback.saveLinks(links.filter(link => link.id !== id));
      return;
    }
    
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/links?id=${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete link');
  },

  getSettings: async (token?: string | null): Promise<AppSettings | null> => {
    if (await shouldUseLocalStorage()) {
      return localStorageFallback.getSettings();
    }
    
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/settings`, { headers });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    } catch (e) {
      console.error("Failed to load settings", e);
      return localStorageFallback.getSettings();
    }
  },

  saveSettings: async (settings: AppSettings, token?: string | null): Promise<void> => {
    if (await shouldUseLocalStorage()) {
      localStorageFallback.saveSettings(settings);
      return;
    }
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to save settings');
  }
};