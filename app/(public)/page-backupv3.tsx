"use client"

/**
 * NuloAfrica — Landing Page
 * ------------------------------------------------------------------
 * Dark-mode, orange-brand landing page that tells the NuloAfrica story
 * (who we are, our vision & mission) and showcases the four products:
 *
 *   1. NEST      — Nulo Equity Share Trust (co-property investment).
 *                  Waitlist-only for now → CTA points to a placeholder.
 *   2. Rental    — Marketplace where tenants search & apply → /properties
 *   3. Landlord  — Property-management dashboard → /landlord
 *
 * Layout system (for consistent alignment across every section):
 *   <Section>        — one vertical band: shared max-w container, padding
 *                      rhythm, background variant, scroll-offset for anchors.
 *   <SectionHeading> — eyebrow + title + subtitle, one consistent scale.
 *   CARD / EYEBROW / BTN_* — shared class tokens (no more inline drift).
 *
 * The previous landing page is preserved at ./page-backup.tsx
 * ------------------------------------------------------------------
 */

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  Users,
  Search,
  LayoutDashboard,
  Quote,
  MapPin,
  Mail,
  Phone,
  Send,
  Play,
  Sparkles,
  Target,
  Eye,
  Sun,
  Moon,
  LayoutGrid,
  User,
  LogOut,
  Building2,
  Home,
  Calendar,
  FileText,
  MessageSquare,
  Heart,
  Settings,
  BookOpen,
  Info,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ParticleNetwork } from "@/components/home/ParticleNetwork"
import MarqueeTicker from "@/components/MarqueeTicker"
import { TICKER_DATA } from "@/data/content"
import { FeaturedPropertiesSection } from "@/components/home/FeaturedPropertiesSection"
import { StatsSection } from "@/components/home/StatsSection"
import { Footer } from "@/components/footer"
import { WelcomeModal } from "@/components/home/WelcomeModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/NotificationBell"

/* ------------------------------------------------------------------ */
/*  Design tokens (shared class strings — the source of alignment)     */
/* ------------------------------------------------------------------ */

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/80 bg-white"}`
const getCardHoverClass = () =>
  "transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"
const BTN_PRIMARY =
  "rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25"
const BTN_OUTLINE =
  "rounded-lg border border-orange-500/70 bg-transparent text-orange-400 font-semibold transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-black"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WAITLIST_URL = "https://nest-by-nulo.vercel.app/"

const NAV_LINKS = [
  { label: "About Us", href: "#about" },
  { label: "Featured", href: "#featured" },
  { label: "NEST", href: "#nest" },
  { label: "Founders", href: "#founders" },
  { label: "Contact", href: "#contact" },
]

const NAV_PRODUCTS = [
  { label: "Rental Marketplace", href: "/properties", description: "For Tenants" },
  { label: "Property Management", href: "/landlord", description: "For Property Managers" },
  { label: "NEST", href: WAITLIST_URL, description: "For Investors" },
  { label: "PropFlow", href: "#", description: "AI Agent for Rentals", isComingSoon: true },
]

const NAV_GET_STARTED = [
  { label: "I'm looking for a property", href: "/signup/tenant", description: "Tenant — Find & rent verified homes", icon: "home" as const },
  { label: "I'm listing properties", href: "/signup/landlord", description: "Landlord — Manage your portfolio", icon: "building" as const },
  { label: "I want to invest", href: WAITLIST_URL, description: "Investor — Co-own via NEST", icon: "trending" as const },
]

const PRODUCTS = [
  {
    icon: Search,
    tag: "Rental Marketplace",
    title: "Find & Apply for Homes",
    body: "Search verified rentals across Lagos, Abuja, and Port Harcourt. Filter by budget and location, book viewings, and apply — all in one place.",
    cta: "Browse Properties",
    href: "/properties",
  },
  {
    icon: LayoutDashboard,
    tag: "Landlord Dashboard",
    title: "Manage Your Properties",
    body: "List properties, screen applicants, sign digital agreements, and collect rent. A complete property-management workspace built for African landlords.",
    cta: "Open Dashboard",
    href: "/landlord",
  },
  {
    icon: Users,
    tag: "NEST — Coming Soon",
    title: "Co-Own High-Yield Rentals",
    body: "Pool funds with other investors through NEST to acquire premium rental properties. We manage everything; you earn your share of the rent monthly.",
    cta: "Join the Waitlist",
    href: WAITLIST_URL,
  },
  {
    icon: Sparkles,
    tag: "PropFlow — Coming Soon",
    title: "AI-Powered Rental Assistant",
    body: "Get instant answers to your rental questions with PropFlow, our AI agent that helps you find properties, understand leases, and navigate the rental market smarter.",
    cta: "Learn More",
    href: "#",
    isComingSoon: true,
  },
]

const VALUE_CARDS = [
  {
    icon: TrendingUp,
    title: "Smart, Local-First Search",
    body: "Technology tuned for the African market — surfacing the right homes across the cities where our people actually live and work.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, Every Time",
    body: "Every listing and every landlord is checked by our team, so what you see online is exactly what you get in person.",
  },
  {
    icon: Sparkles,
    title: "One Platform, Four Products",
    body: "Rent a home, manage your portfolio, co-invest through NEST, or get AI-powered assistance with PropFlow — all under one trusted NuloAfrica roof.",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Discover & Filter",
    body: "Use our local-first search to find verified properties that match your exact needs, budget, and preferred locations across Nigeria.",
  },
  {
    num: "02",
    title: "Rent or Invest",
    body: "Rent directly through the marketplace, or co-own high-yield rentals through NEST with an amount that suits your budget.",
  },
  {
    num: "03",
    title: "Move In or Earn",
    body: "For renters, move into your verified home. For NEST investors, receive your share of rental income every month as values grow.",
  },
  {
    num: "04",
    title: "AI-Powered Support",
    body: "Get instant help with PropFlow AI, your intelligent rent assistant that answers questions, guides applications, and provides 24/7 support.",
  },
]

const STATS = [
  { value: "21+", label: "Verified Properties" },
  { value: "< 24h", label: "Response Time" },
  { value: "95%", label: "Verified Landlords" },
  { value: "3", label: "Cities & Growing" },
]

