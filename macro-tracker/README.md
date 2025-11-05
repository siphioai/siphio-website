# Macro Tracker Web Application

A production-ready single-user macro tracking application built with Next.js 14, Supabase, and Recharts.

## Features

- 🔍 USDA FoodData Central API integration for whole foods
- 📊 4 real-time graphs (streak calendar, daily gauges, 7-day trends, 30-day composition)
- ⚡ Real-time updates via Supabase subscriptions
- 🎯 Customizable daily macro goals
- 📱 Responsive design for mobile and desktop

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- USDA API key (optional, increases rate limit)

## Setup Instructions

### 1. Clone and Install

```bash
cd macro-tracker
npm install
```

### 2. Supabase Setup

1. Create a new project at https://supabase.com
2. Go to Settings > API and copy:
   - Project URL
   - Anon/Public key
3. Go to SQL Editor and run the migration in `supabase/migrations/001_initial_schema.sql`
4. Verify tables created successfully

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
USDA_API_KEY=your_usda_api_key_optional
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Usage

1. Set your daily macro goals (calories, protein, carbs, fat)
2. Search for whole foods using the USDA database
3. Add foods to meals (breakfast, lunch, dinner, snack) with quantities in grams
4. Watch graphs update in real-time as you log foods
5. Track your consistency with the streak calendar

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with real-time)
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **API**: USDA FoodData Central
- **Validation**: Zod + React Hook Form
- **Date Utils**: date-fns

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Troubleshooting

**Charts not updating in real-time?**
- Verify real-time is enabled on `daily_summary` table in Supabase
- Check browser console for subscription errors

**USDA API rate limit errors?**
- Sign up for API key at https://fdc.nal.usda.gov/api-key-signup/
- Add to `.env.local`

**Build errors?**
- Ensure all `'use client'` directives are present on client components
- Check TypeScript errors: `npm run build`

## License

MIT
