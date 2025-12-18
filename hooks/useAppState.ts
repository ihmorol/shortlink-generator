import { useState, useEffect, useCallback } from 'react';
import { ShortLink, AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '@clerk/clerk-react';

export const useAppState = () => {
  const { success, error } = useToast();
  const { getToken, userId } = useAuth();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ baseUrl: 'https://1ihm.vercel.app/' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return; // Don't load if not signed in
    
    try {
      const token = await getToken();
      const [loadedLinks, loadedSettings] = await Promise.all([
        StorageService.getLinks(token),
        StorageService.getSettings(token)
      ]);
      setLinks(loadedLinks);
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      // Don't show toast on initial load error if it's just auth related, maybe?
      // But here we likely want to know.
    } finally {
      setLoading(false);
    }
  }, [error, getToken, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveLink = async (linkData: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>, id?: string) => {
    try {
      const token = await getToken();
      if (id) {
        // Update
        const existing = links.find(l => l.id === id);
        if (!existing) throw new Error('Link not found');
        const updatedLink = { ...existing, ...linkData };
        await StorageService.updateLink(updatedLink, token);
        setLinks(prev => prev.map(l => l.id === id ? updatedLink : l));
        success('Link updated successfully');
      } else {
        // Create
        const newLink = await StorageService.addLink(linkData, token);
        setLinks(prev => [newLink, ...prev]);
        success('Link created successfully');
      }
      return true;
    } catch (err: any) {
      error(err.message || 'Failed to save link');
      return false;
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const token = await getToken();
      await StorageService.deleteLink(id, token);
      setLinks(prev => prev.filter(l => l.id !== id));
      success('Link deleted successfully');
    } catch (err: any) {
      console.error(err);
      error('Failed to delete link');
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const token = await getToken();
      await StorageService.saveSettings(newSettings, token);
      setSettings(newSettings);
      success('Settings saved successfully');
      return true;
    } catch (err: any) {
      error('Failed to save settings');
      return false;
    }
  };

  return {
    links,
    settings,
    loading,
    saveLink,
    deleteLink,
    saveSettings,
    refresh: loadData
  };
};
