import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug parameter is required' });
  }

  try {
    const { data: existing, error } = await supabase
      .from('links')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ exists: !!existing });
  } catch (error: any) {
    console.error('Check slug error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
