import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = getServiceRoleClient();

    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, description');

    if (error) {
      console.error('Failed to fetch settings:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), { status: 500 });
    }

    // Transform into object for easier access
    const settingsObj: Record<string, any> = {};
    settings.forEach((s: any) => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    return new Response(JSON.stringify({ settings: settingsObj }), { status: 200 });
  } catch (err) {
    console.error('Get settings error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { settingKey, settingValue } = body;

    if (!settingKey || settingValue === undefined) {
      return new Response(JSON.stringify({ error: 'Setting key and value required' }), { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const { data: updated, error } = await supabase
      .from('admin_settings')
      .update({
        setting_value: settingValue,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) {
      console.error('Failed to update setting:', error);
      return new Response(JSON.stringify({ error: 'Failed to update setting' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, setting: updated }), { status: 200 });
  } catch (err) {
    console.error('Update setting error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