const TESTIMONIALS = [
  {
    quote:
      "NuloAfrica made renting effortless. From viewing to signing, everything was transparent — I'm now settled in a home I love in Lekki.",
    author: "Chinwe Okafor",
    city: "Lagos",
  },
  {
    quote:
      "As a landlord, the dashboard changed how I work. Applications, agreements, and rent are finally in one place instead of scattered across WhatsApp.",
    author: "Adekunle Adebayo",
    city: "Ibadan",
  },
  {
    quote:
      "I was skeptical about co-owning property, but the NEST model made it simple. The plans are affordable and the locations are prime.",
    author: "Fatima Musa",
    city: "Abuja",
  },
  {
    quote:
      "Verified listings meant no wasted trips and no scams. What I saw online is exactly what I moved into. That trust is rare here.",
    author: "Emeka Nwosu",
    city: "Port Harcourt",
  },
  {
    quote:
      "The team actually responds. Within a day of applying I had a viewing booked. NuloAfrica feels built for how we live.",
    author: "Blessing Eze",
    city: "Lagos",
  },
]

const FOUNDERS = [
  {
    name: "Terver Orbunde (MBA)",
    role: "Founder & Chief Executive Officer",
    bio: "Visionary leader driving the trust infrastructure for Africa's housing economy through technology, data, and innovative financing models.",
    image: "/images/ceo.jpg",
  },
  {
    name: "Fakorede Akinwande Alexander",
    role: "Founding Engineer / Technical Lead",
    bio: "Technology architect building scalable platforms and AI-powered solutions for African real estate markets.",
    image: "/images/ctoa.png",
  },
]

const FAQS = [
  {
    q: "What is NuloAfrica?",
    a: "NuloAfrica is Africa's rental and property-management platform. It brings together a rental marketplace for tenants, a management dashboard for landlords, and NEST — a co-ownership investment product — under one trusted brand.",
  },
  {
    q: "What is NEST and how does it work?",
    a: "NEST (Nulo Equity Share Trust) lets you pool funds with other investors to acquire high-yield rental properties. Nulo Africa handles acquisition, tenant sourcing, maintenance, and rent collection, and you receive your proportional share of the rent every month. NEST is currently in early access — join the waitlist to be notified at launch.",
  },
  {
    q: "How do you verify properties and landlords?",
    a: "Our team personally verifies every listing and runs background checks on landlords before they can publish. This keeps the marketplace free of scams and ensures what you see online matches reality.",
  },
  {
    q: "Can I inspect a property before I commit?",
    a: "Yes. You can book a viewing directly from any listing, and only proceed to application and payment once you're satisfied.",
  },
  {
    q: "I'm a landlord — how do I list my property?",
    a: "Open the Landlord Dashboard, complete your verification, and add your property. From there you can screen applicants, sign digital agreements, and collect rent in one workspace.",
  },
  {
    q: "How do I get started?",
    a: "Browse the marketplace to rent, open the dashboard to manage properties, or join the NEST waitlist to co-invest. Getting started takes just a few minutes.",
  },
]

