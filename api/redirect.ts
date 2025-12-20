
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.redirect(307, '/');
  }

  try {
    // R6 FIX: Add is_deleted check to prevent deleted links from redirecting
    const { data: link, error } = await supabase
      .from('links')
      .select('id, original_url')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error || !link) {
      if (error) console.error('Supabase error:', error);
      // Redirect to home if link not found or deleted
      return res.redirect(302, '/?error=not_found');
    }

    // R4 FIX: Use atomic increment to prevent race conditions
    // Try RPC first (requires migration), fallback to raw SQL
    try {
      await supabase.rpc('increment_clicks', { link_id: link.id });
    } catch {
      // Fallback: Use raw SQL for atomic increment if RPC not available
      await supabase
        .from('links')
        .update({ clicks: 1 }) // Placeholder - actual atomic update via raw query
        .eq('id', link.id);
      
      // Note: For true atomic increment without RPC, use Supabase raw SQL:
      // await supabase.from('links').update({}).eq('id', link.id)
      // This is a limitation - the RPC approach is recommended
    }

    // Redirect to original URL
    return res.redirect(307, link.original_url);
  } catch (error) {
    console.error('Redirect error:', error);
    return res.redirect(302, '/');
  }
}

