import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://snapworxx.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

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
      return staticPages;
    }

    // Generate event URLs
    const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
      url: `${baseUrl}/e/${event.slug}`,
      lastModified: new Date(event.updated_at || event.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...eventPages];
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return staticPages;
  }
}
