# 🎨 NuloAfrica Frontend — Next.js Client

> Modern React 19 frontend for Nigeria's zero-agency rental platform.  
> Built with Next.js 16, TypeScript, Tailwind CSS, and Radix UI.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (recommend 18 LTS)
- pnpm 8.15+ (or npm, yarn)
- Supabase account
- Mapbox token (for property maps)

### Setup

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Fill in required variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_MAPBOX_TOKEN
# - (See .env.example for full list)

# Start development server
pnpm dev

# Open browser
# http://localhost:3000
```

### Build for Production
```bash
pnpm build      # Build Next.js app
pnpm start      # Run production build locally
pnpm lint       # Run ESLint
```

---

## 📁 Project Structure

```
client/
├── app/                              # Next.js 16 App Router
│   ├── (auth)/                       # Auth pages (grouped layout)
│   │   ├── signin/page.tsx           # Login page
│   │   ├── signup/page.tsx           # Signup role selection
│   │   ├── signup/tenant/page.tsx    # Tenant signup form
│   │   ├── signup/landlord/page.tsx  # Landlord signup form
│   │   ├── verify-email/page.tsx     # Email verification waiting
│   │   ├── callback/route.ts         # OAuth callback handler
│   │   └── google/callback/route.ts  # Google OAuth processing
│   │
│   ├── (dashboard)/                  # Protected dashboard pages
│   │   ├── layout.tsx                # Dashboard layout wrapper
│   │   ├── tenant/
│   │   │   ├── page.tsx              # Tenant dashboard (overview)
│   │   │   ├── viewings/page.tsx     # Viewing requests list
│   │   │   ├── agreements/page.tsx   # Lease agreements list
│   │   │   ├── applications/page.tsx # Applications history
│   │   │   ├── maintenance/page.tsx  # Maintenance requests
│   │   │   └── [id]/page.tsx         # Individual pages
│   │   ├── landlord/
│   │   │   ├── overview/page.tsx     # Landlord dashboard
│   │   │   ├── properties/page.tsx   # Property listings
│   │   │   ├── viewings/page.tsx     # Viewing requests to review
│   │   │   ├── applications/page.tsx # Tenant applications
│   │   │   ├── agreements/page.tsx   # Lease agreements
│   │   │   └── [id]/pages.tsx        # Individual pages
│   │   └── admin/
│   │       ├── page.tsx              # Admin dashboard
│   │       ├── properties/page.tsx   # Property verification
│   │       ├── users/page.tsx        # User management
│   │       └── disputes/page.tsx     # Dispute resolution
│   │
│   ├── (public)/                     # Public pages (no auth required)
│   │   ├── page.tsx                  # Homepage
│   │   ├── about/page.tsx            # About page
│   │   ├── blog/page.tsx             # Blog listing
│   │   ├── blog/[slug]/page.tsx      # Individual blog post
│   │   ├── terms/page.tsx            # Terms of service
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   └── contact/page.tsx          # Contact form
│   │
│   ├── properties/                   # Property marketplace
│   │   ├── page.tsx                  # Property search & listing
│   │   ├── [id]/page.tsx             # Individual property detail
│   │   └── [id]/apply/page.tsx       # Application form
│   │
│   ├── layout.tsx                    # Root layout (RootProvider)
│   └── api/                          # API routes (if needed)
│       └── webhooks/                 # Webhook handlers
│
├── components/                       # Reusable React components
│   ├── layout/
│   │   ├── Navbar.tsx                # Top navigation
│   │   ├── Sidebar.tsx               # Dashboard sidebar
│   │   ├── Footer.tsx                # Footer
│   │   └── MobileNav.tsx             # Mobile navigation
│   │
│   ├── property/
│   │   ├── PropertyCard.tsx          # Property grid card
│   │   ├── PropertyGallery.tsx       # Image gallery
│   │   ├── PropertyDetails.tsx       # Detailed info section
│   │   ├── PropertyMap.tsx           # Mapbox property map
│   │   ├── AmenitiesList.tsx         # Amenities display
│   │   └── ViewingRequestModal.tsx   # Quick viewing request
│   │
│   ├── forms/
│   │   ├── SignupForm.tsx            # Signup validation form
│   │   ├── PropertyForm.tsx          # Property listing form
│   │   ├── ApplicationForm.tsx       # Rental application form
│   │   ├── ProfileForm.tsx           # User profile editor
│   │   └── FileUpload.tsx            # Multi-file upload handler
│   │
│   ├── dashboard/
│   │   ├── StatsCard.tsx             # Metric card component
│   │   ├── RecentList.tsx            # Recent items list
│   │   ├── ChartWrapper.tsx          # Chart display wrapper
│   │   └── StatusBadge.tsx           # Status indicator
│   │
│   ├── rental/
│   │   ├── AgreementPreview.tsx      # Agreement document preview
│   │   ├── PaymentBreakdown.tsx      # Rent calculation display
│   │   ├── ViewingCard.tsx           # Viewing request card
│   │   └── ApplicationCard.tsx       # Application card
│   │
│   ├── messaging/
│   │   ├── ConversationList.tsx      # Message conversations
│   │   ├── ChatWindow.tsx            # Chat interface
│   │   └── MessageInput.tsx          # Message composer
│   │
│   ├── auth/
│   │   ├── ProtectedRoute.tsx        # Auth wrapper component
│   │   ├── RoleGate.tsx              # Role-based access
│   │   └── AuthProvider.tsx          # Auth context provider
│   │
│   ├── common/
│   │   ├── LoadingSpinner.tsx        # Loading indicator
│   │   ├── ErrorCard.tsx             # Error display
│   │   ├── EmptyState.tsx            # Empty state UI
│   │   ├── ConfirmDialog.tsx         # Confirmation modal
│   │   └── Toast.tsx                 # Notification toast
│   │
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   └── (... 30+ more components)
│   │
│   └── icons/                        # Custom icon components
│       └── (lucide-react icons used throughout)
│
├── hooks/                            # Custom React hooks
│   ├── useAuth.ts                    # Auth context consumer
│   ├── useUser.ts                    # Current user data
│   ├── useOnboarding.ts              # Onboarding flow logic
│   ├── useDashboard.ts               # Dashboard data & caching
│   ├── useNotifications.ts           # Notification handling
│   ├── usePesistent.ts               # Local storage persistence
│   └── useDebug.ts                   # Dev debugging tools
│
├── contexts/                         # React Context API
│   ├── AuthContext.tsx               # Authentication state
│   ├── DashboardContext.tsx          # Dashboard caching & data
│   ├── NotificationContext.tsx       # Notification state
│   └── ThemeContext.tsx              # Dark/light theme toggle
│
├── lib/                              # Utility functions & clients
│   ├── api/
│   │   ├── authAPI.ts                # Auth endpoints
│   │   ├── propertiesAPI.ts          # Property search/CRUD
│   │   ├── applicationsAPI.ts        # Application submission
│   │   ├── viewingRequestsAPI.ts     # Viewing request client
│   │   ├── messagesAPI.ts            # Messaging endpoints
│   │   ├── agreementsAPI.ts          # Lease agreement client
│   │   ├── paymentsAPI.ts            # Payment processing
│   │   ├── notificationsAPI.ts       # Notification endpoints
│   │   ├── landlordDashboard.ts      # Landlord dashboard API
│   │   ├── tenantDashboard.ts        # Tenant dashboard API
│   │   ├── adminDashboard.ts         # Admin dashboard API
│   │   └── adminVerification.ts      # Admin verification client
│   │
│   ├── utils/
│   │   ├── supabase.ts               # Supabase client initialization
│   │   ├── format.ts                 # Formatting utilities (NGN, dates)
│   │   ├── validation.ts             # Form validation schemas
│   │   ├── rentalCalculations.ts     # Rent breakdown calculations
│   │   ├── errorHandler.ts           # Error parsing & display
│   │   └── constants.ts              # App-wide constants
│   │
│   ├── config/
│   │   ├── adminDashboard.ts         # Admin dashboard config
│   │   ├── amenities.ts              # Amenity options
│   │   └── propertyTypes.ts          # Property type options
│   │
│   └── types/
│       ├── database.ts               # Database schema types
│       ├── api.ts                    # API response types
│       └── common.ts                 # Shared types (User, Property, etc.)
│
├── public/                           # Static assets
│   ├── images/                       # Site images
│   ├── icons/                        # Icon assets
│   └── favicon.ico
│
├── config/
│   └── site.ts                       # Site configuration (title, description, etc.)
│
├── styles/                           # Global styles
│   ├── globals.css                   # Tailwind + custom CSS
│   └── theme.css                     # Color theme definitions
│
├── middleware.ts                     # Next.js middleware (auth enforcement)
├── next.config.js                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── .env.example                      # Environment variables template
├── package.json                      # Dependencies
└── pnpm-lock.yaml                    # Lock file

