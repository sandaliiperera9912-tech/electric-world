# ⚡ Electric World — AI-Powered Electronics Marketplace

A full-stack AI-powered electronics marketplace built with React 18, TypeScript, Supabase, Stripe, and OpenAI (GPT-4o).

## Features

- **Volt AI Chat Assistant** — GPT-4o powered shopping assistant with tool calling
- **Product Catalog** — 20+ realistic electronics across 7 categories
- **Authentication** — Supabase email/password auth with profiles
- **Shopping Cart** — Optimistic UI with Supabase sync for logged-in users
- **Wishlist** — Save products for later
- **Stripe Checkout** — Server-side payment intents via Supabase Edge Functions
- **AI Recommendations** — GPT-4o selects related products with reasons
- **Customer Support** — Volt AI with FAQ accordion and order status lookup
- **Dark theme** — Full dark UI with Space Grotesk + DM Sans fonts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + custom design tokens |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Payments | Stripe (PaymentElement + Edge Function) |
| AI | OpenAI GPT-4o with tool calling |
| Deployment | Vercel |

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_OPENAI_API_KEY=sk-...
```

### 3. Set up Supabase database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema: `supabase/schema.sql`
3. This creates all tables, RLS policies, and seeds 23 electronics products

### 4. Set up Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy the payment intent function
supabase functions deploy create-payment-intent --project-ref YOUR_PROJECT_REF
```

Add these secrets to the Edge Function:
- `STRIPE_SECRET_KEY` — your Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard

### 5. Configure Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Use test mode keys for development
3. Disable email confirmation in Supabase: Authentication → Settings → Disable email confirmations

### 6. Run the dev server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
src/
├── components/
│   ├── ai/          # ChatWidget (Volt AI)
│   ├── layout/      # Navbar
│   ├── ui/          # Toast, BackToTop, ProductCardSkeleton
│   ├── CartDrawer.tsx
│   ├── ProductCard.tsx
│   ├── ProtectedRoute.tsx
│   └── RecommendationsSection.tsx
├── lib/
│   ├── analytics.ts      # Event tracking
│   ├── aiTools.ts        # OpenAI tool schemas
│   ├── auth.ts           # Supabase auth helpers
│   ├── cart.ts           # Cart Supabase utilities
│   ├── openai.ts         # OpenAI client + system prompt
│   ├── products.ts       # Product queries
│   ├── recommendations.ts # AI product recommendations
│   ├── supportKnowledge.ts # FAQ data
│   ├── supabase.ts       # Supabase client
│   ├── toolExecutor.ts   # AI tool execution
│   ├── utils.ts          # Helpers
│   └── voltBot.ts        # Keyword fallback bot
├── pages/
│   ├── CartPage.tsx
│   ├── CategoryPage.tsx
│   ├── CheckoutPage.tsx
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── OrderDetailPage.tsx
│   ├── OrdersPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── ProductsPage.tsx
│   ├── ProfilePage.tsx
│   ├── RegisterPage.tsx
│   ├── SearchResultsPage.tsx
│   ├── SupportPage.tsx
│   └── WishlistPage.tsx
├── store/
│   ├── authContext.tsx
│   └── cartContext.tsx
└── types/index.ts
```

---

## Stripe Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Declined | 4000 0000 0000 0002 |
| 3D Secure | 4000 0025 0000 3155 |

Use any future expiry date and any 3-digit CVC.

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy — `vercel.json` handles SPA routing

---

## Design Tokens

| Token | Value |
|-------|-------|
| Brand Blue | `#3b82f6` |
| Brand Purple | `#8b5cf6` |
| Background | `#060608` |
| Card | `#0d0d14` |
| Text Primary | `#e8e6f0` |
| Heading Font | Space Grotesk |
| Body Font | DM Sans |
