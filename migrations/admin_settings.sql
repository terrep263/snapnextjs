-- Create admin_settings table for feature toggles
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on setting_key
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(setting_key);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role can manage settings" ON public.admin_settings;
CREATE POLICY "Service role can manage settings"
  ON public.admin_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
  ('promo_enabled', '{"enabled": true}', 'Enable/disable free promo feature'),
  ('affiliate_enabled', '{"enabled": true}', 'Enable/disable affiliate system'),
  ('stripe_payments_enabled', '{"enabled": true}', 'Enable/disable Stripe payments'),
  ('email_notifications_enabled', '{"enabled": true}', 'Enable/disable email notifications')
ON CONFLICT (setting_key) DO NOTHING;
