-- Create admin_blocked_emails table
CREATE TABLE IF NOT EXISTS public.admin_blocked_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  created_by text
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_admin_blocked_emails_email ON public.admin_blocked_emails(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.admin_blocked_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can access all (drop if exists, then create)
DROP POLICY IF EXISTS "Service role can manage blocked emails" ON public.admin_blocked_emails;

CREATE POLICY "Service role can manage blocked emails"
  ON public.admin_blocked_emails
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
