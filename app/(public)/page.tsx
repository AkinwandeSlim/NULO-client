"use client"

/**
 * NuloAfrica — Landing Page (NEST-First Investor Focus)
 * ------------------------------------------------------------------
 * Series A-ready landing page optimizing for NEST (fractional real 
 * estate investment) as primary conversion, with rental marketplace 
 * and property management as secondary products.
 * 
 * Architecture:
 *   - Hero: Centered layout with building image as transparent background
 *   - 11 sections total, NEST-focused narrative
 *   - CEO Letter + Founders moved to /about
 *   - Full FAQ moved to /faq
 *   - Contact form moved to /contact
 * 
 * Target: VCs, institutional investors, high-net-worth individuals
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ParticleNetwork } from "@/components/home/ParticleNetwork"
import MarqueeTicker from "@/components/MarqueeTicker"
import { TICKER_DATA } from "@/data/content"
import { FeaturedPropertiesSection } from "@/components/home/FeaturedPropertiesSection"
import { Footer } from "@/components/footer"
import { WelcomeModal } from "@/components/home/WelcomeModal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"

// Separated base and color for dynamic theming
const EYEBROW_BASE = "text-[13px] font-medium uppercase tracking-[0.18em]"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/60 bg-white shadow-[0_10px_40px_-15px_rgba(15,23,42,0.08)]"}`
  
const getCardHoverClass = (theme: "dark" | "light") =>
  `transition-all duration-300 hover:-translate-y-1 ${theme === "dark" ? "hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5" : "hover:border-orange-500/40 hover:shadow-[0_20px_50px_-15px_rgba(249,115,22,0.15)]"}`

const BTN_PRIMARY =
  "rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25"

// Made theme-aware for proper contrast
const BTN_OUTLINE = (theme: "dark" | "light") =>
  `rounded-lg border font-semibold transition-all duration-200 ${
    theme === "dark"
      ? "border-orange-500/70 bg-transparent text-orange-400 hover:bg-orange-500 hover:border-orange-500 hover:text-black"
      : "border-orange-500 bg-white text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
  }`

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WAITLIST_URL = "https://nest-by-nulo.vercel.app/"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "NEST", href: "#nest" },
  { label: "Featured", href: "#featured" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
]

const NAV_PRODUCTS = [
  { label: "Rental Marketplace", href: "/properties", description: "For Tenants" },
  { label: "Property Management", href: "/landlord", description: "For Property Managers" },
  { label: "NEST", href: WAITLIST_URL, description: "For Investors" },
]

const NAV_GET_STARTED = [
  { label: "I'm looking for a property", href: "/signup/tenant", description: "Tenant — Find & rent verified homes", icon: "home" as const },
  { label: "I'm listing properties", href: "/signup/landlord", description: "Landlord — Manage your portfolio", icon: "building" as const },
  { label: "I want to invest", href: WAITLIST_URL, description: "Investor — Co-own via NEST", icon: "trending" as const },
]

// The Ecosystem — 3 products (NEST dominant)
const PRODUCTS = [
  {
    icon: Users,
    tag: "NEST — Launching Soon",
    title: "Co-Own High-Yield Rentals",
    body: "Pool funds with other investors through NEST to acquire premium rental properties. We manage everything; you earn your share of the rent monthly.",
    cta: "Join the Waitlist",
    href: WAITLIST_URL,
    dominant: true,
  },
  {
    icon: Search,
    tag: "Rental Marketplace",
    title: "Find Verified Homes",
    body: "Search verified rentals across Lagos, Abuja, and Port Harcourt. Filter by budget, book viewings, and apply — all in one place.",
    cta: "Browse Properties",
    href: "/properties",
  },
  {
    icon: LayoutDashboard,
    tag: "Property Management",
    title: "Manage Your Portfolio",
    body: "List properties, screen applicants, sign digital agreements, and collect rent. A complete workspace built for African landlords.",
    cta: "Open Dashboard",
    href: "/landlord",
  },
]

// Conviction cards (Vision, Mission, Values)
const CONVICTION_CARDS = [
  {
    icon: Eye,
    title: "Our Vision",
    body: "A future where every African has a trusted pathway to secure housing, build wealth, and participate in the continent's real estate economy.",
  },
  {
    icon: Target,
    title: "Our Mission",
    body: "Leverage technology, data, and innovative financing to make housing accessible, transparent, and inclusive across Africa.",
  },
  {
    icon: ShieldCheck,
    title: "Our Values",
    body: "Trust first. Verified always. Built for the way Africans live, work, and invest — with people at the center.",
  },
]

// NEST Investor Journey — 4 steps
const STEPS = [
  {
    num: "01",
    title: "Discover",
    body: "Browse verified properties across Nigeria's fastest-growing markets — selected for high yields and strong tenant demand.",
  },
  {
    num: "02",
    title: "Pool Funds",
    body: "Join with other investors to co-own premium rentals. Start with an amount that works for your budget.",
  },
  {
    num: "03",
    title: "We Manage",
    body: "NuloAfrica handles acquisition, tenant sourcing, maintenance, rent collection, and all property operations.",
  },
  {
    num: "04",
    title: "You Earn",
    body: "Receive your proportional share of rental income every month, plus benefit from long-term property appreciation.",
  },
]

// Hero inline stats
const STATS = [
  { value: "21+", label: "Verified Properties" },
  { value: "< 24h", label: "Response Time" },
  { value: "95%", label: "Landlord Verification" },
  { value: "3", label: "Cities & Growing" },
]

// Testimonials (lead with investment)
const TESTIMONIALS = [
  {
    quote:
      "I was skeptical about co-owning property, but the NEST model made it simple. The plans are affordable and the locations are prime.",
    author: "Fatima Musa",
    city: "Abuja",
  },
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
      "Verified listings meant no wasted trips and no scams. What I saw online is exactly what I moved into. That trust is rare here.",
    author: "Emeka Nwosu",
    city: "Port Harcourt",
  },
]

// FAQ (3 questions only, link to /faq)
const FAQS = [
  {
    q: "What is NEST and how does it work?",
    a: "NEST (Nulo Equity Share Trust) lets you pool funds with other investors to acquire high-yield rental properties. Nulo Africa handles acquisition, tenant sourcing, maintenance, and rent collection, and you receive your proportional share of the rent every month. NEST is currently in early access — join the waitlist to be notified at launch.",
  },
  {
    q: "How do you verify properties and landlords?",
    a: "Our team personally verifies every listing and runs background checks on landlords before they can publish. This keeps the marketplace free of scams and ensures what you see online matches reality.",
  },
  {
    q: "How do I get started?",
    a: "Join the NEST waitlist to co-invest, browse the marketplace to rent, or open the dashboard to manage properties. Getting started takes just a few minutes.",
  },
]

/* Inline brand social icons */
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
  const [activeSection, setActiveSection] = useState<string>('home')
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()

  const carouselRef = useRef<HTMLDivElement>(null)

  // Prevent hydration flashes
  useEffect(() => {
    setMounted(true)
    // Restore the body background from the dark pre-load color to the
    // correct theme color now that React has hydrated and the hero image
    // has started loading. This removes the dark flash on non-landing pages.
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#FCFBF9"
    return () => {
      // Always reset to transparent when leaving so other pages get their own bg
      document.body.style.backgroundColor = ""
    }
  }, [])

  // Sticky header + scroll-to-top visibility + section detection
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      setShowTop(y > 500)

      // Detect active section based on scroll position
      const heroSection = document.getElementById('hero')
      const featuredSection = document.getElementById('featured')
      const nestSection = document.getElementById('nest')

      const offset = 150 // Offset from top to trigger section change

      if (heroSection && y < (heroSection.offsetHeight - offset)) {
        setActiveSection('home')
      } else if (featuredSection && y >= (featuredSection.offsetTop - offset) && y < (featuredSection.offsetTop + featuredSection.offsetHeight - offset)) {
        setActiveSection('featured')
      } else if (nestSection && y >= (nestSection.offsetTop - offset)) {
        setActiveSection('nest')
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Body background + remove global navbar padding
  useEffect(() => {
    document.body.classList.remove("has-navbar")
    document.body.style.paddingTop = "0"
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#FCFBF9"
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={cx("flex min-h-screen flex-col font-sans antialiased", theme === "dark" ? "text-white bg-black" : "text-slate-900 bg-[#FCFBF9]")}>
      {/* Brand styles */}
      <style jsx global>{`
        body {
          background-color: ${theme === "dark" ? "#000000" : "#FCFBF9"} !important;
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
            ? "linear-gradient(to right, #000000 56%, rgba(0,0,0,0.7) 80%)"
            : "linear-gradient(to right, #FCFBF9 56%, rgba(252,251,249,0.7) 80%)"};
        }
        .nulo-hero-img-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 28%, black 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 28%, black 100%);
        }
        .nulo-stat-divider {
          width: 1px;
          background: ${theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)"};
        }
        .nulo-noscroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Sticky top bar: rental-status ticker + primary nav */}
      <div className={cx("sticky top-0 z-50", theme === "dark" ? "bg-black" : "bg-[#FCFBF9]")}>
        <div className={cx("w-full border-b backdrop-blur-sm", theme === "dark" ? "border-orange-500/20 bg-black/60" : "border-slate-200 bg-[#FCFBF9]/80")}>
          <MarqueeTicker items={TICKER_DATA} speed={40} theme={theme} />
        </div>
        <Header scrolled={scrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} productsOpen={productsOpen} setProductsOpen={setProductsOpen} getStartedOpen={getStartedOpen} setGetStartedOpen={setGetStartedOpen} toast={toast} theme={theme} toggleTheme={toggleTheme} activeSection={activeSection} />
      </div>

      <main className="flex-1">
        {/* ======================= HERO (Cinematic Centered Layout) ======================= */}
        <section
          id="hero"
          className="relative z-[1] flex w-full flex-col items-center justify-center overflow-hidden text-center"
          style={{ minHeight: "90vh", backgroundColor: theme === "dark" ? "#000000" : "#1e293b" }}
        >
          {/* Background building image with transparency */}
          <div className="absolute inset-0 z-0">
            <img
              src="/bg/sean-pollock-PhYq704ffdA-unsplash.jpg"
              alt="Premium real estate"
              fetchPriority="high"
              decoding="sync"
              className={cx("h-full w-full object-cover object-center", theme === "dark" ? "opacity-15" : "opacity-100")}
            />
            {/* Light theme: Cinematic dark gradient overlay so image pops & white text is highly legible */}
            {theme === "light" && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-black/85" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15),_transparent_60%)]" />
              </>
            )}
            {/* Dark theme subtle overlay */}
            {theme === "dark" && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
            )}
          </div>

          {/* Orange diagonal slash triangle (bottom left) - over image, under particles */}
          <div className="absolute bottom-0 left-0 z-[1] pointer-events-none w-full md:w-[55%] lg:w-[50%] h-24 sm:h-32 md:h-40">
            <svg
              viewBox="0 0 100 25"
              preserveAspectRatio="none"
              className="w-full h-full block"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0,0 L 0,25 L 100,25 Z"
                fill="#f97316"
                opacity={theme === "dark" ? 0.8 : 0.6}
              />
            </svg>
          </div>

          {/* Particle network on top of everything */}
          <div className="absolute inset-0 z-[2]">
            <ParticleNetwork />
          </div>

          {/* Content constrained for readability */}
          <div className={cx(CONTAINER, "relative z-10 pt-8 pb-24")}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mx-auto max-w-3xl"
            >
              {/* Eyebrow pill with pulsing dot */}
              <div className={cx("mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-sm", theme === "dark" ? "border-orange-500/20 bg-orange-500/5" : "border-white/20 bg-white/10 text-orange-300")}>
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className={cx(EYEBROW_BASE, "text-[11px] sm:text-[12px]", theme === "dark" ? "text-orange-400" : "text-orange-300")}>Africa&apos;s Trusted Housing Ecosystem</span>
              </div>

              {/* Headline — Terver's exact words */}
              <h1 className="mb-5 sm:mb-6 text-[32px] sm:text-[42px] font-bold leading-[1.15] tracking-tight md:text-[48px] lg:text-[54px] text-white">
                Reimagining Housing Access.
                <br />
                <span className="nulo-gradient-text">Unlocking Wealth Creation.</span>
              </h1>

              {/* Subheadline — Terver's exact words */}
              <p className="mx-auto mb-8 sm:mb-10 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-slate-300">
                Nulo Africa is building Africa&apos;s trusted housing ecosystem — making it easier to rent, manage, invest in, and own real estate through one connected digital platform.
              </p>

              {/* CTAs — NEST first */}
              <div className="flex flex-col items-stretch justify-center gap-3 sm:items-center sm:flex-row sm:gap-4 mb-10">
                <Link href={WAITLIST_URL} className="sm:inline-flex">
                  <Button className={cx(BTN_PRIMARY, "group w-full sm:w-auto px-8 py-4 text-[15px] hover:-translate-y-0.5 shadow-lg shadow-orange-500/25")}>
                    Join the NEST Waitlist
                    <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/properties" className="sm:inline-flex">
                  <Button variant="outline" className={cx(BTN_OUTLINE(theme), "w-full sm:w-auto px-8 py-4 text-[15px] hover:-translate-y-0.5")}>
                    Explore the Platform
                  </Button>
                </Link>
              </div>

              {/* Inline Stats Row — centered */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                {STATS.map((stat, index) => (
                  <div key={stat.label} className="flex items-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <div className="text-[28px] sm:text-[32px] font-bold text-orange-400 leading-none mb-1.5">{stat.value}</div>
                      <div className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.1em] text-slate-400">
                        {stat.label}
                      </div>
                    </div>
                    {index < STATS.length - 1 && <div className="nulo-stat-divider h-12" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================= WHO WE ARE (Terver's prose) ======================= */}
        <Section id="about" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid items-start gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {/* Left — Terver's prose (5 paragraphs) */}
            <div>
              <p className={cx(EYEBROW_BASE, theme === "dark" ? "text-orange-400" : "text-orange-600", "mb-3")}>Who We Are</p>
              <h2 className={cx("mb-5 sm:mb-6 text-[24px] sm:text-[30px] font-bold leading-tight lg:text-[38px]", theme === "dark" ? "text-white" : "text-slate-900")}>
                Building Africa&apos;s{" "}
                <span className="nulo-gradient-text">Trusted Housing Ecosystem</span>
              </h2>
              <div className={cx("space-y-4 text-[14px] sm:text-[15px] leading-relaxed", theme === "dark" ? "text-white/65" : "text-slate-600")}>
                <p>
                  Housing is more than shelter — it&apos;s one of the greatest drivers of financial security, opportunity, and generational wealth.
                </p>
                <p>
                  Yet millions of Africans face barriers to renting, owning, and investing in real estate.
                </p>
                <p>
                  At Nulo Africa, we&apos;re changing that.
                </p>
                <p>
                  Through technology, trusted data, and innovative financing models, we&apos;re creating a connected ecosystem that makes housing more accessible and wealth creation more inclusive.
                </p>
                <p className={cx("font-medium", theme === "dark" ? "text-orange-400" : "text-orange-600")}>
                  Because we believe the future of housing isn&apos;t just about building more homes. It&apos;s about giving more people the opportunity to benefit from them.
                </p>
              </div>
            </div>

            {/* Right — Conviction cards (flat, always visible) */}
            <div className="grid gap-5">
              {CONVICTION_CARDS.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className={cx(
                    getCardClass(theme),
                    getCardHoverClass(theme),
                    "flex items-start gap-4 p-5 sm:p-6"
                  )}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <card.icon className={cx("h-5 w-5", theme === "dark" ? "text-orange-400" : "text-orange-600")} />
                  </div>
                  <div>
                    <h3 className={cx("mb-2 text-[16px] font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>{card.title}</h3>
                    <p className={cx("text-[13px] sm:text-[14px] leading-relaxed", theme === "dark" ? "text-white/50" : "text-slate-500")}>{card.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= THE ECOSYSTEM (3 products, NEST dominant) ======================= */}
        <Section id="ecosystem" variant="gradient-dark" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="The Ecosystem"
              title={<>Infrastructure That Powers Your <span className="nulo-gradient-text">Investment</span></>}
              subtitle="Three connected products — one platform. Start with NEST to co-invest, or explore rentals and property management."
              theme={theme}
            />

            {/* NEST gets full-width feature card above 2-column grid */}
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <ProductCard
                  icon={PRODUCTS[0].icon}
                  tag={PRODUCTS[0].tag}
                  title={PRODUCTS[0].title}
                  body={PRODUCTS[0].body}
                  cta={PRODUCTS[0].cta}
                  href={PRODUCTS[0].href}
                  theme={theme}
                  dominant={true}
                />
              </motion.div>
            </div>

            {/* Rental + Property Management in 2-column grid */}
            <div className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-2">
              {PRODUCTS.slice(1).map((p, index) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (index + 1) * 0.1, ease: "easeOut" }}
                >
                  <ProductCard
                    icon={p.icon}
                    tag={p.tag}
                    title={p.title}
                    body={p.body}
                    cta={p.cta}
                    href={p.href}
                    theme={theme}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= NEST DEEP DIVE (centerpiece) ======================= */}
        <Section
          id="nest"
          variant="gradient-dark"
          backdrop={
            <>
              <div className={cx("absolute inset-0 bg-gradient-to-br", theme === "dark" ? "from-[#1a0a02] via-black to-[#2a1206]" : "from-orange-50/40 via-[#FCFBF9] to-[#F4F2EF]")} />
              <div className={cx("absolute inset-0", theme === "dark" ? "bg-black/60" : "bg-[#FCFBF9]/40")} />
            </>
          }
          glow
          theme={theme}
          className="py-24 sm:py-32 lg:py-40"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left — Copy */}
              <div className="text-center lg:text-left">
                <p className={cx(EYEBROW_BASE, theme === "dark" ? "text-orange-400" : "text-orange-600", "mb-3")}>Introducing NEST</p>
                <h2 className={cx("mb-4 text-[28px] font-bold leading-tight sm:text-[34px] lg:text-[40px]", theme === "dark" ? "text-white" : "text-slate-900")}>
                  Co-Own <span className="nulo-gradient-text">High-Yield</span> African Real Estate
                </h2>
                <div className={cx("mx-auto mb-8 max-w-xl space-y-4 text-[14px] sm:text-[15px] leading-relaxed lg:mx-0", theme === "dark" ? "text-white/65" : "text-slate-600")}>
                  <p>
                    NEST (Nulo Equity Share Trust) lets you pool funds with other investors to acquire premium rentals across Africa&apos;s fastest-growing markets.
                  </p>
                  <p>
                    We manage everything — acquisition, tenants, maintenance, rent collection — and you simply receive your proportional share of the rent every month, plus benefit from long-term property appreciation.
                  </p>
                  <p className={cx("font-medium", theme === "dark" ? "text-orange-400" : "text-orange-600")}>
                    NEST is launching soon. Join the waitlist to be first in line.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href={WAITLIST_URL}>
                    <Button className={cx(BTN_PRIMARY, "group px-8 py-4 text-[15px]")}>
                      Join the NEST Waitlist
                      <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <a
                    href="https://www.instagram.com/reel/DaC7ekCtXzi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx("inline-flex items-center gap-2 text-sm font-semibold transition-colors", theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700")}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    Watch on Instagram
                  </a>
                </div>
              </div>

              {/* Right — Instagram reel (native portrait) */}
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

        {/* ======================= HOW IT WORKS (NEST investor journey) ======================= */}
        <Section id="how-it-works" variant="gradient-light" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="How It Works"
              title={<>Four Steps from Discovery to <span className="nulo-gradient-text">Ownership</span></>}
              subtitle="A simple path for co-investing in African real estate through NEST."
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
                  <div className={cx("relative flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-xl font-bold",
                    theme === "dark"
                      ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30"
                      : "bg-orange-50 text-orange-600 ring-1 ring-orange-300/60 shadow-sm shadow-orange-500/10")}>
                    {s.num}
                  </div>
                  <h3 className={cx("mb-2 mt-5 text-[16px] font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>{s.title}</h3>
                  <p className={cx("text-[13px] sm:text-[14px] leading-relaxed", theme === "dark" ? "text-white/50" : "text-slate-500")}>{s.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ======================= PLATFORM PROOF (featured properties as NEST opportunities) ======================= */}
        <Section id="featured" variant="gradient-dark" glow theme={theme}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionHeading
              eyebrow="Platform Proof"
              title={<>Properties You Could <span className="nulo-gradient-text">Co-Own Through NEST</span></>}
              subtitle="Real rentals, verified listings, and the foundation of our co-investment model. These are the properties NEST investors will benefit from."
              theme={theme}
            />
            <FeaturedPropertiesSection
              properties={featuredProperties}
              loading={loadingProperties}
              formatPrice={formatPrice}
              favorites={favorites}
              theme={theme}
            />
            <div className="mt-10 text-center">
              <Link href="/properties">
                <Button className={cx(BTN_OUTLINE(theme), "px-8 py-3.5 text-[15px]")}>
                  View All Properties
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </Section>

        {/* ======================= VIDEO DEMO ======================= */}
        <Section id="video" variant="gradient-light" glow theme={theme}>
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

            {!isVideoPlaying ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className={cx("relative mx-auto max-w-5xl cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl transition-shadow duration-300 hover:shadow-xl",
                  theme === "dark"
                    ? "bg-gradient-to-br from-[#1c1008] to-[#120a04] shadow-orange-500/5 hover:shadow-orange-500/10"
                    : "bg-gradient-to-br from-white to-slate-50 shadow-[0_15px_50px_-20px_rgba(15,23,42,0.15)] hover:shadow-[0_20px_60px_-20px_rgba(249,115,22,0.2)]"
                )}
                onClick={() => setIsVideoPlaying(true)}
              >
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

                <div className={cx("pointer-events-none absolute -right-8 -bottom-8 text-[220px] font-black leading-none select-none",
                  theme === "dark" ? "text-white/[0.02]" : "text-orange-500/[0.04]"
                )}>
                  N
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 lg:p-14">
                  <div className="flex-1 text-center sm:text-left">
                    <div className="mb-4 flex items-center justify-center sm:justify-start gap-2">
                      <div className="h-1.5 w-8 rounded-full bg-orange-500" />
                      <span className={cx("text-xs font-semibold uppercase tracking-[0.16em]", theme === "dark" ? "text-orange-400/80" : "text-orange-600")}>Platform Demo</span>
                    </div>
                    <h3 className={cx("mb-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-[34px]", theme === "dark" ? "text-white" : "text-slate-900")}>
                      See How NuloAfrica{" "}
                      <span className="nulo-gradient-text">Works for You</span>
                    </h3>
                    <p className={cx("max-w-md text-[15px] leading-relaxed", theme === "dark" ? "text-white/55" : "text-slate-500")}>
                      From searching verified rentals to managing properties and co-investing through NEST — watch the full platform experience in under two minutes.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {["Verified Listings", "Digital Agreements", "Rent Collection", "NEST Co-Ownership"].map((label) => (
                        <span
                          key={label}
                          className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            theme === "dark"
                              ? "bg-white/5 text-white/50 ring-1 ring-white/10"
                              : "bg-orange-500/5 text-orange-700/80 ring-1 ring-orange-500/10"
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center justify-center">
                    <div className="group/btn relative">
                      <div className={cx("absolute -inset-3 rounded-full transition-opacity duration-300 group-hover/btn:opacity-100 opacity-0", theme === "dark" ? "bg-orange-500/5" : "bg-orange-500/8")} />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/25 transition-all duration-300 group-hover/btn:scale-105 group-hover/btn:shadow-xl group-hover/btn:shadow-orange-500/30 sm:h-24 sm:w-24">
                        <Play className="h-8 w-8 fill-white text-white ml-1 sm:h-10 sm:w-10" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cx("relative flex items-center justify-between border-t px-6 py-3 sm:px-8 lg:px-14", theme === "dark" ? "border-white/5" : "border-slate-200")}>
                  <span className={cx("text-xs font-medium", theme === "dark" ? "text-white/30" : "text-slate-400")}>2 min watch</span>
                  <span className={cx("inline-flex items-center gap-1.5 text-xs font-semibold transition-colors", theme === "dark" ? "text-orange-400/70 group-hover:text-orange-400" : "text-orange-600/70 group-hover:text-orange-600")}>
                    Click to play
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ) : (
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
                  className={cx("absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    theme === "dark"
                      ? "bg-black/60 text-white hover:bg-black/80"
                      : "bg-white/80 text-slate-900 hover:bg-white shadow-md"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </Section>

        {/* ======================= TESTIMONIALS (lead with investment) ======================= */}
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
                    <Quote className={cx("mb-5 h-7 w-7", theme === "dark" ? "text-orange-500/40" : "text-orange-500/60")} />
                    <p className={cx("mb-6 flex-1 text-[14px] leading-relaxed", theme === "dark" ? "text-white/65" : "text-slate-600")}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[13px] font-bold text-orange-600 ring-1 ring-orange-500/25">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <div className={cx("text-sm font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>{t.author}</div>
                        <div className={cx("text-xs", theme === "dark" ? "text-white/40" : "text-slate-400")}>{t.city}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ======================= FINAL CTA STRIP ======================= */}
        <Section
          id="cta"
          variant="gradient-dark"
          backdrop={
            <>
              <div className="absolute inset-0">
                <ParticleNetwork />
              </div>
              <div className={cx("absolute inset-0", theme === "dark" ? "bg-black/70" : "bg-[#F4F2EF]/70")} />
            </>
          }
          glow
          theme={theme}
          className="py-20 sm:py-24 lg:py-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <div className={cx("mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm", theme === "dark" ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50/80 shadow-sm")}>
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className={cx(EYEBROW_BASE, theme === "dark" ? "text-orange-400" : "text-orange-600", "text-[12px]")}>Early Access</span>
            </div>

            <h2 className={cx("mb-4 text-[28px] sm:text-[36px] font-bold leading-tight lg:text-[44px]", theme === "dark" ? "text-white" : "text-slate-900")}>
              Be Among the First <span className="nulo-gradient-text">NEST Investors</span>
            </h2>

            <p className={cx("mx-auto mb-10 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed", theme === "dark" ? "text-white/60" : "text-slate-600")}>
              Early investors get priority access to premium properties and preferential terms at launch. Join the waitlist today and be part of Africa&apos;s housing revolution.
            </p>

            <div className="flex flex-col items-center gap-6">
              <Link href={WAITLIST_URL}>
                <Button className={cx(BTN_PRIMARY, "group px-10 py-4 text-[16px]")}>
                  Join the NEST Waitlist
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>

              <div className="flex items-center gap-6">
                <span className={cx("text-sm", theme === "dark" ? "text-white/40" : "text-slate-400")}>Not ready to invest?</span>
                <div className="flex items-center gap-4">
                  <Link href="/landlord" className={cx("text-sm font-semibold transition-colors", theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700")}>
                    I&apos;m a Landlord
                  </Link>
                  <span className={theme === "dark" ? "text-white/20" : "text-slate-300"}>·</span>
                  <Link href="/properties" className={cx("text-sm font-semibold transition-colors", theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700")}>
                    I&apos;m a Tenant
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ======================= FAQ (3 questions, link to /faq) ======================= */}
        <Section
          id="faq"
          containerClassName="max-w-[800px]"
          backdrop={
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/tierra-mallorca-rgJ1J8SDEAY-unsplash.jpg')" }}
              />
              <div className={cx("absolute inset-0 bg-gradient-to-b", theme === "dark" ? "from-black/70 via-black/60 to-black/80" : "from-[#FCFBF9]/95 via-[#FCFBF9]/85 to-[#F4F2EF]/95")} />
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
                  <div key={item.q} className={cx("border-b", i === 0 ? "border-t" : "", theme === "dark" ? "border-white/10" : "border-slate-200")}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className={cx("flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium transition-colors hover:text-orange-500", theme === "dark" ? "text-white" : "text-slate-800")}
                      aria-expanded={open}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={cx(
                          "h-4 w-4 flex-shrink-0 text-orange-500 transition-transform duration-300",
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
                        <p className={cx("pb-5 text-[14px] leading-relaxed", theme === "dark" ? "text-white/60" : "text-slate-500")}>{item.a}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Link to full FAQ page */}
            <div className="mt-10 text-center">
              <Link href="/faq" className={cx("inline-flex items-center gap-2 text-sm font-semibold transition-colors", theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700")}>
                View All FAQs
                <ChevronRight className="h-4 w-4" />
              </Link>
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
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

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
        // Enhanced Light Theme Alternating Backgrounds for distinct sections
        variant === "gradient-light" && (theme === "dark" ? "bg-gradient-to-b from-[#0A0A0A] to-[#151515]" : "bg-[#FCFBF9]"),
        variant === "gradient-dark" && (theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-[#F4F2EF]"),
        variant === "gradient-orange" && (theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-gradient-to-b from-orange-50/50 via-[#FCFBF9] to-[#F4F2EF]"),
        variant === "black" && (theme === "dark" ? "bg-black" : "bg-slate-900"),
        !!backdrop && "overflow-hidden",
        className
      )}
    >
      {backdrop && <div className="absolute inset-0 z-0">{backdrop}</div>}
      {glow && (
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className="h-[3px] w-[200px] bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
        </div>
      )}
      <div className={cx(CONTAINER, "relative z-10", containerClassName)}>{children}</div>
    </section>
  )
}

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
      <p className={cx(EYEBROW_BASE, theme === "dark" ? "text-orange-400" : "text-orange-600", "mb-3 tracking-[0.12em]")}>{eyebrow}</p>
      <h2 className={cx("text-[22px] sm:text-[28px] font-semibold leading-tight tracking-tight md:text-[32px] lg:text-[38px]", theme === "dark" ? "text-white" : "text-slate-900")}>
        {title}
      </h2>
      {subtitle && (
        <p className={cx("mt-3 sm:mt-4 text-[14px] sm:text-[15px] leading-relaxed tracking-wide", theme === "dark" ? "text-white/55" : "text-slate-600")}>{subtitle}</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProductCard({
  icon: Icon,
  tag,
  title,
  body,
  cta,
  href,
  theme,
  dominant = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  tag: string
  title: string
  body: string
  cta: string
  href: string
  theme: "dark" | "light"
  dominant?: boolean
}) {
  return (
    <Link href={href}>
      <div className={cx(
        getCardClass(theme), getCardHoverClass(theme),
        "group relative flex h-full flex-col overflow-hidden",
        "after:absolute after:inset-x-0 after:top-0 after:h-[2px] after:rounded-t-2xl after:bg-orange-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300",
        "hover:after:scale-x-100",
        dominant ? "p-8 sm:p-10 lg:p-12" : "p-5 sm:p-6 lg:p-7"
      )}>
        <div className={cx("mb-5 flex items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25", dominant ? "h-14 w-14" : "h-12 w-12")}>
          <Icon className={cx(theme === "dark" ? "text-orange-400" : "text-orange-600", dominant ? "h-6 w-6" : "h-5 w-5")} />
        </div>
        <p className={cx("mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]", theme === "dark" ? "text-orange-400/70" : "text-orange-600/80")}>
          {tag}
        </p>
        <h3 className={cx("mb-3 font-semibold leading-snug", dominant ? "text-[20px] sm:text-[22px]" : "text-[17px]", theme === "dark" ? "text-white" : "text-slate-900")}>{title}</h3>
        <p className={cx("mb-6 flex-1 leading-relaxed", dominant ? "text-[15px]" : "text-[14px]", theme === "dark" ? "text-white/50" : "text-slate-500")}>{body}</p>
        <div className={cx("inline-flex items-center text-[13px] font-semibold transition-colors", theme === "dark" ? "text-orange-400 group-hover:text-orange-300" : "text-orange-600 group-hover:text-orange-700")}>
          {cta}
          <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

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
  activeSection,
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
  activeSection: string
}) {
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const getStartedRef = useRef<HTMLDivElement>(null)
  const isAuthenticated = !!user
  const userType = user?.user_type || 'tenant'

  const dashboardUrl = userType === 'admin' ? '/admin' : userType === 'landlord' ? '/landlord/overview' : '/tenant'

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('')
    : user?.email?.[0]?.toUpperCase() || 'U'

  const handleLogout = () => {
    signOut().catch(() => {
      window.location.href = '/'
    })
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
            : "bg-[#FCFBF9]/95 py-3.5 md:py-4 shadow-lg shadow-slate-200/60"
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
          {NAV_LINKS.map((l) => {
            // Determine if link is active based on section or route
            let isActive = false
            
            if (l.href === '/') {
              isActive = activeSection === 'home'
            } else if (l.href === '#featured') {
              isActive = activeSection === 'featured'
            } else if (l.href === '#nest') {
              isActive = activeSection === 'nest'
            }
            
            return (
              <a
                key={l.href}
                href={l.href}
                className={cx(
                  "relative text-base font-semibold transition-colors hover:text-orange-500",
                  isActive ? "text-orange-500" : theme === "dark" ? "text-white/90" : "text-slate-900",
                  isActive && "after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-[2px] after:bg-orange-500 after:rounded-full"
                )}
              >
                {l.label}
              </a>
            )
          })}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProductsOpen(!productsOpen)}
              className={cx("text-base font-semibold transition-colors hover:text-orange-500", theme === "dark" ? "text-white/90" : "text-slate-900")}
            >
              Products
              <ChevronDown className={cx("ml-1 inline h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
            </button>
            {productsOpen && (
              <div className={cx("absolute top-full left-0 mt-2 w-64 rounded-lg border backdrop-blur-md shadow-xl", theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95 shadow-slate-300/50")}>
                {NAV_PRODUCTS.map((product) => (
                  <a
                    key={product.label}
                    href={product.href}
                    className={cx("block px-4 py-3 transition-colors", theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50")}
                  >
                    <div className={cx("text-sm font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>{product.label}</div>
                    <div className={cx("text-xs", theme === "dark" ? "text-white/60" : "text-slate-500")}>{product.description}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={cx("rounded-full p-2 transition-colors hover:text-orange-500", theme === "dark" ? "text-white/90 hover:bg-white/10" : "text-slate-900 hover:bg-slate-100")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {mounted && isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cx("flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors", theme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100")}>
                    <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                      <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className={cx("text-sm font-medium leading-tight", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className={cx("text-xs leading-tight mt-0.5", theme === "dark" ? "text-white/60" : "text-slate-500")}>
                        {userType === 'admin' ? 'Administrator' : userType === 'landlord' ? 'Property Manager' : 'Tenant'}
                      </p>
                    </div>
                    <ChevronDown className={cx("h-4 w-4 hidden lg:block transition-transform", theme === "dark" ? "text-white/60" : "text-slate-500")} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cx("w-60 z-[150] rounded-lg border shadow-xl", theme === "dark" ? "border-white/10 bg-[#0A0A0A]" : "border-slate-200 bg-white shadow-slate-300/50")}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className={cx("text-sm font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className={cx("text-xs font-normal", theme === "dark" ? "text-white/50" : "text-slate-500")}>
                        {user?.email || 'No email'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardUrl} className={cx("cursor-pointer flex items-center gap-2.5", theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900")}>
                      <LayoutGrid className="h-4 w-4 text-orange-500" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={userType === 'landlord' ? '/landlord/profile' : '/tenant/profile'} className={cx("cursor-pointer flex items-center gap-2.5", theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900")}>
                      <User className="h-4 w-4 text-orange-500" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                  <DropdownMenuItem onClick={handleLogout} className={cx("cursor-pointer flex items-center gap-2.5 text-red-500 focus:text-red-500", theme === "dark" ? "focus:bg-red-500/10" : "focus:bg-red-50")}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </nav>

        {mounted && !isAuthenticated && (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin">
              <Button className={cx(BTN_OUTLINE(theme), "px-6 py-3 text-base font-semibold")}>
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
                <div className={cx("absolute top-full right-0 mt-2 w-72 rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden", theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95 shadow-slate-300/50")}>
                  {NAV_GET_STARTED.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setGetStartedOpen(false)}
                      className={cx("flex items-start gap-3.5 px-4 py-3.5 transition-colors", theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50")}
                    >
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                        {item.icon === "home" && <Home className="h-4.5 w-4.5 text-orange-500" />}
                        {item.icon === "building" && <Building2 className="h-4.5 w-4.5 text-orange-500" />}
                        {item.icon === "trending" && <TrendingUp className="h-4.5 w-4.5 text-orange-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className={cx("text-sm font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>{item.label}</div>
                        <div className={cx("text-xs mt-0.5", theme === "dark" ? "text-white/50" : "text-slate-500")}>{item.description}</div>
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
          className={cx("md:hidden", theme === "dark" ? "text-white" : "text-slate-900")}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* mobile dropdown */}
      {mobileOpen && (
        <div className={cx("border-t backdrop-blur-md md:hidden", theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-[#FCFBF9]/95")}>
          <nav className={cx(CONTAINER, "flex flex-col py-4")}>
            {NAV_LINKS.map((l) => {
              // Determine if link is active based on section or route
              let isActive = false
              
              if (l.href === '/') {
                isActive = activeSection === 'home'
              } else if (l.href === '#featured') {
                isActive = activeSection === 'featured'
              } else if (l.href === '#nest') {
                isActive = activeSection === 'nest'
              }
              
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    "py-2 text-sm font-medium transition-colors hover:text-orange-500",
                    isActive ? "text-orange-500 font-semibold" : theme === "dark" ? "text-white/80" : "text-slate-700"
                  )}
                >
                  {l.label}
                </a>
              )
            })}
            <div className={cx("border-t pt-2", theme === "dark" ? "border-white/10" : "border-slate-200")}>
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className={cx("flex w-full items-center justify-between py-2 text-sm font-medium transition-colors hover:text-orange-500", theme === "dark" ? "text-white/80" : "text-slate-700")}
              >
                Products
                <ChevronDown className={cx("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
              </button>
              {productsOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {NAV_PRODUCTS.map((product) => (
                    <a
                      key={product.label}
                      href={product.href}
                      onClick={() => setMobileOpen(false)}
                      className={cx("block w-full py-2 text-left text-sm transition-colors hover:text-orange-500", theme === "dark" ? "text-white/60" : "text-slate-600")}
                    >
                      <div className={cx("font-medium", theme === "dark" ? "text-white" : "text-slate-900")}>{product.label}</div>
                      <div className="text-xs">{product.description}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            {mounted && !isAuthenticated ? (
              <>
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="mt-2">
                  <Button className={cx(BTN_OUTLINE(theme), "w-full text-sm font-medium")}>
                    Login
                  </Button>
                </Link>
                <div className={cx("border-t pt-2 mt-2", theme === "dark" ? "border-white/10" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setGetStartedOpen(!getStartedOpen)}
                    className={cx("flex w-full items-center justify-between py-2 text-sm font-semibold transition-colors", theme === "dark" ? "text-orange-400" : "text-orange-600")}
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
                          className={cx("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors", theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50")}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-500/10">
                            {item.icon === "home" && <Home className="h-4 w-4 text-orange-500" />}
                            {item.icon === "building" && <Building2 className="h-4 w-4 text-orange-500" />}
                            {item.icon === "trending" && <TrendingUp className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div>
                            <div className={cx("text-sm font-medium", theme === "dark" ? "text-white" : "text-slate-900")}>{item.label}</div>
                            <div className={cx("text-xs", theme === "dark" ? "text-white/50" : "text-slate-500")}>{item.description}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : mounted && isAuthenticated ? (
              <>
                <div className={cx("flex items-center gap-3 p-3 rounded-lg mt-2", theme === "dark" ? "bg-white/5" : "bg-slate-100")}>
                  <Avatar className="h-10 w-10 border-2 border-orange-500/30">
                    <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className={cx("text-sm font-medium", theme === "dark" ? "text-white" : "text-slate-900")}>
                      {user?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className={cx("text-xs", theme === "dark" ? "text-white/60" : "text-slate-600")}>
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
                  <Button className={cx(BTN_OUTLINE(theme), "w-full text-sm font-medium")}>
                    Sign Out
                  </Button>
                </button>
              </>
            ) : null}
            {/* Mobile theme toggle */}
            <div className={cx("flex items-center justify-between border-t pt-3 mt-3", theme === "dark" ? "border-white/10" : "border-slate-200")}>
              <span className={cx("text-xs font-medium", theme === "dark" ? "text-white/50" : "text-slate-500")}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className={cx("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors", theme === "dark" ? "text-white/80 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-orange-500" />
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