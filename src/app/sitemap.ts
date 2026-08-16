import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { OCCASIONS } from '@/content/site';

/**
 * Sitemap.
 *
 * Audit D5.3: the previous sitemap advertised /pricing, /features, /about and
 * /contact, all of which returned 404 and were noindex — wasting crawl budget
 * and confusing indexers. Every static URL listed below now resolves to a real,
 * indexable page, and the /vs and /occasions pages are included so the
 * comparison and category content can be discovered.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://snapworxx.com';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/free`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/features`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  // Comparison pages — the highest-intent SEO asset in this category (D5.3)
  const vsPages: MetadataRoute.Sitemap = [
    'snapworxx-vs-pix-wedding',
    'snapworxx-vs-guestpix',
  ].map((slug) => ({
    url: `${baseUrl}/vs/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Occasion landing pages (D1.3)
  const occasionPages: MetadataRoute.Sitemap = OCCASIONS.map((occasion) => ({
    url: `${baseUrl}/occasions/${occasion.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const marketingPages = [...staticPages, ...vsPages, ...occasionPages];

  try {
    // Fetch all active events from database (no is_public column exists)
    const { data: events, error } = await supabase
      .from('events')
      .select('slug, updated_at, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(50000); // Sitemap limit

    if (error) {
      console.error('Error fetching events for sitemap:', error);
      return marketingPages;
    }

    const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
      url: `${baseUrl}/e/${event.slug}`,
      lastModified: new Date(event.updated_at || event.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...marketingPages, ...eventPages];
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return marketingPages;
  }
}
