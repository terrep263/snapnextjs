-- Create admin_accounts table
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'admin', -- 'super_admin' or 'admin'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  last_login timestamp with time zone
);

-- Create admin_audit_logs table for tracking actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'login', 'block_email', 'delete_event', 'add_admin', etc.
  resource_type text, -- 'email', 'event', 'admin_account', etc.
  resource_id text,
  details jsonb, -- Store additional context
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON public.admin_accounts(email);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_active ON public.admin_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- Enable RLS (Row Level Security)
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_accounts
DROP POLICY IF EXISTS "Service role can manage admin accounts" ON public.admin_accounts;
CREATE POLICY "Service role can manage admin accounts"
  ON public.admin_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for audit_logs
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can manage audit logs"
  ON public.admin_audit_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
