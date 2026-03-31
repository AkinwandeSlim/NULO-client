# 🎨 NuloAfrica Frontend

> Modern React 19 + Next.js 16 frontend for Nigeria's zero-agency rental platform.  
> Direct connection between verified tenants and landlords, eliminating agency fees.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

---

## ⚡ Quick Start (2 minutes)

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env.example .env.local
# Add: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_MAPBOX_TOKEN

# 3. Run
pnpm dev
# → Open http://localhost:3000
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS + Radix UI |
| **Forms** | React Hook Form + Zod |
| **Maps** | Mapbox GL |
| **Auth** | Supabase Auth (JWT) |
| **Realtime** | Supabase Realtime |
| **State** | React Context + Redux Toolkit |
| **UI** | shadcn/ui (30+ components) |

## ✨ Core Features

### User Flows
- 🔐 Email/Password + Google OAuth signup
- 👤 Dual-role (Tenant / Landlord / Admin)
- ✅ Email verification + KYC onboarding

### Tenant Features
- 🔍 Property search with advanced filtering
- 📍 Location-based discovery (Mapbox)
- 📅 Schedule physical/virtual viewings
- 📋 Submit rental applications
- 💬 Direct messaging with landlords
- 📜 Digital lease agreement signing
- 💳 Secure payment tracking

### Landlord Features  
- 📸 Property listing with photo gallery
- 📊 View management dashboard
- 📩 Application review & approval
- 👥 Tenant communication
- 📄 Digital agreement signing
- 💰 Payment tracking

### Admin Features
- ✅ Property verification workflow
- 👤 User management & suspension
- 📊 Platform analytics dashboard

## 📁 Structure

```
app/                 # Next.js pages
├── (auth)/          # Signup, login, OAuth
├── (dashboard)/     # Protected dashboards
│   ├── tenant/
│   ├── landlord/
│   └── admin/
├── (public)/        # Home, about, blog
└── properties/      # Marketplace

components/          # Reusable React components
lib/                 # API clients, utils, types
hooks/               # Custom hooks (useAuth, useDashboard)
contexts/            # React Context (Auth, Dashboard)
```

See `README_CLIENT.md` for detailed breakdown.

## 🔧 Environment Setup

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Io...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📦 Commands

```bash
pnpm dev       # Start dev server
pnpm build     # Build for production
pnpm start     # Run production build
pnpm lint      # Code quality check
pnpm test      # Run tests
```

## 🚀 Deployment

```bash
# Vercel (1-click deploy)
# 1. Push to GitHub
# 2. Connect repo to Vercel
# 3. Set .env variables
# 4. Auto-deploys on push

# Manual
pnpm build && pnpm start
```

## 🐛 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| Supabase connection failed | Check `.env.local` credentials |
| Mapbox auth error | Verify token scopes |
| OAuth redirect mismatch | Add URLs to Supabase Auth settings |
| Hot reload not working | Delete `.next/` and restart |

## 📌 Architecture Highlights

- ✅ **Type-safe** — TypeScript throughout
- ✅ **Modular** — Components, hooks, and API clients separated
- ✅ **Performant** — Code splitting, caching, progressive loading
- ✅ **Accessible** — WCAG compliant with Radix UI
- ✅ **Real-time** — Supabase subscriptions for live updates
- ✅ **Responsive** — Mobile-first design

## 📚 Documentation

- **Detailed Guide** → `README_CLIENT.md`
- **Full Project** → Main repository README
- **Backend API** → Server repository documentation

---

**Questions?** Create an issue or check `README_CLIENT.md` for comprehensive guide.
