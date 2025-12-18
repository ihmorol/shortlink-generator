import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { authenticate } from './_lib/auth.js';
import { SettingsSchema } from './schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = await authenticate(req, res);
  if (!userId) return;

  try {
    switch (req.method) {
      case 'GET': {
        const { data: settings, error } = await supabase
          .from('settings')
          .select('base_url')
          .eq('type', 'general') // Assuming general settings for now, but really should be per user if logic dictates
          //.eq('user_id', userId) // Uncomment if settings are per-user
          .maybeSingle();

        if (error) throw error;

        if (settings) {
          return res.status(200).json({
            baseUrl: settings.base_url
          });
        }
        return res.status(200).json(null);
      }

      case 'POST': {
        const validation = SettingsSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: validation.error.issues[0].message });
        }
        
        const settings = validation.data;
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            type: 'general', 
            base_url: settings.baseUrl,
            // user_id: userId // Uncomment if settings are per-user
          });

        if (error) throw error;

        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
