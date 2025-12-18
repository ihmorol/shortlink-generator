import { useState, useEffect, useCallback } from 'react';
import { ShortLink, AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';

export const useAppState = () => {
  const { success, error } = useToast();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ baseUrl: 'https://ihmorol.vercel.app/' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [loadedLinks, loadedSettings] = await Promise.all([
        StorageService.getLinks(),
        StorageService.getSettings()
      ]);
      setLinks(loadedLinks);
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveLink = async (linkData: Omit<ShortLink, 'id' | 'createdAt' | 'clicks'>, id?: string) => {
    try {
      if (id) {
        // Update
        const existing = links.find(l => l.id === id);
        if (!existing) throw new Error('Link not found');
        const updatedLink = { ...existing, ...linkData };
        await StorageService.updateLink(updatedLink);
        setLinks(prev => prev.map(l => l.id === id ? updatedLink : l));
        success('Link updated successfully');
      } else {
        // Create
        const newLink = await StorageService.addLink(linkData);
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
      await StorageService.deleteLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      success('Link deleted successfully');
    } catch (err: any) {
      console.error(err);
      error('Failed to delete link');
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await StorageService.saveSettings(newSettings);
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
