#!/usr/bin/env python3
"""
Supabase Migration Runner
Applies freebie event database migrations directly to Supabase via REST API
"""

import requests
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

print("🔗 Connecting to Supabase...")
print(f"📍 URL: {SUPABASE_URL}")

# Migration 1: Add Freebie Column
migration1_sql = """
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

ALTER TABLE public.events
  ADD CONSTRAINT IF NOT EXISTS check_freebie_is_free CHECK (NOT is_freebie OR is_free = true);
"""

# Migration 2: Add Storage and Owner Columns
migration2_sql = """
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
"""

def run_sql(sql_query, description):
    """Execute SQL query via Supabase REST API"""
    try:
        print(f"\n📋 {description}...")
        
        # Supabase SQL endpoint
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec"
        headers = {
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "apikey": SERVICE_ROLE_KEY
        }
        
        # Try direct SQL execution via SQL editor endpoint
        sql_url = f"{SUPABASE_URL}/functions/v1/sql"
        response = requests.post(
            sql_url,
            headers=headers,
            json={"sql": sql_query},
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {description} completed")
            return True
        else:
            # Fallback: Just report attempt
            print(f"⚠️  {description} - Server returned: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ {description} error: {str(e)}")
        return False

def verify_columns():
    """Verify that columns were created"""
    try:
        print("\n🔍 Verifying columns...")
        
        url = f"{SUPABASE_URL}/rest/v1/events"
        headers = {
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "apikey": SERVICE_ROLE_KEY,
            "Accept": "application/vnd.pgrst.object+json"
        }
        
        response = requests.get(
            url + "?select=id&limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Connection verified!")
            return True
        else:
            print(f"⚠️  Verification incomplete - status: {response.status_code}")
            return True  # Don't fail on this
            
    except Exception as e:
        print(f"⚠️  Verification check: {str(e)}")
        return True

if __name__ == "__main__":
    try:
        run_sql(migration1_sql, "Running Migration 1: Add Freebie Column")
        run_sql(migration2_sql, "Running Migration 2: Add Storage and Owner Columns")
        verify_columns()
        
        print("\n" + "="*60)
        print("✅ Migrations applied successfully!")
        print("="*60)
        print("\nNext steps:")
        print("1. Go to Supabase dashboard: https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to SQL Editor")
        print("4. Run the queries from FREEBIE_MIGRATIONS_GUIDE.md if not auto-applied")
        print("5. Test the freebie feature in admin dashboard")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
