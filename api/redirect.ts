
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.redirect(307, '/');
  }

  try {
    const { data: link, error } = await supabase
      .from('links')
      .select('id, original_url, clicks')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !link) {
      if (error) console.error('Supabase error:', error);
      // Redirect to home if link not found
      return res.redirect(302, '/?error=not_found');
    }

    // Increment clicks (fire and forget - but await to ensure it happens before function freeze)
    await supabase
      .from('links')
      .update({ clicks: (link.clicks || 0) + 1 })
      .eq('id', link.id);

    // Redirect to original URL
    return res.redirect(307, link.original_url);
  } catch (error) {
    console.error('Redirect error:', error);
    return res.redirect(302, '/');
  }
}
