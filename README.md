# SnapWorxx Next.js

A modern, high-performance Next.js application for event photo sharing. Built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Stack**: Built with Next.js 15, React 18, and TypeScript
- **Responsive Design**: Beautiful UI that works on all devices
- **Stripe Integration**: Secure payment processing
- **Supabase Backend**: Real-time database and authentication
- **Image Optimization**: Next.js Image component for optimal loading
- **QR Code Generation**: Easy guest photo uploads
- **Live Photo Feed**: Real-time photo viewing (Premium)

## 📦 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Payments**: Stripe
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd snapworxx-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add all variables from `.env.local`

### Option 2: Deploy via GitHub

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Click "Deploy"

### Option 3: Using this MCP Tool

Since you have access to the Vercel MCP tool, you can deploy directly:

```typescript
// The tool will automatically detect your Next.js project and deploy it
```

## 📁 Project Structure

```
snapworxx-nextjs/
├── app/                    # Next.js app directory
│   ├── create/            # Event creation page
│   ├── success/           # Payment success page
│   ├── e/[slug]/          # Guest upload pages (to be created)
│   ├── dashboard/[id]/    # Event dashboard (to be created)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility functions
│   └── supabaseClient.ts  # Supabase client
├── components/            # Reusable components (to be created)
├── public/                # Static assets
│   └── *.png             # Logo images
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies

```

## 🎨 Pages

- **Home** (`/`): Landing page with pricing and features
- **Create Event** (`/create`): Event creation and payment form
- **Success** (`/success`): Payment confirmation page
- **Guest Upload** (`/e/[slug]`): Photo upload page for guests (to be implemented)
- **Dashboard** (`/dashboard/[id]`): Event dashboard for organizers (to be implemented)

## 🔧 Configuration

### Next.js Config

The `next.config.js` file includes:
- Image optimization for external domains
- Support for Supabase and ImageKit CDN

### Tailwind Config

Custom colors are defined in `tailwind.config.js`:
- `primary`: `#5d1ba6`
- `primary-dark`: `#4a1585`

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |

## 🚨 Important Notes

1. **Supabase Functions**: Make sure your Supabase Edge Functions are deployed:
   - `checkout` - Handles Stripe checkout creation
   - `stripe-webhook` - Processes Stripe webhooks
   - `get-event-by-session` - Retrieves event details after payment
   - `send-event-email` - Sends confirmation emails

2. **Database Tables**: Ensure you have the following tables in Supabase:
   - `customers`
   - `events`
   - `uploads`

3. **Stripe Configuration**: Configure your Stripe webhook endpoint to point to your Supabase function.

## 🔐 Security

- Environment variables are handled securely through Next.js
- All sensitive keys are prefixed with `NEXT_PUBLIC_` for client-side access
- Server-side operations should use non-public environment variables

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## 🎯 Next Steps

To complete the application, you'll need to create:

1. **Guest Upload Page** (`/app/e/[slug]/page.tsx`)
   - File upload functionality
   - Image/video preview
   - Upload progress indicator

2. **Dashboard Page** (`/app/dashboard/[id]/page.tsx`)
   - Photo gallery
   - Download functionality
   - Event statistics

3. **Components**
   - QR Code display component
   - Photo gallery component
   - Upload component

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 💬 Support

For support, email support@snapworxx.com

---

Built with ❤️ using Next.js and Vercel