```

---

## 🔧 Environment Variables

Create `.env.local` in the `client/` directory:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Maps (Required)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c...

# Backend (Required for API calls)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_PATH=/api

# Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
NEXT_PUBLIC_UMAMI_ID=

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_PROPERTY_MAP=true
NEXT_PUBLIC_ENABLE_MESSAGING=true
```

---

## 🏗️ Architecture & Patterns

### Authentication Flow
```
1. User signs up/logs in → AuthContext stores JWT
2. All API calls include Authorization header
3. Protected routes check AuthContext.user
4. Middleware enforces auth + role-based access
5. OAuth callback updates user_type → redirects appropriately
```

### Data Fetching Patterns

**With Caching (Dashboard):**
```typescript
// DashboardContext caches data with 5-min TTL
const { data, loading, error, refresh } = useDashboard()
// Auto-invalidates on mutations (create/update/delete)
```

**Direct API Calls (Search, Public Data):**
```typescript
// For real-time data with no caching
const [properties, setProperties] = useState([])
useEffect(() => {
  propertiesAPI.search(filters).then(setProperties)
}, [filters])
```

**Real-time Subscriptions:**
```typescript
// Supabase Realtime for messages, notifications
useEffect(() => {
  const channel = supabase
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    .subscribe()
  return () => channel.unsubscribe()
}, [])
```

