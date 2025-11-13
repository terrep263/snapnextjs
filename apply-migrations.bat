@echo off
REM Supabase Migration Runner - Windows Batch Script
REM This script applies freebie event migrations using curl

setlocal enabledelayedexpansion

REM Read environment variables from .env.local
for /f "usebackq tokens=*" %%a in (`.env.local`) do (
    set "%%a"
)

if "!NEXT_PUBLIC_SUPABASE_URL!"=="" (
    echo ❌ Missing NEXT_PUBLIC_SUPABASE_URL
    exit /b 1
)

if "!SUPABASE_SERVICE_ROLE_KEY!"=="" (
    echo ❌ Missing SUPABASE_SERVICE_ROLE_KEY
    exit /b 1
)

echo 🔗 Connecting to Supabase...
echo 📍 URL: !NEXT_PUBLIC_SUPABASE_URL!

REM Extract project ID from URL
for /f "tokens=3 delims=/" %%i in ("!NEXT_PUBLIC_SUPABASE_URL!") do set PROJECT_URL=%%i
for /f "tokens=1 delims=." %%i in ("!PROJECT_URL!") do set PROJECT_ID=%%i

echo 📋 Project ID: !PROJECT_ID!

REM Note: Direct SQL execution requires admin access
echo.
echo ⚠️  IMPORTANT: Apply migrations manually via Supabase SQL Editor
echo.
echo 📍 Go to: https://supabase.com/dashboard
echo 1. Select project: !PROJECT_ID!
echo 2. Click "SQL Editor"
echo 3. Create new query
echo 4. Copy the migrations below
echo.
echo 📄 Migration 1 (Add Freebie Column):
echo ════════════════════════════════════
type migrations\add_freebie_column.sql
echo.
echo.
echo 📄 Migration 2 (Add Storage Columns):
echo ════════════════════════════════════
type migrations\add_freebie_storage_columns.sql
echo.
echo ✅ Copy these migrations to your Supabase SQL Editor and run them
pause
