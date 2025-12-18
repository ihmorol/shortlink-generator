import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { LinkSchema, UpdateLinkSchema } from './schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { data: links, error } = await supabase
          .from('links')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedLinks = links.map(link => ({
          id: link.id,
          slug: link.slug,
          originalUrl: link.original_url,
          description: link.description,
          createdAt: link.created_at,
          clicks: link.clicks
        }));
        return res.status(200).json(formattedLinks);
      }

      case 'POST': {
        const validation = LinkSchema.safeParse(req.body);
        if (!validation.success) {
           return res.status(400).json({ error: validation.error.issues[0].message });
        }
        
        const { slug, originalUrl, description } = validation.data;

        // Check for duplicates
        const { data: existing } = await supabase
          .from('links')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({ error: 'Slug already exists' });
        }

        const newLink = {
          slug,
          original_url: originalUrl,
          description: description || '',
          clicks: 0
        };

        const { data: inserted, error } = await supabase
          .from('links')
          .insert(newLink)
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          id: inserted.id,
          slug: inserted.slug,
          originalUrl: inserted.original_url,
          description: inserted.description,
          createdAt: inserted.created_at,
          clicks: inserted.clicks
        });
      }

      case 'PUT': {
        const validation = UpdateLinkSchema.safeParse(req.body);
         if (!validation.success) {
           return res.status(400).json({ error: validation.error.issues[0].message });
        }
        
        const { id, slug, originalUrl, description, clicks } = validation.data;
        
        const { data: existing } = await supabase
          .from('links')
          .select('slug')
          .eq('slug', slug)
          .neq('id', id)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({ error: 'Slug already exists' });
        }

        const { error } = await supabase
          .from('links')
          .update({
            slug,
            original_url: originalUrl,
            description,
            clicks
          })
          .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (typeof id !== 'string') {
          return res.status(400).json({ error: 'ID required' });
        }
        
        const { error } = await supabase
          .from('links')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