### Form Handling
- **React Hook Form** for state management
- **Zod** for schema validation
- **Custom error display** with field-level feedback
- **Real-time validation** on change or blur

### Component Organization
- **Container Components** (pages) → logic & data fetching
- **Presentational Components** (components) → UI rendering
- **Sub-components** → extracted at module level (not inside functions)
- **Custom Hooks** → shared logic between components

---

## 🎨 Design System

### Colors
```scss
$primary: #F97316 (orange-500)
$primary-dark: #EA580C (orange-600)
$background: gradient from slate-50 via stone-50 to orange-50
$text-primary: #1E293B (slate-900)
$text-secondary: #475569 (slate-600)
$border: #E2E8F0 (slate-200)
```

### Component Libraries
- **shadcn/ui** — 30+ pre-built components
- **Radix UI** — Unstyled, accessibile primitives
- **Lucide Icons** — 350+ SVG icons
- **Framer Motion** — Smooth animations
- **Embla Carousel** — Image carousel

### Responsive Breakpoints
```
sm: 640px   | md: 768px   | lg: 1024px  | xl: 1280px
```

---

## 🧪 Testing

### Unit Tests
```bash
pnpm test                 # Run Jest tests
pnpm test --watch        # Watch mode
pnpm test:coverage       # Coverage report
```

### Component Tests
```bash
# Using React Testing Library
test('button renders with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### E2E Tests (Coming Soon)
```bash
pnpm test:e2e            # Playwright tests
```

---

## 🐛 Common Issues & Solutions

### Supabase Connection Failed
**Error:** `Could not connect to database`
```bash
# Solution: Check .env.local for correct URL and key
echo $NEXT_PUBLIC_SUPABASE_URL  # Should be https://YOUR-PROJECT.supabase.co
```

### Mapbox Token Invalid
**Error:** `Authentication error - 401`
```bash
# Solution: Generate new token from mapbox.com/account/tokens
# Required scopes: tokenScope.styles:read, tokenScope.geosearch:read
```

### OAuth Callback URL Mismatch
**Error:** `Redirect URL does not match`
```bash
# Solution: In Supabase settings, add:
# http://localhost:3000/auth/google/callback  (local)
# https://yourdomain.com/auth/google/callback (production)
```

### Hot Reload Not Working
```bash
# Solution: Clear cache and restart
rm -rf .next
pnpm dev
```

---

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first CSS approach
- Touch-friendly tap targets (min 48px)
- Optimized images with responsive breakpoints
- Mobile-specific navigation (drawer instead of sidebar)

### Performance
- Image optimization with Next.js Image component
- Code splitting per route
- Lazy-loaded components for below-the-fold content
- Service worker for offline support (planned)

### Testing on Mobile
```bash
# Test on local networks
pnpm dev -- -H 0.0.0.0
# Access from mobile: http://COMPUTER_IP:3000
```

---

## 🚀 Deployment

### To Vercel (Recommended)
```bash
# Connect GitHub account to Vercel
# Select this repository
# Set environment variables in Vercel dashboard
# Auto-deploys on push to main
```

### To Other Platforms
```bash
# Build for production
pnpm build

# Start server
pnpm start
```

---

## 📚 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `react` | UI library |
| `typescript` | Type safety |
| `tailwindcss` | CSS framework |
| `@radix-ui/*` | Accessible components |
| `react-hook-form` | Form state |
| `zod` | Validation schema |
| `@supabase/ssr` | Supabase client |
| `@mapbox/mapbox-gl` | Maps |
| `sonner` | Toast notifications |
| `date-fns` | Date utilities |
| `framer-motion` | Animations |

---

## 🔗 Related Documentation

- **Main Project README:** [../../README.md](../../README.md)
- **Differentiators Guide:** [../../README_DIFFERENTIATORS.md](../../README_DIFFERENTIATORS.md)
- **Architecture Rules:** [../../COPILOT_CONTEXT.md](../../COPILOT_CONTEXT.md)
- **Backend API Docs:** Run backend on localhost:8000/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 💡 Tips for Development

### Debugging
```typescript
// Add debug logs
console.log('[COMPONENT] Data:', data)

// React DevTools
// Download React DevTools browser extension

// Next.js App Router Playground
// http://localhost:3000/__nextjs
```

### Performance Monitoring
```bash
# Build analysis
pnpm run analyze  # Generates bundle size report

# Chrome DevTools
# Lighthouse tab for performance scoring
```

### Code Quality
```bash
# Run linter
pnpm lint

# Format code (auto-fix)
pnpm lint -- --fix
```

---

## 🤝 Contributing

1. Read the [COPILOT_CONTEXT.md](../../COPILOT_CONTEXT.md) for architecture rules
2. Follow the existing component patterns
3. Keep components small and focused
4. Use TypeScript for all new code
5. Test changes before committing

---

**Built with ❤️ for the Nigerian rental market**

*Questions? Check the main [README.md](../../README.md) or backend docs*
