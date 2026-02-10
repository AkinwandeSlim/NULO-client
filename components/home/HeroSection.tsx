'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { SearchBar } from './SearchBar'

interface HeroSectionProps {
  location: string
  setLocation: (location: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  propertyType: string
  setPropertyType: (type: string) => void
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  locationInputRef: React.RefObject<HTMLInputElement | null>
  defaultCity?: string // ✅ NEW: Default city for location suggestions
}

export function HeroSection({
  location,
  setLocation,
  priceRange,
  setPriceRange,
  propertyType,
  setPropertyType,
  showAdvanced,
  setShowAdvanced,
  locationInputRef,
  defaultCity = 'Abuja' // ✅ Default to Lagos, can be overridden
}: HeroSectionProps) {
  const router = useRouter()
  const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant')
  const [showWelcome, setShowWelcome] = useState(false)
  
  // ✅ PERFORMANCE: Only enable parallax on desktop
  const [isDesktop, setIsDesktop] = useState(true)
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 500], [0, isDesktop ? 150 : 0])
  
  // ✅ PERFORMANCE: Detect mobile and disable heavy animations
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768
      setIsDesktop(!mobile)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  // Handle user type selection
  const handleUserTypeClick = (type: 'tenant' | 'landlord') => {
    setUserType(type)
    
    if (type === 'tenant') {
      setShowWelcome(true)
      
      setTimeout(() => {
        const searchSection = document.querySelector('.search-section')
        if (searchSection) {
          searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 400)
      
      setTimeout(() => {
        locationInputRef.current?.focus()
        if (propertyType === 'Property Type') {
          setPropertyType('Apartment')
        }
        setTimeout(() => setShowWelcome(false), 3000)
      }, 1200)
    } else {
      router.push('/landlord/overview')
    }
  }

  // ✅ PERFORMANCE: Reduce particles based on device
  // Desktop: 8 particles, Mobile: 3 particles
  const particlePositions = useMemo(() => {
    const count = isDesktop ? 8 : 3
    return Array.from({ length: count }, (_, i) => ({
      left: ((i * 12.5 + 15) % 100),
      top: ((i * 15.3 + 20) % 100),
      duration: 5 + (i % 2),
      delay: (i * 0.5) % 4
    }))
  }, [isDesktop])

  // ✅ PERFORMANCE: Delayed auto-focus to not block initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-focus on desktop
      if (isDesktop) {
        locationInputRef.current?.focus()
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [locationInputRef, isDesktop])

  return (
    <section 
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-orange-50 to-amber-50 -mt-20 pt-20" 
      role="banner" 
      aria-label="Hero section"
    >
      
      {/* Background with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: imageY }}
      >
        {/* Premium Gradient Overlays */}
        <div 
          className="absolute inset-0" 
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(251, 146, 60, 0.08) 0%, transparent 50%),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 60%, rgba(251, 146, 60, 0.05) 100%),
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(251, 146, 60, 0.03) 10px,
                rgba(251, 146, 60, 0.03) 20px
              )
            `,
            opacity: 1
          }} 
          aria-hidden="true" 
        />

        {/* ✅ Premium Noise & Grain Texture Overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise' /%3E%3CfeColorMatrix in='noise' type='saturate' values='0' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")
            `,
            backgroundSize: '200px 200px',
            opacity: 0.1,
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
      </motion.div>
      {/* Premium Accent Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
        {/* Enhanced animated blobs with premium colors */}
        {isDesktop && (
          <>
            <motion.div 
              className="absolute top-[15%] left-[10%] w-52 h-52 bg-gradient-to-br from-orange-400/25 via-orange-500/20 to-amber-500/15 rounded-full blur-[80px]"
              animate={{ 
                scale: [1, 1.4, 1], 
                opacity: [0.5, 0.7, 0.5],
                y: [0, -20, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: 'translateZ(0)' }}
            />
            <motion.div 
              className="absolute bottom-[25%] right-[15%] w-64 h-64 bg-gradient-to-tl from-orange-400/20 via-amber-400/15 to-yellow-300/10 rounded-full blur-[90px]"
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.4, 0.6, 0.4],
                y: [0, 15, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              style={{ transform: 'translateZ(0)' }}
            />
            <motion.div 
              className="absolute top-[60%] left-[70%] w-40 h-40 bg-gradient-to-br from-orange-300/20 via-amber-300/15 to-yellow-200/10 rounded-full blur-[70px]"
              animate={{ 
                scale: [1, 1.25, 1], 
                opacity: [0.35, 0.55, 0.35],
                y: [0, -10, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
              style={{ transform: 'translateZ(0)' }}
            />
          </>
        )}
        
        {/* Premium floating particles with varied sizes and colors */}
        {particlePositions.map((particle, i) => {
          const colors = ['rgba(251, 146, 60, 0.6)', 'rgba(249, 115, 22, 0.5)', 'rgba(217, 119, 6, 0.4)', 'rgba(245, 158, 11, 0.5)']
          const sizes = [1, 1.5, 2, 1.2, 1.8]
          const color = colors[i % colors.length]
          const size = sizes[i % sizes.length]
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                filter: `blur(${size < 1.5 ? '0.3px' : '0.6px'})`,
                boxShadow: `0 0 ${size * 2}px ${color}`,
                transform: 'translateZ(0)'
              }}
              animate={{
                y: [0, -200 - (i * 20)],
                opacity: [0, 0.8, 0.3, 0],
                scale: [1, 1.2, 0.8]
              }}
              transition={{
                duration: particle.duration + (i % 2),
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut"
              }}
            />
          )
        })}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Enhanced Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full border border-orange-200/60 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  <motion.div
                    className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-60"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <span className="text-sm font-black text-slate-900 tracking-[0.15em] uppercase">
                  Africa's Premier Property Platform
                </span>
              </div>
            </motion.div>

            {/* Enhanced Premium Headline */}
            <motion.div 
              className="text-center mb-6 md:mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tight mb-3 md:mb-5 px-4">
                <span className="block text-slate-900 drop-shadow-sm">
                  Discover Your
                </span>
                <motion.span 
                  className="block text-transparent drop-shadow-md"
                  animate={{
                    backgroundImage: [
                      'linear-gradient(135deg, #ea580c, #dc2626)',
                      'linear-gradient(135deg, #f97316, #fb923c)',
                      'linear-gradient(135deg, #ea580c, #fbbf24)',
                      'linear-gradient(135deg, #dc2626, #f97316, #fbbf24)',
                      'linear-gradient(135deg, #ca8a04, #eab308)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text'
                  } as any}
                >
                  Dream Space
                </motion.span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 font-bold max-w-4xl mx-auto leading-relaxed px-4 mb-4 md:mb-6">
                Premium properties across <span className="text-orange-600 font-black bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">Africa</span> — 
                Find, rent, or list with <span className="font-black text-slate-900">confidence</span>
              </p>
            </motion.div>

            {/* ✅ NEW: Animated Journey Flow - Search, Discover, Apply (Compact) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mb-8 md:mb-12 px-4"
            >
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-2 max-w-3xl mx-auto overflow-x-auto">
                {[
                  { icon: Search, label: 'Search', description: 'Location & Type' },
                  { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                  { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
                ].map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <motion.div
                        className="relative flex-shrink-0"
                      >
                        <motion.div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
                        >
                          <Icon className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
                        </motion.div>
                      </motion.div>
                      <div className="text-left hidden sm:block">
                        <p className="font-black text-slate-900 text-xs sm:text-sm">{step.label}</p>
                        <p className="text-[10px] sm:text-xs text-slate-600 font-medium">{step.description}</p>
                      </div>
                      <div className="sm:hidden text-left">
                        <p className="font-bold text-slate-900 text-[11px]">{step.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Enhanced Toggle Pills */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-3 mb-8 md:mb-10 px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="relative group">
                <button
                  onClick={() => handleUserTypeClick('tenant')}
                  className="w-full sm:w-auto px-4 sm:px-12 py-2 sm:py-4 rounded-2xl sm:rounded-3xl font-bold sm:font-black text-xs sm:text-sm transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-2xl shadow-orange-500/20 sm:shadow-orange-500/30 hover:shadow-orange-600/40 hover:scale-105 hover:-translate-y-1 border border-orange-400/20"
                  aria-label="I'm a Tenant - Find verified homes and apartments"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="relative">
                      <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                      <motion.div
                        className="absolute -inset-2 bg-white/20 rounded-full blur-lg"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <span>I'm a Tenant</span>
                  </div>
                </button>
                {/* Enhanced Tooltip - only on desktop */}
                {isDesktop && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
                      <div className="font-semibold mb-1">Find Your Perfect Home</div>
                      <div className="text-xs text-slate-300">Verified properties across Africa</div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={() => handleUserTypeClick('landlord')}
                  className="px-4 sm:px-12 py-2 sm:py-4 rounded-2xl sm:rounded-3xl font-bold sm:font-black text-xs sm:text-sm transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg sm:shadow-xl hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105 hover:-translate-y-1"
                  aria-label="I'm a Property Manager - List and manage rental properties"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="relative">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <motion.div
                        className="absolute -inset-2 bg-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                    <span>I'm a Property Manager</span>
                  </div>
                </button>
                {/* Enhanced Tooltip - only on desktop */}
                {isDesktop && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
                      <div className="font-semibold mb-1">List Your Properties</div>
                      <div className="text-xs text-slate-300">Connect with quality tenants</div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Welcome Message */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-2xl mx-auto mb-8 px-4"
              >
                <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-orange-100/60 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />
                  <div className="px-6 py-4 text-center">
                    <p className="text-slate-700 font-semibold">👋 Ready to find your dream space?</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ RESTORED: Search Bar Component */}
            <motion.div 
              className="search-section max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SearchBar
                location={location}
                setLocation={setLocation}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                propertyType={propertyType}
                setPropertyType={setPropertyType}
                showAdvanced={showAdvanced}
                setShowAdvanced={setShowAdvanced}
                locationInputRef={locationInputRef}
                defaultCity={defaultCity}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-[2]" />
      
      {/* Premium Scroll Indicator */}
      {isDesktop && (
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: [0.6, 1, 0.6],
            y: [0, 12, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <span className="text-sm text-slate-700 font-semibold tracking-wide">Scroll to explore</span>
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-40"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg 
              className="relative w-7 h-7 text-orange-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      )}
    </section>
  )
}