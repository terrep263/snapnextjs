# SnapWorxx — Coolify Deployment Guide

## Host
Hostinger VPS · Coolify · Ubuntu 24

## Required Environment Variables
Set all variables from `.env.local.example` in the Coolify service environment panel.

## Build Config
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Start Command: `npm run start`
- Output: `standalone` (set in next.config.js)

## Notes
- `output: 'standalone'` is required for Coolify Node.js container deployment.
- All env vars must be set in Coolify panel — `.env.local` is local dev only.
- Stripe webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
- Register webhook in Stripe dashboard with events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
# cache bust 