const USEFUL_LINKS = [
  { label: "Browse Properties", href: "/properties" },
  { label: "Landlord Dashboard", href: "/landlord" },
  { label: "NEST Waitlist", href: WAITLIST_URL },
  { label: "About Us", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
]

/* Inline brand social icons (lucide-react dropped brand glyphs). */
const SOCIAL_ICONS = [
  {
    label: "Facebook",
    href: "#",
    path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68-1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-10.4a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.44v6.3ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z",
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showTop, setShowTop] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [getStartedOpen, setGetStartedOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()

  const carouselRef = useRef<HTMLDivElement>(null)

  // Prevent hydration flashes
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sticky header + scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      setShowTop(y > 500)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // This landing page opts out of the global `has-navbar` body padding
  // and sets the body background based on theme so the fixed header/hero sit flush at the top.
  useEffect(() => {
    document.body.classList.remove("has-navbar")
    document.body.style.paddingTop = "0"
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff"
    return () => {
      document.body.classList.add("has-navbar")
      document.body.style.paddingTop = ""
      document.body.style.backgroundColor = ""
    }
  }, [theme])

  const scrollCarousel = useCallback((dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" })
  }, [])

  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  // Featured properties state
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  // Stats state
  const [realStats, setRealStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    verifiedLandlords: 0,
    citiesCovered: 3,
    newThisWeek: 0,
    verificationRate: 95,
    avgResponseTime: "< 24h",
    loading: true
  })

  // Fetch featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoadingProperties(true)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/search?status=vacant&sort=newest&limit=12`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured properties')
        }
        
        const data = await response.json()
        const propertiesArray = data.properties || data.data || data || []
        setFeaturedProperties(propertiesArray.length > 0 ? propertiesArray : [])
      } catch (error) {
        console.error('Failed to fetch featured properties:', error)
        setFeaturedProperties([])
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchFeaturedProperties()
  }, [])

  // Fetch real stats
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/stats/platform-summary`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        
        const data = await response.json()
        setRealStats({
          totalProperties: data.total_properties || 0,
          activeTenants: data.active_tenants || 0,
          verifiedLandlords: data.verified_landlords || 0,
          citiesCovered: data.cities_covered || 3,
          newThisWeek: data.new_this_week || 0,
          verificationRate: data.verification_rate || 95,
          avgResponseTime: data.avg_response_time || "< 24h",
          loading: false
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setRealStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchRealStats()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={`flex min-h-screen flex-col font-sans antialiased ${theme === "dark" ? "text-white bg-black" : "text-slate-900 bg-white"}`}>
      {/* ---------------------------------------------------------- */}
      {/*  Brand styles (orange, scoped to this page)                */}
      {/* ---------------------------------------------------------- */}
      <style jsx global>{`
        body {
          background-color: ${theme === "dark" ? "#000000" : "#ffffff"} !important;
        }
        :root {
          --header-height: 0px;
        }
        .nulo-gradient-text {
          background: linear-gradient(135deg, #ea580c, #fb923c, #f97316);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        .nulo-hero-gradient {
          background: ${theme === "dark"
            ? "linear-gradient(195deg, #000000 41%, #7c2d12 78%, #ea580c 100%)"
            : "linear-gradient(195deg, #ffffff 41%, #fff7ed 78%, #fed7aa 100%)"};
        }
        /* Hero building image — fades left edge into the dark background */
        .nulo-hero-img-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 28%, black 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 28%, black 100%);
        }
        /* Stat dividers */
        .nulo-stat-divider {
          width: 1px;
          background: ${theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"};
        }
        .nulo-noscroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Sticky top bar: rental-status ticker + primary nav.
          In normal flow (sticky, not fixed) so it reserves its own height —
          the hero no longer needs a large top offset, which removes the
          stretched empty gradient the fixed marquee used to force. */}
      <div className={`sticky top-0 z-50 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        <div className={`w-full border-b border-orange-500/20 backdrop-blur-sm ${theme === "dark" ? "bg-black/60" : "bg-white/80"}`}>
          <MarqueeTicker items={TICKER_DATA} speed={40} theme={theme} />
        </div>
        <Header scrolled={scrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} productsOpen={productsOpen} setProductsOpen={setProductsOpen} getStartedOpen={getStartedOpen} setGetStartedOpen={setGetStartedOpen} toast={toast} theme={theme} toggleTheme={toggleTheme} />
      </div>

      <main className="flex-1">
        {/* ======================= HERO ======================= */}
        <section
          id="hero"
          className="nulo-hero-gradient relative z-[1] flex w-full flex-col items-center justify-center overflow-hidden text-center"
          style={{ minHeight: "calc(100vh - var(--header-height, 0px))" }}
        >
          {/* Particle network background */}
          <div className="absolute inset-0 z-0">
            <ParticleNetwork />
          </div>

          {/* Content constrained for readability.
              pt-8 / pb-24 shifts the flex-center point upward so the
              headline sits in the upper-center sweet spot rather than
              the true mathematical midpoint of the viewport. */}
          <div className={cx(CONTAINER, "relative z-10 pt-8 pb-24")}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mx-auto max-w-3xl"
            >
              <p className={cx(EYEBROW, "mb-3 sm:mb-4 tracking-[0.12em] text-[11px] sm:text-[13px]")}>Africa&apos;s Premier Property Platform</p>
              <h1 className="mb-5 sm:mb-6 text-[26px] sm:text-[36px] font-semibold leading-tight tracking-tight md:text-[42px] lg:text-[48px] lg:leading-[1.18]">
                <span className={theme === "dark" ? "text-white" : "text-slate-900"}>One Home for </span>
                <span className="nulo-gradient-text">Renting, Managing &amp; Investing</span>
                <span className={theme === "dark" ? "text-white" : "text-slate-900"}> in African Property</span>
              </h1>
              <p className={`mx-auto mb-8 sm:mb-10 max-w-xl text-[13px] sm:text-[14px] leading-relaxed tracking-wide ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                NuloAfrica connects you with verified rentals, gives landlords a complete
                management dashboard, and lets you co-own high-yield properties through NEST.
                Discover, rent, list, and invest — with confidence.
              </p>

              <div className="flex flex-col items-stretch justify-center gap-3 sm:items-center sm:flex-row sm:gap-4">
                <Link href="/properties" className="sm:inline-flex">
                  <Button className={cx(BTN_PRIMARY, "group w-full sm:w-auto px-8 py-3.5 text-[15px] hover:-translate-y-0.5")}>
                    Explore Rentals
                    <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href={WAITLIST_URL} className="sm:inline-flex">
                  <Button variant="outline" className={cx(BTN_OUTLINE, "w-full sm:w-auto px-8 py-3.5 text-[15px] hover:-translate-y-0.5")}>
                    Explore NEST
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================= ABOUT / VISION & MISSION ======================= */}
        <Section id="about" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid items-start gap-8 sm:gap-12 lg:grid-cols-2"
          >
            <div>
              <p className={cx(EYEBROW, "mb-3")}>Who We Are</p>
              <h2 className="mb-5 sm:mb-6 text-[22px] sm:text-[28px] font-semibold leading-tight lg:text-[38px]">
                Where African Ambition{" "}
                <span className="nulo-gradient-text">Meets a Place to Belong</span>
              </h2>
              <p className={`mb-5 text-[15px] leading-relaxed ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                NuloAfrica was built on a simple belief: finding a home, managing a property,
                and building wealth through real estate should be transparent, trustworthy, and
                within reach for every African. We replaced scattered listings and broken trust
                with one verified platform.
              </p>
              <p className={`text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Today we serve tenants, landlords, and everyday investors across Lagos, Abuja,
                and Port Harcourt — and we&apos;re only getting started.
              </p>
            </div>

            <div className="grid gap-5">
              <CollapsibleStoryCard
                icon={Eye}
                title="Our Vision"
                body="To create a future where every African has a trusted pathway to secure housing, build wealth, and participate in the continent's real estate economy."
                theme={theme}
                defaultOpen={false}
              />
              <CollapsibleStoryCard
                icon={Target}
                title="Our Mission"
                body="We leverage technology, data, and innovative financing models to make housing more accessible, transparent, and inclusive. By connecting people, property, and capital through trusted digital infrastructure, we are transforming how Africa rents, owns, invests in, and manages real estate."
                theme={theme}
                defaultOpen={true}
              />
              <CollapsibleStoryCard
                icon={ShieldCheck}
                title="Our Values"
                body="Trust first. Verified always. Built for the way Africans actually live, work, and invest — with people, not just properties, at the center."
                theme={theme}
                defaultOpen={false}
              />
            </div>
          </motion.div>
        </Section>

        {/* ======================= PRODUCTS (4 sub-apps) ======================= */}
        <Section id="products" variant="gradient-dark" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="One Platform, Four Products"
              title="Everything You Need Across the Property Journey"
              subtitle="Whether you're looking for a home, managing a portfolio, or investing for the first time — NuloAfrica has a product built for you."
              theme={theme}
            />
            <div className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PRODUCTS.map((p, index) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                >
                  <ProductCard
                    icon={p.icon}
                    tag={p.tag}
                    title={p.title}
                    body={p.body}
                    cta={p.cta}
                    href={p.href}
                    isComingSoon={p.isComingSoon}
                    toast={toast}
                    theme={theme}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= WHY NULO (value props) ======================= */}
        <Section id="why" variant="gradient-orange" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Why NuloAfrica"
              title="Built on Trust, Designed for Africa"
              subtitle="Three reasons thousands of tenants, landlords, and investors choose to build their next chapter with us."
              theme={theme}
            />
            <div className="grid items-stretch gap-5 sm:gap-8 md:grid-cols-3">
              {VALUE_CARDS.map((v, index) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                >
                  <div className={cx(
                    getCardClass(theme), getCardHoverClass(),
                    "flex h-full flex-col p-6 lg:p-8",
                    "border-l-[3px] border-l-orange-500/0 hover:border-l-orange-500 transition-all duration-300"
                  )}>
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25">
                      <v.icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <h3 className={`mb-3 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{v.title}</h3>
                    <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{v.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= HOW IT WORKS ======================= */}
        <Section id="how-it-works" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="How It Works"
              title="Four Steps to a Home or an Investment"
              subtitle="A simple four-step path from discovery to move-in — or your first rental investment."
              theme={theme}
            />
            <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, index) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className="relative flex flex-col items-center text-center"
                >
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-[30px] left-[calc(50%+36px)] w-[calc(100%-72px)] h-px bg-gradient-to-r from-orange-500/40 to-orange-500/10" />
                  )}
                  <div className={`relative flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-xl font-bold
                    ${theme === "dark"
                      ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30"
                      : "bg-orange-50 text-orange-600 ring-1 ring-orange-300/60"}`}>
                    {s.num}
                  </div>
                  <h3 className={`mb-2 mt-5 text-[16px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{s.title}</h3>
                  <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{s.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= FEATURED PROPERTIES ======================= */}
        <Section id="featured" variant="gradient-dark" glow theme={theme}>
          <FeaturedPropertiesSection
            properties={featuredProperties}
            loading={loadingProperties}
            formatPrice={formatPrice}
            favorites={favorites}
            theme={theme}
          />
        </Section>

        {/* ======================= NEST (feature break) ======================= */}
        <Section
          id="nest"
          variant="gradient-dark"
          backdrop={
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${theme === "dark" ? "from-[#1a0a02] via-black to-[#2a1206]" : "from-orange-50 via-white to-orange-100"}`} />
              <div className={`absolute inset-0 ${theme === "dark" ? "bg-black/60" : "bg-white/40"}`} />
            </>
          }
          glow
          theme={theme}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* copy */}
              <div className="text-center lg:text-left">
                <p className={cx(EYEBROW, "mb-3")}>Introducing NEST</p>
                <h2 className="mb-4 text-[26px] font-semibold leading-tight sm:text-[30px] lg:text-[36px]">
                  Co-Own <span className="nulo-gradient-text">High-Yield</span> Rental Properties
                </h2>
                <p className={`mx-auto mb-8 max-w-xl text-[14px] leading-relaxed ${theme === "dark" ? "text-white/65" : "text-slate-600"} lg:mx-0`}>
                  NEST (Nulo Equity Share Trust) lets you pool funds with other investors to
                  acquire premium rentals across Africa. We manage everything — acquisition,
                  tenants, maintenance — and you simply receive your share of the rent every
                  month. NEST is launching soon; join the waitlist to be first in.
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href={WAITLIST_URL}>
                    <Button className={cx(BTN_PRIMARY, "group px-8 py-3.5 text-[15px]")}>
                      Join the NEST Waitlist
                      <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <a
                    href="https://www.instagram.com/reel/DaC7ekCtXzi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition-colors ${theme === "dark" ? "hover:text-orange-300" : "hover:text-orange-600"}`}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    Watch on Instagram
                  </a>
                </div>
              </div>

              {/* media — Instagram reel shown in its native portrait shape (uncropped) */}
              <div className="mx-auto w-full max-w-[320px] sm:max-w-[380px]">
                <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-black shadow-2xl shadow-orange-500/10">
                  <iframe
                    src="https://www.instagram.com/reel/DaC7ekCtXzi/embed"
                    title="NEST explainer — Instagram reel"
                    className="block h-[500px] sm:h-[680px] w-full"
                    loading="lazy"
                    scrolling="no"
                    allow="encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ======================= STATS ======================= */}
        <Section id="stats" variant="gradient-orange" glow theme={theme}>
          <StatsSection 
            stats={realStats}
            loading={realStats.loading}
            theme={theme}
          />
        </Section>

        {/* ======================= VIDEO SECTION ======================= */}
        <Section
          id="video"
          variant="gradient-light"
          glow
          theme={theme}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="See It In Action"
              title={<>Experience <span className="nulo-gradient-text">NuloAfrica</span></>}
              subtitle="Watch how easy it is to find, rent, and manage properties on our platform."
              className="mb-12"
              theme={theme}
            />

            {/* ---- Thumbnail card (text left, play right) ---- */}
            {!isVideoPlaying ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className={`relative mx-auto max-w-5xl cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl transition-shadow duration-300 hover:shadow-xl ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-[#1c1008] to-[#120a04] shadow-orange-500/5 hover:shadow-orange-500/10"
                    : "bg-gradient-to-br from-[#fff8ed] to-[#fff1dc] shadow-orange-500/5 hover:shadow-orange-500/15"
                }`}
                onClick={() => setIsVideoPlaying(true)}
              >
                {/* Subtle organic pattern overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
                  <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="video-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <circle cx="60" cy="60" r="40" fill="none" stroke={theme === "dark" ? "#f97316" : "#ea580c"} strokeWidth="0.5" />
                        <circle cx="60" cy="60" r="20" fill="none" stroke={theme === "dark" ? "#f97316" : "#ea580c"} strokeWidth="0.5" />
                        <line x1="0" y1="60" x2="120" y2="60" stroke={theme === "dark" ? "#f97316" : "#ea580c"} strokeWidth="0.3" />
                        <line x1="60" y1="0" x2="60" y2="120" stroke={theme === "dark" ? "#f97316" : "#ea580c"} strokeWidth="0.3" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#video-pattern)" />
                  </svg>
                </div>

                {/* Large decorative number */}
                <div className={`pointer-events-none absolute -right-8 -bottom-8 text-[220px] font-black leading-none select-none ${
                  theme === "dark" ? "text-white/[0.02]" : "text-orange-500/[0.04]"
                }`}>
                  N
                </div>

                {/* Content: text left + play right */}
                <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 lg:p-14">
                  {/* Left — text content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <div className="h-1.5 w-8 rounded-full bg-orange-500" />
                      <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                        theme === "dark" ? "text-orange-400/80" : "text-orange-600"
                      }`}>Platform Demo</span>
                    </div>
                    <h3 className={`mb-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-[34px] ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}>
                      See How NuloAfrica{" "}
                      <span className="nulo-gradient-text">Works for You</span>
                    </h3>
                    <p className={`max-w-md text-[15px] leading-relaxed ${
                      theme === "dark" ? "text-white/55" : "text-slate-500"
                    }`}>
                      From searching verified rentals to managing properties and co-investing through NEST — watch the full platform experience in under two minutes.
                    </p>

                    {/* Quick feature pills */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {["Verified Listings", "Digital Agreements", "Rent Collection", "NEST Co-Ownership"].map((label) => (
                        <span
                          key={label}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            theme === "dark"
                              ? "bg-white/5 text-white/50 ring-1 ring-white/10"
                              : "bg-orange-500/5 text-orange-700/70 ring-1 ring-orange-500/10"
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right — play button */}
                  <div className="flex flex-shrink-0 items-center justify-center">
                    <div className="group/btn relative">
                      {/* Outer ring (subtle) */}
                      <div className={`absolute -inset-3 rounded-full transition-opacity duration-300 group-hover/btn:opacity-100 opacity-0 ${
                        theme === "dark" ? "bg-orange-500/5" : "bg-orange-500/8"
                      }`} />
                      {/* Main play circle */}
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/25 transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:shadow-xl group-hover/btn:shadow-orange-500/30 sm:h-24 sm:w-24">
                        <Play className="h-8 w-8 fill-white text-white ml-1 sm:h-10 sm:w-10" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom bar — duration + CTA hint */}
                <div className={`relative flex items-center justify-between border-t px-6 py-3 sm:px-8 lg:px-14 ${
                  theme === "dark" ? "border-white/5" : "border-orange-500/10"
                }`}>
                  <span className={`text-xs font-medium ${
                    theme === "dark" ? "text-white/30" : "text-slate-400"
                  }`}>2 min watch</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    theme === "dark" ? "text-orange-400/70 group-hover:text-orange-400" : "text-orange-600/70 group-hover:text-orange-600"
                  }`}>
                    Click to play
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ) : (
              /* ---- Playing state: full video ---- */
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative mx-auto max-w-5xl aspect-video overflow-hidden rounded-3xl border border-orange-500/20 shadow-2xl shadow-orange-500/10"
              >
                <iframe
                  src="https://drive.google.com/file/d/13eggGGQwzehcVrArb6cJPwLgy2i_f8Y0/preview"
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay"
                  allowFullScreen
                />
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(false)}
                  className={`absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    theme === "dark"
                      ? "bg-black/60 text-white hover:bg-black/80"
                      : "bg-white/80 text-slate-900 hover:bg-white"
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </Section>

        {/* ======================= CEO MESSAGE ======================= */}
        <Section id="ceo" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid items-start gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {/* ── Left: text ── */}
            <div>
              <p className={cx(EYEBROW, "mb-3")}>Message from the CEO</p>
              <h2 className="mb-5 sm:mb-6 text-[22px] sm:text-[28px] font-semibold leading-tight lg:text-[36px]">
                Building the Future of{" "}
                <span className="nulo-gradient-text">Housing in Africa</span>
              </h2>
              <div className={`space-y-4 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/65" : "text-slate-600"}`}>
                <p>
                  Housing is one of humanity&apos;s most fundamental needs, yet for millions of
                  Africans, it remains one of life&apos;s greatest challenges.
                </p>
                <p>
                  For too long, access to housing has been defined by high barriers, fragmented
                  markets, limited financing, and a lack of trust. Families struggle to find safe
                  places to rent. Investors face unnecessary obstacles to participating in real
                  estate. Property owners and managers navigate inefficient systems that slow
                  growth and reduce confidence.
                </p>
                <p>
                  At Nulo Africa, we believe there is a better way. We are building the trust
                  infrastructure that powers Africa&apos;s housing economy. Our ambition goes
                  beyond creating products—we are creating an ecosystem where technology, data, and
                  innovative financing models work together to make housing more accessible,
                  transparent, and inclusive.
                </p>
                <p>
                  Through our Equity Share Trust Platform (NEST), we are democratizing property
                  ownership by enabling more people to invest in rental real estate through
                  fractional ownership. Through our AI-powered Rental Marketplace, we are creating
                  trusted digital experiences that simplify renting and property management.
                  Through our Advisory Services, we partner with governments, institutions, and
                  private sector leaders to design the policies, systems, and strategies that will
                  shape the future of housing across the continent.
                </p>
                <p>
                  We believe that prosperous nations are not defined by the number of buildings
                  they construct, but by the number of people who can confidently participate in
                  the opportunities those buildings create. This is more than real estate. It is
                  about financial inclusion, economic resilience, and generational wealth. It is
                  about building systems that outlast us and creating opportunities that extend to
                  every African.
                </p>
                <p className="font-medium text-orange-400">
                  Thank you for joining us on this journey. Together, we are not simply building
                  houses—we are building the future of housing in Africa.
                </p>
              </div>
              {/* signature */}
              <div className={`mt-8 flex items-center gap-4 border-t pt-6 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-orange-500/40 flex-shrink-0">
                  <img src="/images/pceo.jpg" alt="Terver Orbunde" className="h-full w-full object-cover object-[center_10%]" />
                </div>
                <div>
                  <div className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Terver Orbunde (MBA)</div>
                  <div className="text-[13px] text-orange-400">Founder &amp; Chief Executive Officer, Nulo Africa</div>
                </div>
              </div>
            </div>

            {/* ── Right: single premium image card ── */}
            <div className="lg:sticky lg:top-28">
              <div className={`relative overflow-hidden rounded-2xl shadow-2xl shadow-black/30
                ${theme === "dark" ? "border border-white/[0.06]" : "border border-orange-500/20"}`}>

                {/* Photo */}
                <div className="relative h-[480px] sm:h-[560px] w-full">
                  <img
                    src="/images/ceo1.jpg"
                    alt="Terver Orbunde — CEO, NuloAfrica"
                    className="h-full w-full object-cover object-[center_8%] transition-transform duration-700 hover:scale-[1.02]"
                  />
                  {/* multi-stop gradient — transparent top, dark bottom for badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* top-right corner brand mark */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center justify-center rounded-xl bg-black/50 px-2.5 py-2 shadow-lg backdrop-blur-sm">
                      <img
                        src="/nuloafrica-newlightlogo-complete.png"
                        alt="NuloAfrica"
                        className="h-6 w-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* bottom identity panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    {/* pill badge */}
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-400">Founder &amp; CEO</span>
                    </div>
                    <div className="text-[18px] font-bold text-white leading-tight">Terver Orbunde (MBA)</div>
                    <div className="mt-1 text-[12px] text-white/60">NuloAfrica · Abuja, Nigeria</div>
                  </div>
                </div>

                {/* bottom strip — quote pull */}
                <div className={`px-5 py-4 border-t ${theme === "dark" ? "border-white/[0.06] bg-[#0d0d0d]" : "border-orange-500/10 bg-slate-50"}`}>
                  <p className={`text-[12px] leading-relaxed italic ${theme === "dark" ? "text-white/45" : "text-slate-500"}`}>
                    &ldquo;We are not simply building houses — we are building the future of housing in Africa.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ======================= MEET THE FOUNDERS ======================= */}
        <Section id="founders" variant="gradient-orange" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Meet the Founders"
              title={<>The Team Behind <span className="nulo-gradient-text">NuloAfrica</span></>}
              subtitle="A passionate team building the future of African real estate."
              theme={theme}
            />
            <div className="mx-auto grid max-w-4xl items-stretch gap-8 sm:grid-cols-2">
              {FOUNDERS.map((founder, index) => (
                <motion.div
                  key={founder.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className={cx(getCardClass(theme), getCardHoverClass(), "flex h-full flex-col overflow-hidden")}
                >
                  {/* Image — taller, centered, name overlaid at bottom */}
                  <div className="relative h-80 w-full overflow-hidden sm:h-[420px]">
                    <img
                      src={founder.image}
                      alt={founder.name}
                      className="h-full w-full object-cover object-[center_10%]"
                    />
                    {/* gradient overlay — stronger at bottom for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {/* name + role overlaid on photo */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-[17px] font-bold text-white leading-tight">{founder.name}</h3>
                      <p className="mt-1 text-[13px] font-semibold text-orange-400">{founder.role}</p>
                    </div>
                  </div>
                  {/* bio below */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/55" : "text-slate-500"}`}>{founder.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= TESTIMONIALS ======================= */}
        <Section id="testimonials" variant="gradient-dark" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Testimonials"
              title={<>Every Home &amp; Investment Tells a <span className="nulo-gradient-text">Story</span></>}
              theme={theme}
            />
            <div className="relative">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollCarousel(-1)}
              className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500/90 text-black shadow-lg backdrop-blur-sm transition-all hover:bg-orange-400 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollCarousel(1)}
              className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500/90 text-black shadow-lg backdrop-blur-sm transition-all hover:bg-orange-400 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={carouselRef}
              className="nulo-noscroll flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.author}
                  className={cx(getCardClass(theme), "flex w-[380px] flex-shrink-0 snap-start flex-col p-7")}
                >
                  <Quote className="mb-5 h-7 w-7 text-orange-500/40" />
                  <p className={`mb-6 flex-1 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/65" : "text-slate-600"}`}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[13px] font-bold text-orange-400 ring-1 ring-orange-500/25">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{t.author}</div>
                      <div className={`text-xs ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>{t.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </motion.div>
        </Section>

        {/* ======================= FAQ ======================= */}
        <Section
          id="faq"
          containerClassName="max-w-[800px]"
          backdrop={
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/tierra-mallorca-rgJ1J8SDEAY-unsplash.jpg')" }}
              />
              <div className={`absolute inset-0 bg-gradient-to-b ${theme === "dark" ? "from-black/70 via-black/60 to-black/80" : "from-white/60 via-white/50 to-white/70"}`} />
            </>
          }
          glow
          theme={theme}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="FAQ"
              title={<>Frequently Asked <span className="nulo-gradient-text">Questions</span></>}
              theme={theme}
            />
          <div>
            {FAQS.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={item.q} className={`border-b ${i === 0 ? "border-t" : ""} ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className={`flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
                    aria-expanded={open}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={cx(
                        "h-4 w-4 flex-shrink-0 text-orange-400 transition-transform duration-300",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cx(
                      "grid transition-all duration-300",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className={`pb-5 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </motion.div>
        </Section>

        {/* ======================= CONTACT ======================= */}
        <Section id="contact" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Get In Touch"
              title={<>Let&apos;s <span className="nulo-gradient-text">Talk</span></>}
              theme={theme}
            />
            <div className="grid gap-10 sm:gap-16 lg:grid-cols-2">
            {/* form */}
            <form onSubmit={(e) => e.preventDefault()} className={cx(getCardClass(theme), "p-6 lg:p-8")}>
              <div className="mb-5">
                <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${theme === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-white/25" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
              <div className="mb-5">
                <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${theme === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-white/25" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
              <div className="mb-6">
                <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us how we can help…"
                  className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-none ${theme === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-white/25" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
              <Button type="submit" className={cx(BTN_PRIMARY, "w-full py-3.5 text-[15px]")}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>

            {/* info */}
            <div className="flex flex-col gap-8">
              <ContactBlock icon={MapPin} title="Our Location" theme={theme}>
                Abuja, Nigeria — serving Lagos, Abuja &amp; Port Harcourt.
              </ContactBlock>
              <ContactBlock icon={Mail} title="Quick Contact" theme={theme}>
                General: nuloafrica@gmail.com
                <br />
                Support: nuloafrica26@outlook.com
              </ContactBlock>
              <ContactBlock icon={Phone} title="Phone" theme={theme}>
                +234 813 494 2775
              </ContactBlock>
              <div>
                <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Users className="h-5 w-5 text-orange-400" />
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  {SOCIAL_ICONS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-orange-500/50 hover:text-orange-400 ${theme === "dark" ? "border-white/10 text-white/60" : "border-slate-200 text-slate-600"}`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d={s.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </Section>
      </main>

      {/* ======================= FOOTER ======================= */}
      <Footer />

      {/* ======================= SCROLL TO TOP ======================= */}
      {showTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-black shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-110 hover:bg-orange-400"
        >
          <ChevronDown className="h-5 w-5 rotate-180" />
        </button>
      )}
      <Toaster />
      <WelcomeModal theme={theme} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Layout primitives (the source of consistent alignment)             */
/* ------------------------------------------------------------------ */

/**
 * A single vertical band. Guarantees the same max-width container, side
 * padding, vertical rhythm, background, and anchor scroll-offset for every
 * section on the page.
 *
 * `backdrop` renders a full-bleed layer BEHIND the content container (for
 * gradient/image feature sections). Because the section is always
 * `position: relative`, an absolutely-positioned backdrop is correctly
 * confined to the section instead of escaping to the viewport.
 */
function Section({
  id,
  children,
  variant = "black",
  glow = false,
  className = "",
  containerClassName = "",
  backdrop,
  theme,
}: {
  id?: string
  children: React.ReactNode
  variant?: "black" | "surface" | "gradient-light" | "gradient-dark" | "gradient-orange"
  glow?: boolean
  className?: string
  containerClassName?: string
  backdrop?: React.ReactNode
  theme: "dark" | "light"
}) {
  return (
    <section
      id={id}
      className={cx(
        "relative scroll-mt-28 py-16 sm:py-20 lg:py-32",
        variant === "surface" && (theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"),
        variant === "gradient-light" && (theme === "dark" ? "bg-gradient-to-b from-[#0A0A0A] to-[#151515]" : "bg-gradient-to-b from-white to-slate-50"),
        variant === "gradient-dark" && (theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-gradient-to-b from-slate-50 to-orange-50"),
        variant === "gradient-orange" && (theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-gradient-to-b from-orange-50 via-orange-100/30 to-slate-50"),
        variant === "black" && (theme === "dark" ? "bg-black" : "bg-slate-900"),
        !!backdrop && "overflow-hidden",
        className
      )}
    >
      {backdrop && <div className="absolute inset-0 z-0">{backdrop}</div>}
      {glow && (
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className={`h-[3px] w-[200px] bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_20px_rgba(249,115,22,0.5)]`} />
        </div>
      )}
      <div className={cx(CONTAINER, "relative z-10", containerClassName)}>{children}</div>
    </section>
  )
}

/** Eyebrow + title (+ optional subtitle) with one consistent scale. */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
  theme,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: "center" | "left"
  className?: string
  theme?: "dark" | "light"
}) {
  return (
    <div
      className={cx(
        "mb-10 sm:mb-14 lg:mb-20",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      <p className={cx(EYEBROW, "mb-3 tracking-[0.12em]")}>{eyebrow}</p>
      <h2 className="text-[22px] sm:text-[28px] font-semibold leading-tight tracking-tight md:text-[32px] lg:text-[38px]">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 sm:mt-4 text-[14px] sm:text-[15px] leading-relaxed tracking-wide ${theme === "dark" ? "text-white/55" : "text-slate-500"}`}>{subtitle}</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Header({
  scrolled,
  mobileOpen,
  setMobileOpen,
  productsOpen,
  setProductsOpen,
  getStartedOpen,
  setGetStartedOpen,
  toast,
  theme,
  toggleTheme,
}: {
  scrolled: boolean
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  productsOpen: boolean
  setProductsOpen: (v: boolean) => void
  getStartedOpen: boolean
  setGetStartedOpen: (v: boolean) => void
  toast: any
  theme: "dark" | "light"
  toggleTheme: () => void
}) {
  const { user, signOut } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const getStartedRef = useRef<HTMLDivElement>(null)
  const isAuthenticated = !!user
  const userType = user?.user_type || 'tenant'

  const dashboardUrl = userType === 'admin' ? '/admin' : userType === 'landlord' ? '/landlord/overview' : '/tenant'

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('')
    : user?.email?.[0]?.toUpperCase() || 'U'

  const handleProductClick = (product: any) => {
    if (product.isComingSoon) {
      toast({
        title: "Coming Soon",
        description: "PropFlow AI Agent is launching soon!",
      })
    } else {
      window.location.href = product.href
    }
  }

  const handleLogout = () => {
    signOut().catch(() => {
      window.location.href = '/'
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsOpen(false)
      }
    }

    if (productsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    if (getStartedOpen) {
      const handleClickOutsideGS = (event: MouseEvent) => {
        if (getStartedRef.current && !getStartedRef.current.contains(event.target as Node)) {
          setGetStartedOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutsideGS)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('mousedown', handleClickOutsideGS)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [productsOpen, setProductsOpen, getStartedOpen, setGetStartedOpen])

  return (
    <header
      className={cx(
        "backdrop-blur-md transition-all duration-300",
        scrolled
          ? theme === "dark"
            ? "bg-black/95 py-3.5 md:py-4 shadow-lg shadow-black/40"
            : "bg-white/95 py-3.5 md:py-4 shadow-lg shadow-slate-200"
          : "bg-transparent py-4 md:py-6"
      )}
    >
      <div className={cx(CONTAINER, "flex items-center justify-between")}>
        <Link href="/">
          <div className="h-8 w-auto md:h-auto">
            <Logo size={50} variant={theme === "dark" ? "light" : "default"} />
          </div>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-base font-semibold transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90" : "text-slate-900"}`}
            >
              {l.label}
            </a>
          ))}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProductsOpen(!productsOpen)}
              className={`text-base font-semibold transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90" : "text-slate-900"}`}
            >
              Products
              <ChevronDown className={cx("ml-1 inline h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
            </button>
            {productsOpen && (
              <div className={`absolute top-full left-0 mt-2 w-64 rounded-lg border backdrop-blur-md shadow-xl ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
                {NAV_PRODUCTS.map((product) => (
                  <button
                    key={product.label}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className={`w-full px-4 py-3 text-left transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                  >
                    <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{product.label}</div>
                    <div className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>{product.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full p-2 transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90 hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"}`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                    <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                      <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className={`text-sm font-medium leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className={`text-xs leading-tight mt-0.5 ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>
                        {userType === 'admin' ? 'Administrator' : userType === 'landlord' ? 'Property Manager' : 'Tenant'}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 hidden lg:block transition-transform ${theme === "dark" ? "text-white/60" : "text-slate-500"}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-60 z-[150] rounded-lg border shadow-xl ${theme === "dark" ? "border-white/10 bg-[#0A0A0A]" : "border-slate-200 bg-white"}`}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className={`text-xs font-normal ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                        {user?.email || 'No email'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardUrl} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                      <LayoutGrid className="h-4 w-4 text-orange-400" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={userType === 'landlord' ? '/landlord/profile' : '/tenant/profile'} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                      <User className="h-4 w-4 text-orange-400" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                  <DropdownMenuItem onClick={handleLogout} className={`cursor-pointer flex items-center gap-2.5 text-red-500 focus:text-red-500 ${theme === "dark" ? "focus:bg-red-500/10" : "focus:bg-red-50"}`}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </nav>

        {!isAuthenticated && (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin">
              <Button className={cx(BTN_OUTLINE, "px-6 py-3 text-base font-semibold")}>
                Login
              </Button>
            </Link>
            <div className="relative" ref={getStartedRef}>
              <button
                type="button"
                onClick={() => setGetStartedOpen(!getStartedOpen)}
                className={cx(BTN_PRIMARY, "flex items-center gap-1.5 px-7 py-3 text-base font-semibold")}
              >
                Get Started
                <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", getStartedOpen && "rotate-180")} />
              </button>
              {getStartedOpen && (
                <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
                  {NAV_GET_STARTED.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setGetStartedOpen(false)}
                      className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                    >
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                        {item.icon === "home" && <Home className="h-4.5 w-4.5 text-orange-400" />}
                        {item.icon === "building" && <Building2 className="h-4.5 w-4.5 text-orange-400" />}
                        {item.icon === "trending" && <TrendingUp className="h-4.5 w-4.5 text-orange-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                        <div className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{item.description}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          className={`md:hidden ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* mobile dropdown */}
      {mobileOpen && (
        <div className={`border-t backdrop-blur-md md:hidden ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
          <nav className={cx(CONTAINER, "flex flex-col py-4")}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`py-2 text-sm font-medium transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}
              >
                {l.label}
              </a>
            ))}
            <div className={`border-t pt-2 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className={`flex w-full items-center justify-between py-2 text-sm font-medium transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}
              >
                Products
                <ChevronDown className={cx("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
              </button>
              {productsOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {NAV_PRODUCTS.map((product) => (
                    <button
                      key={product.label}
                      type="button"
                      onClick={() => {
                        handleProductClick(product)
                        setMobileOpen(false)
                      }}
                      className={`block w-full py-2 text-left text-sm transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}
                    >
                      <div className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{product.label}</div>
                      <div className="text-xs">{product.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isAuthenticated ? (
              <>
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="mt-2">
                  <Button className={cx(BTN_OUTLINE, "w-full text-sm font-medium")}>
                    Login
                  </Button>
                </Link>
                <div className={`border-t pt-2 mt-2 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                  <button
                    type="button"
                    onClick={() => setGetStartedOpen(!getStartedOpen)}
                    className={`flex w-full items-center justify-between py-2 text-sm font-semibold transition-colors ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                  >
                    Get Started
                    <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", getStartedOpen && "rotate-180")} />
                  </button>
                  {getStartedOpen && (
                    <div className="mt-1 space-y-1 pl-0">
                      {NAV_GET_STARTED.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-500/10">
                            {item.icon === "home" && <Home className="h-4 w-4 text-orange-400" />}
                            {item.icon === "building" && <Building2 className="h-4 w-4 text-orange-400" />}
                            {item.icon === "trending" && <TrendingUp className="h-4 w-4 text-orange-400" />}
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                            <div className={`text-xs ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{item.description}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center gap-3 p-3 rounded-lg mt-2 ${theme === "dark" ? "bg-white/5" : "bg-slate-100"}`}>
                  <Avatar className="h-10 w-10 border-2 border-orange-500/30">
                    <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {user?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                      {userType === 'admin' ? 'Administrator' : userType === 'landlord' ? 'Property Manager' : 'Tenant'}
                    </p>
                  </div>
                </div>
                <Link href={dashboardUrl} onClick={() => setMobileOpen(false)} className="mt-2">
                  <Button className={cx(BTN_PRIMARY, "w-full text-sm font-medium")}>
                    Dashboard
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    setMobileOpen(false)
                  }}
                  className="mt-2 w-full"
                >
                  <Button className={cx(BTN_OUTLINE, "w-full text-sm font-medium")}>
                    Sign Out
                  </Button>
                </button>
              </>
            )}
            {/* Mobile theme toggle */}
            <div className={`flex items-center justify-between border-t pt-3 mt-3 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
              <span className={`text-xs font-medium ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${theme === "dark" ? "text-white/80 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium">Switch to Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium">Switch to Dark</span>
                  </>
                )}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function StoryCard({
  icon: Icon,
  title,
  body,
  theme,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  theme: "dark" | "light"
}) {
  return (
    <div className={cx(getCardClass(theme), "p-6 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5")}>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
          <Icon className="h-5 w-5 text-orange-400" />
        </div>
        <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{title}</h3>
      </div>
      <p className={`text-[15px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-600"}`}>{body}</p>
    </div>
  )
}

function CollapsibleStoryCard({
  icon: Icon,
  title,
  body,
  theme,
  defaultOpen = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  theme: "dark" | "light"
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cx(getCardClass(theme), "overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5")}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 p-6 text-left transition-colors"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
          <Icon className="h-5 w-5 text-orange-400" />
        </div>
        <h3 className={`flex-1 text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{title}</h3>
        <ChevronDown
          className={cx(
            "h-5 w-5 flex-shrink-0 text-orange-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cx(
          "grid transition-all duration-300",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden px-6 pb-6">
          <p className={`text-[15px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-600"}`}>{body}</p>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  icon: Icon,
  tag,
  title,
  body,
  cta,
  href,
  isComingSoon,
  toast,
  theme,
}: {
  icon: React.ComponentType<{ className?: string }>
  tag: string
  title: string
  body: string
  cta: string
  href: string
  isComingSoon?: boolean
  toast?: any
  theme: "dark" | "light"
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (isComingSoon && toast) {
      e.preventDefault()
      toast({
        title: "Coming Soon",
        description: "PropFlow AI Agent is launching soon!",
      })
    }
  }

  return (
    <div className={cx(
      getCardClass(theme), getCardHoverClass(),
      "group relative flex h-full flex-col overflow-hidden p-5 sm:p-6 lg:p-7 transition-all duration-300",
      "after:absolute after:inset-x-0 after:top-0 after:h-[2px] after:rounded-t-2xl after:bg-orange-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300",
      "hover:after:scale-x-100"
    )}>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25">
        <Icon className="h-5 w-5 text-orange-400" />
      </div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400/70">
        {tag}
      </p>
      <h3 className={`mb-3 text-[17px] font-semibold leading-snug ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{title}</h3>
      <p className={`mb-6 flex-1 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{body}</p>
      <Link
        href={href}
        onClick={handleClick}
        className="inline-flex items-center text-[13px] font-semibold text-orange-400 transition-colors hover:text-orange-300"
      >
        {cta}
        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

function ContactBlock({
  icon: Icon,
  title,
  children,
  theme,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  theme: "dark" | "light"
}) {
  return (
    <div>
      <h3 className={`mb-2 flex items-center gap-2 text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
        <Icon className="h-5 w-5 text-orange-400" />
        {title}
      </h3>
      <p className={`text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>{children}</p>
    </div>
  )
}


























































