'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
import { SearchBarCompact } from './SearchBarCompact'
import { AdvancedFiltersModal } from './AdvancedFiltersModal'

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
  defaultCity?: string
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
  defaultCity = 'Abuja'
}: HeroSectionProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant')
  const [showWelcome, setShowWelcome] = useState(false)
  const [bedrooms, setBedrooms] = useState<string>('Any')
  const [bathrooms, setBathrooms] = useState<string>('Any')
  const [minSize, setMinSize] = useState<string>('')
  
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
  
  // ✅ IMPROVED: Memoized handler to prevent unnecessary re-renders
  const handleUserTypeClick = useCallback((type: 'tenant' | 'landlord') => {
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
      // ✅ Check if user is authenticated
      if (user) {
        router.push('/landlord/overview')
      } else {
        console.log('👤 [HERO] User not authenticated → redirecting to /signup/landlord')
        router.push('/signup/landlord')
      }
    }
  }, [user, propertyType, setPropertyType, locationInputRef, router])

  // ✅ PERFORMANCE: Reduce particles based on device
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
      if (isDesktop && locationInputRef.current) {
        locationInputRef.current.focus()
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [locationInputRef, isDesktop])

  // ✅ Animation variants for reusability and performance
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-visible bg-gradient-to-br from-white via-orange-50 to-amber-50" 
      role="banner" 
      aria-label="Hero section - Find your dream space"
    >
      
      {/* ✅ Background with Parallax */}
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

        {/* Noise & Grain Texture Overlay */}
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

      {/* ✅ Premium Accent Elements & Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
        {isDesktop && (
          <>
            {/* Animated Blob 1 - Top Left */}
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
            {/* Animated Blob 2 - Bottom Right */}
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
            {/* Animated Blob 3 - Center Right */}
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
        
        {/* Floating Particles */}
        {particlePositions.map((particle, i) => {
          const colors = ['rgba(251, 146, 60, 0.6)', 'rgba(249, 115, 22, 0.5)', 'rgba(217, 119, 6, 0.4)', 'rgba(245, 158, 11, 0.5)']
          const sizes = [1, 1.5, 2, 1.2, 1.8]
          const color = colors[i % colors.length]
          const size = sizes[i % sizes.length]
          
          return (
            <motion.div
              key={`particle-${i}`}
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

      {/* ✅ Main Content Container - IMPROVED SPACING & ISOLATION */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-32 md:pb-40 overflow-visible isolation-auto">
        <motion.div 
          className="w-full max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* ✅ IMPROVED: Premium Badge with breathing room */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-orange-200/60 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 group cursor-pointer">
              <div className="relative">
                <Sparkles className="h-4 w-4 text-orange-600 transition-transform group-hover:scale-110" />
                <motion.div
                  className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-60"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-xs font-black text-slate-900 tracking-[0.15em] uppercase">
                Africa's Premier Property Platform
              </span>
            </div>
          </motion.div>

          {/* ✅ IMPROVED: Premium Headline with optimized spacing */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-4 md:mb-6 lg:mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 px-4">
              <span className="block text-slate-900 drop-shadow-sm">
                Discover Your
              </span>
              <motion.span 
                className="block text-transparent drop-shadow-md mt-2"
                animate={{
                  backgroundImage: [
                    'linear-gradient(135deg, #ea580c, #dc2626)',
                    'linear-gradient(135deg, #f97316, #fb923c)',
                    'linear-gradient(135deg, #ea580c, #f97316)',
                    'linear-gradient(135deg, #dc2626, #f97316, #fb923c)',
                    'linear-gradient(135deg, #c2410c, #f97316)'
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

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-slate-700 font-bold max-w-4xl mx-auto leading-relaxed px-4"
            >
              Premium properties across <span className="text-orange-600 font-black">Africa</span> — 
              Find, rent, or list with <span className="font-black text-slate-900">confidence</span>
            </motion.p>
          </motion.div>

          {/* ✅ IMPROVED: Journey Flow - SMALLER as supporting tagline */}
          <motion.div
            variants={itemVariants}
            className="mb-8 md:mb-10 px-2 sm:px-4 mt-2 md:mt-3"
          >
            <div className="flex flex-row items-center justify-center gap-0.5 sm:gap-2 max-w-2xl mx-auto px-1">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-1 sm:gap-2 flex-shrink-0 w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-sm sm:shadow-md shadow-orange-500/20">
                        <Icon className="w-2.5 h-2.5 sm:w-4.5 sm:h-4.5 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-shrink">
                      <p className="font-bold text-slate-900 text-[9px] sm:text-sm whitespace-nowrap">{step.label}</p>
                      <p className="text-[7px] sm:text-xs text-slate-600 font-medium hidden sm:block whitespace-nowrap">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden md:block text-orange-300 ml-0.5">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ✅ IMPROVED: Toggle Pills with better spacing and interaction */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-10 md:mb-12 px-4 mt-6 md:mt-8"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-5 sm:px-10 py-2.5 sm:py-3.5 rounded-lg sm:rounded-2xl font-bold text-xs sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">I'm a Tenant</span>
                </div>
              </motion.button>
              {isDesktop && (
                <motion.div 
                  className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50"
                  initial={{ y: -10 }}
                  whileHover={{ y: 0 }}
                >
                  <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
                    <div className="font-semibold mb-1">Find Your Perfect Home</div>
                    <div className="text-xs text-slate-300">Verified properties across Africa</div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Property Manager Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('landlord')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-5 sm:px-10 py-2.5 sm:py-3.5 rounded-lg sm:rounded-2xl font-bold text-xs sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">I'm a Property Manager</span>
                </div>
              </motion.button>
              {isDesktop && (
                <motion.div 
                  className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50"
                  initial={{ y: -10 }}
                  whileHover={{ y: 0 }}
                >
                  <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
                    <div className="font-semibold mb-1">List Your Properties</div>
                    <div className="text-xs text-slate-300">Connect with quality tenants</div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* ✅ IMPROVED: Welcome Message */}
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-2xl mx-auto mb-8 px-4"
            >
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-orange-100/60 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />
                <div className="px-6 py-4 text-center">
                  <motion.p 
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-slate-700 font-semibold text-lg inline-block"
                  >
                    👋 Ready to find your dream space?
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ✅ CRITICAL IMPROVEMENT: Compact Search Bar with Modal Filters */}
          <motion.div 
            variants={itemVariants}
            className="search-section w-full px-4 mt-6 md:mt-8 pb-16 md:pb-20"
          >
            <div className="max-w-4xl mx-auto">
              <SearchBarCompact
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
            </div>
          </motion.div>

          {/* Advanced Filters Modal */}
          <AdvancedFiltersModal
            isOpen={showAdvanced}
            onClose={() => setShowAdvanced(false)}
            filters={{
              priceRange,
              propertyType,
              bedrooms,
              bathrooms,
              minSize
            }}
            onFiltersChange={(filters) => {
              setPriceRange(filters.priceRange)
              setPropertyType(filters.propertyType)
              setBedrooms(filters.bedrooms)
              setBathrooms(filters.bathrooms)
              setMinSize(filters.minSize)
            }}
            applyHref="/properties"
          />
        </motion.div>
      </div>

      {/* Enhanced Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-[2]" aria-hidden="true" />
      
      {/* Premium Scroll Indicator */}
      {isDesktop && (
        <motion.div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-3"
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






















































// 'use client'

// import { useState, useEffect, useMemo, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuth } from '@/contexts/AuthContext'
// import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
// import { motion, useScroll, useTransform, Variants } from 'framer-motion'
// import { SearchBar } from './SearchBar'

// interface HeroSectionProps {
//   location: string
//   setLocation: (location: string) => void
//   priceRange: [number, number]
//   setPriceRange: (range: [number, number]) => void
//   propertyType: string
//   setPropertyType: (type: string) => void
//   showAdvanced: boolean
//   setShowAdvanced: (show: boolean) => void
//   locationInputRef: React.RefObject<HTMLInputElement | null>
//   defaultCity?: string
// }

// export function HeroSection({
//   location,
//   setLocation,
//   priceRange,
//   setPriceRange,
//   propertyType,
//   setPropertyType,
//   showAdvanced,
//   setShowAdvanced,
//   locationInputRef,
//   defaultCity = 'Abuja'
// }: HeroSectionProps) {
//   const router = useRouter()
//   const { user } = useAuth()
//   const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant')
//   const [showWelcome, setShowWelcome] = useState(false)
  
//   // ✅ PERFORMANCE: Only enable parallax on desktop
//   const [isDesktop, setIsDesktop] = useState(true)
//   const { scrollY } = useScroll()
//   const imageY = useTransform(scrollY, [0, 500], [0, isDesktop ? 150 : 0])
  
//   // ✅ PERFORMANCE: Detect mobile and disable heavy animations
//   useEffect(() => {
//     const checkDevice = () => {
//       const mobile = window.innerWidth < 768
//       setIsDesktop(!mobile)
//     }
    
//     checkDevice()
//     window.addEventListener('resize', checkDevice)
//     return () => window.removeEventListener('resize', checkDevice)
//   }, [])
  
//   // ✅ IMPROVED: Memoized handler to prevent unnecessary re-renders
//   const handleUserTypeClick = useCallback((type: 'tenant' | 'landlord') => {
//     setUserType(type)
    
//     if (type === 'tenant') {
//       setShowWelcome(true)
      
//       setTimeout(() => {
//         const searchSection = document.querySelector('.search-section')
//         if (searchSection) {
//           searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
//         }
//       }, 400)
      
//       setTimeout(() => {
//         locationInputRef.current?.focus()
//         if (propertyType === 'Property Type') {
//           setPropertyType('Apartment')
//         }
//         setTimeout(() => setShowWelcome(false), 3000)
//       }, 1200)
//     } else {
//       // ✅ Check if user is authenticated
//       if (user) {
//         router.push('/landlord/overview')
//       } else {
//         console.log('👤 [HERO] User not authenticated → redirecting to /signup/landlord')
//         router.push('/signup/landlord')
//       }
//     }
//   }, [user, propertyType, setPropertyType, locationInputRef, router])

//   // ✅ PERFORMANCE: Reduce particles based on device
//   const particlePositions = useMemo(() => {
//     const count = isDesktop ? 8 : 3
//     return Array.from({ length: count }, (_, i) => ({
//       left: ((i * 12.5 + 15) % 100),
//       top: ((i * 15.3 + 20) % 100),
//       duration: 5 + (i % 2),
//       delay: (i * 0.5) % 4
//     }))
//   }, [isDesktop])

//   // ✅ PERFORMANCE: Delayed auto-focus to not block initial render
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (isDesktop && locationInputRef.current) {
//         locationInputRef.current.focus()
//       }
//     }, 800)
//     return () => clearTimeout(timer)
//   }, [locationInputRef, isDesktop])

//   // ✅ Animation variants for reusability and performance
//   const containerVariants: Variants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.15,
//         delayChildren: 0.2,
//       },
//     },
//   }

//   const itemVariants: Variants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.6, ease: "easeOut" },
//     },
//   }

//   return (
//     <section 
//       className="relative min-h-screen flex items-center justify-center overflow-visible bg-gradient-to-br from-white via-orange-50 to-amber-50" 
//       role="banner" 
//       aria-label="Hero section - Find your dream space"
//     >
      
//       {/* ✅ Background with Parallax */}
//       <motion.div 
//         className="absolute inset-0 z-0"
//         style={{ y: imageY }}
//       >
//         {/* Premium Gradient Overlays */}
//         <div 
//           className="absolute inset-0" 
//           style={{
//             background: `
//               radial-gradient(ellipse at 20% 30%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
//               radial-gradient(ellipse at 80% 70%, rgba(251, 146, 60, 0.08) 0%, transparent 50%),
//               linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 60%, rgba(251, 146, 60, 0.05) 100%),
//               repeating-linear-gradient(
//                 45deg,
//                 transparent,
//                 transparent 10px,
//                 rgba(251, 146, 60, 0.03) 10px,
//                 rgba(251, 146, 60, 0.03) 20px
//               )
//             `,
//             opacity: 1
//           }} 
//           aria-hidden="true" 
//         />

//         {/* Noise & Grain Texture Overlay */}
//         <div 
//           className="absolute inset-0" 
//           style={{
//             backgroundImage: `
//               url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise' /%3E%3CfeColorMatrix in='noise' type='saturate' values='0' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")
//             `,
//             backgroundSize: '200px 200px',
//             opacity: 0.1,
//             mixBlendMode: 'overlay',
//             pointerEvents: 'none'
//           }}
//           aria-hidden="true"
//         />
//       </motion.div>

//       {/* ✅ Premium Accent Elements & Animated Blobs */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
//         {isDesktop && (
//           <>
//             {/* Animated Blob 1 - Top Left */}
//             <motion.div 
//               className="absolute top-[15%] left-[10%] w-52 h-52 bg-gradient-to-br from-orange-400/25 via-orange-500/20 to-amber-500/15 rounded-full blur-[80px]"
//               animate={{ 
//                 scale: [1, 1.4, 1], 
//                 opacity: [0.5, 0.7, 0.5],
//                 y: [0, -20, 0]
//               }}
//               transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//             {/* Animated Blob 2 - Bottom Right */}
//             <motion.div 
//               className="absolute bottom-[25%] right-[15%] w-64 h-64 bg-gradient-to-tl from-orange-400/20 via-amber-400/15 to-yellow-300/10 rounded-full blur-[90px]"
//               animate={{ 
//                 scale: [1, 1.3, 1], 
//                 opacity: [0.4, 0.6, 0.4],
//                 y: [0, 15, 0]
//               }}
//               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//             {/* Animated Blob 3 - Center Right */}
//             <motion.div 
//               className="absolute top-[60%] left-[70%] w-40 h-40 bg-gradient-to-br from-orange-300/20 via-amber-300/15 to-yellow-200/10 rounded-full blur-[70px]"
//               animate={{ 
//                 scale: [1, 1.25, 1], 
//                 opacity: [0.35, 0.55, 0.35],
//                 y: [0, -10, 0]
//               }}
//               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//           </>
//         )}
        
//         {/* Floating Particles */}
//         {particlePositions.map((particle, i) => {
//           const colors = ['rgba(251, 146, 60, 0.6)', 'rgba(249, 115, 22, 0.5)', 'rgba(217, 119, 6, 0.4)', 'rgba(245, 158, 11, 0.5)']
//           const sizes = [1, 1.5, 2, 1.2, 1.8]
//           const color = colors[i % colors.length]
//           const size = sizes[i % sizes.length]
          
//           return (
//             <motion.div
//               key={`particle-${i}`}
//               className="absolute rounded-full"
//               style={{
//                 left: `${particle.left}%`,
//                 top: `${particle.top}%`,
//                 width: `${size}px`,
//                 height: `${size}px`,
//                 backgroundColor: color,
//                 filter: `blur(${size < 1.5 ? '0.3px' : '0.6px'})`,
//                 boxShadow: `0 0 ${size * 2}px ${color}`,
//                 transform: 'translateZ(0)'
//               }}
//               animate={{
//                 y: [0, -200 - (i * 20)],
//                 opacity: [0, 0.8, 0.3, 0],
//                 scale: [1, 1.2, 0.8]
//               }}
//               transition={{
//                 duration: particle.duration + (i % 2),
//                 repeat: Infinity,
//                 delay: particle.delay,
//                 ease: "easeOut"
//               }}
//             />
//           )
//         })}
//       </div>

//       {/* ✅ Main Content Container - IMPROVED SPACING */}
//       <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
//         <motion.div 
//           className="w-full max-w-5xl mx-auto"
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
          
//           {/* ✅ IMPROVED: Premium Badge with breathing room */}
//           <motion.div variants={itemVariants} className="flex justify-center mb-8 sm:mb-10 md:mb-12">
//             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-orange-200/60 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 group cursor-pointer">
//               <div className="relative">
//                 <Sparkles className="h-4 w-4 text-orange-600 transition-transform group-hover:scale-110" />
//                 <motion.div
//                   className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-60"
//                   animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
//                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//                 />
//               </div>
//               <span className="text-xs font-black text-slate-900 tracking-[0.15em] uppercase">
//                 Africa's Premier Property Platform
//               </span>
//             </div>
//           </motion.div>

//           {/* ✅ IMPROVED: Premium Headline with optimized spacing */}
//           <motion.div 
//             variants={itemVariants}
//             className="text-center mb-10 md:mb-14 lg:mb-16"
//           >
//             <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 px-4">
//               <span className="block text-slate-900 drop-shadow-sm">
//                 Discover Your
//               </span>
//               <motion.span 
//                 className="block text-transparent drop-shadow-md mt-2"
//                 animate={{
//                   backgroundImage: [
//                     'linear-gradient(135deg, #ea580c, #dc2626)',
//                     'linear-gradient(135deg, #f97316, #fb923c)',
//                     'linear-gradient(135deg, #ea580c, #f97316)',
//                     'linear-gradient(135deg, #dc2626, #f97316, #fb923c)',
//                     'linear-gradient(135deg, #c2410c, #f97316)'
//                   ]
//                 }}
//                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
//                 style={{
//                   backgroundClip: 'text',
//                   WebkitBackgroundClip: 'text'
//                 } as any}
//               >
//                 Dream Space
//               </motion.span>
//             </h1>

//             <motion.p 
//               variants={itemVariants}
//               className="text-base sm:text-lg md:text-xl text-slate-700 font-bold max-w-4xl mx-auto leading-relaxed px-4"
//             >
//               Premium properties across <span className="text-orange-600 font-black">Africa</span> — 
//               Find, rent, or list with <span className="font-black text-slate-900">confidence</span>
//             </motion.p>
//           </motion.div>

//           {/* ✅ NEW: Animated Journey Flow with better spacing */}
//           <motion.div
//             variants={itemVariants}
//             className="mb-12 md:mb-16 px-4"
//           >
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
//               {[
//                 { icon: Search, label: 'Search', description: 'Location & Type' },
//                 { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
//                 { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
//               ].map((step, index) => {
//                 const Icon = step.icon
//                 return (
//                   <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
//                     <motion.div
//                       className="relative flex-shrink-0"
//                       whileHover={{ scale: 1.1 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
//                         <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
//                       </div>
//                     </motion.div>
//                     <div className="text-left flex-1 sm:flex-none">
//                       <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
//                       <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
//                     </div>
//                     {index < 2 && (
//                       <div className="hidden sm:block text-orange-400 ml-2">
//                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
//                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           </motion.div>

//           {/* ✅ IMPROVED: Toggle Pills with better spacing and interaction */}
//           <motion.div 
//             variants={itemVariants}
//             className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
//           >
//             {/* Tenant Button */}
//             <motion.div className="relative group w-full sm:w-auto">
//               <motion.button
//                 onClick={() => handleUserTypeClick('tenant')}
//                 whileHover={{ scale: 1.05, y: -4 }}
//                 whileTap={{ scale: 0.98 }}
//                 className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
//                 aria-label="I'm a Tenant - Find verified homes and apartments"
//               >
//                 <div className="flex items-center justify-center gap-2">
//                   <Home className="h-5 w-5 sm:h-5 sm:w-5" />
//                   <span>I'm a Tenant</span>
//                 </div>
//               </motion.button>
//               {isDesktop && (
//                 <motion.div 
//                   className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50"
//                   initial={{ y: -10 }}
//                   whileHover={{ y: 0 }}
//                 >
//                   <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
//                     <div className="font-semibold mb-1">Find Your Perfect Home</div>
//                     <div className="text-xs text-slate-300">Verified properties across Africa</div>
//                     <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
//                   </div>
//                 </motion.div>
//               )}
//             </motion.div>

//             {/* Property Manager Button */}
//             <motion.div className="relative group w-full sm:w-auto">
//               <motion.button
//                 onClick={() => handleUserTypeClick('landlord')}
//                 whileHover={{ scale: 1.05, y: -4 }}
//                 whileTap={{ scale: 0.98 }}
//                 className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
//                 aria-label="I'm a Property Manager - List and manage rental properties"
//               >
//                 <div className="flex items-center justify-center gap-2">
//                   <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
//                   <span>I'm a Property Manager</span>
//                 </div>
//               </motion.button>
//               {isDesktop && (
//                 <motion.div 
//                   className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50"
//                   initial={{ y: -10 }}
//                   whileHover={{ y: 0 }}
//                 >
//                   <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
//                     <div className="font-semibold mb-1">List Your Properties</div>
//                     <div className="text-xs text-slate-300">Connect with quality tenants</div>
//                     <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
//                   </div>
//                 </motion.div>
//               )}
//             </motion.div>
//           </motion.div>

//           {/* ✅ IMPROVED: Welcome Message */}
//           {showWelcome && (
//             <motion.div
//               initial={{ opacity: 0, y: -10, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: -10, scale: 0.95 }}
//               transition={{ duration: 0.3, ease: "easeOut" }}
//               className="max-w-2xl mx-auto mb-8 px-4"
//             >
//               <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-orange-100/60 overflow-hidden">
//                 <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />
//                 <div className="px-6 py-4 text-center">
//                   <motion.p 
//                     animate={{ rotate: [0, 5, -5, 0] }}
//                     transition={{ duration: 0.5, ease: "easeInOut" }}
//                     className="text-slate-700 font-semibold text-lg inline-block"
//                   >
//                     👋 Ready to find your dream space?
//                   </motion.p>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* ✅ CRITICAL IMPROVEMENT: Search Bar with proper spacing */}
//           <motion.div 
//             variants={itemVariants}
//             className="search-section w-full px-4"
//           >
//             <div className="max-w-4xl mx-auto">
//               <SearchBar
//                 location={location}
//                 setLocation={setLocation}
//                 priceRange={priceRange}
//                 setPriceRange={setPriceRange}
//                 propertyType={propertyType}
//                 setPropertyType={setPropertyType}
//                 showAdvanced={showAdvanced}
//                 setShowAdvanced={setShowAdvanced}
//                 locationInputRef={locationInputRef}
//                 defaultCity={defaultCity}
//               />
//             </div>
//           </motion.div>
//         </motion.div>
//       </div>

//       {/* Enhanced Bottom Fade */}
//       <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-[2]" aria-hidden="true" />
      
//       {/* Premium Scroll Indicator */}
//       {isDesktop && (
//         <motion.div
//           className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-3"
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ 
//             opacity: [0.6, 1, 0.6],
//             y: [0, 12, 0]
//           }}
//           transition={{
//             duration: 2.5,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 2
//           }}
//         >
//           <span className="text-sm text-slate-700 font-semibold tracking-wide">Scroll to explore</span>
//           <div className="relative">
//             <motion.div
//               className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-40"
//               animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.2, 0.4] }}
//               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//             />
//             <svg 
//               className="relative w-7 h-7 text-orange-600" 
//               fill="none" 
//               stroke="currentColor" 
//               viewBox="0 0 24 24"
//               aria-hidden="true"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//             </svg>
//           </div>
//         </motion.div>
//       )}
//     </section>
//   )
// }



















// 'use client'

// import { useState, useEffect, useMemo } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuth } from '@/contexts/AuthContext'
// import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
// import { motion, useScroll, useTransform } from 'framer-motion'
// import { SearchBar } from './SearchBar'

// interface HeroSectionProps {
//   location: string
//   setLocation: (location: string) => void
//   priceRange: [number, number]
//   setPriceRange: (range: [number, number]) => void
//   propertyType: string
//   setPropertyType: (type: string) => void
//   showAdvanced: boolean
//   setShowAdvanced: (show: boolean) => void
//   locationInputRef: React.RefObject<HTMLInputElement | null>
//   defaultCity?: string // ✅ NEW: Default city for location suggestions
// }

// export function HeroSection({
//   location,
//   setLocation,
//   priceRange,
//   setPriceRange,
//   propertyType,
//   setPropertyType,
//   showAdvanced,
//   setShowAdvanced,
//   locationInputRef,
//   defaultCity = 'Abuja' // ✅ Default to Lagos, can be overridden
// }: HeroSectionProps) {
//   const router = useRouter()
//   const { user } = useAuth()
//   const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant')
//   const [showWelcome, setShowWelcome] = useState(false)
  
//   // ✅ PERFORMANCE: Only enable parallax on desktop
//   const [isDesktop, setIsDesktop] = useState(true)
//   const { scrollY } = useScroll()
//   const imageY = useTransform(scrollY, [0, 500], [0, isDesktop ? 150 : 0])
  
//   // ✅ PERFORMANCE: Detect mobile and disable heavy animations
//   useEffect(() => {
//     const checkDevice = () => {
//       const mobile = window.innerWidth < 768
//       setIsDesktop(!mobile)
//     }
    
//     checkDevice()
//     window.addEventListener('resize', checkDevice)
//     return () => window.removeEventListener('resize', checkDevice)
//   }, [])
  
//   // Handle user type selection
//   const handleUserTypeClick = (type: 'tenant' | 'landlord') => {
//     setUserType(type)
    
//     if (type === 'tenant') {
//       setShowWelcome(true)
      
//       setTimeout(() => {
//         const searchSection = document.querySelector('.search-section')
//         if (searchSection) {
//           searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
//         }
//       }, 400)
      
//       setTimeout(() => {
//         locationInputRef.current?.focus()
//         if (propertyType === 'Property Type') {
//           setPropertyType('Apartment')
//         }
//         setTimeout(() => setShowWelcome(false), 3000)
//       }, 1200)
//     } else {
//       // ✅ NEW: Check if user is authenticated
//       if (user) {
//         // Authenticated user → go to landlord overview
//         router.push('/landlord/overview')
//       } else {
//         // Unauthenticated user → go directly to landlord signup (skip role selection)
//         console.log('👤 [HERO] User not authenticated → redirecting to /signup/landlord')
//         router.push('/signup/landlord')
//       }
//     }
//   }

//   // ✅ PERFORMANCE: Reduce particles based on device
//   // Desktop: 8 particles, Mobile: 3 particles
//   const particlePositions = useMemo(() => {
//     const count = isDesktop ? 8 : 3
//     return Array.from({ length: count }, (_, i) => ({
//       left: ((i * 12.5 + 15) % 100),
//       top: ((i * 15.3 + 20) % 100),
//       duration: 5 + (i % 2),
//       delay: (i * 0.5) % 4
//     }))
//   }, [isDesktop])

//   // ✅ PERFORMANCE: Delayed auto-focus to not block initial render
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       // Only auto-focus on desktop
//       if (isDesktop) {
//         locationInputRef.current?.focus()
//       }
//     }, 800)
//     return () => clearTimeout(timer)
//   }, [locationInputRef, isDesktop])

//   return (
//     <section 
//       className="relative min-h-screen flex items-start justify-center overflow-visible bg-gradient-to-br from-white via-orange-50 to-amber-50 pt-6" 
//       role="banner" 
//       aria-label="Hero section"
//     >
      
//       {/* Background with Parallax */}
//       <motion.div 
//         className="absolute inset-0 z-0"
//         style={{ y: imageY }}
//       >
//         {/* Premium Gradient Overlays */}
//         <div 
//           className="absolute inset-0" 
//           style={{
//             background: `
//               radial-gradient(ellipse at 20% 30%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
//               radial-gradient(ellipse at 80% 70%, rgba(251, 146, 60, 0.08) 0%, transparent 50%),
//               linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 60%, rgba(251, 146, 60, 0.05) 100%),
//               repeating-linear-gradient(
//                 45deg,
//                 transparent,
//                 transparent 10px,
//                 rgba(251, 146, 60, 0.03) 10px,
//                 rgba(251, 146, 60, 0.03) 20px
//               )
//             `,
//             opacity: 1
//           }} 
//           aria-hidden="true" 
//         />

//         {/* ✅ Premium Noise & Grain Texture Overlay */}
//         <div 
//           className="absolute inset-0" 
//           style={{
//             backgroundImage: `
//               url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise' /%3E%3CfeColorMatrix in='noise' type='saturate' values='0' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")
//             `,
//             backgroundSize: '200px 200px',
//             opacity: 0.1,
//             mixBlendMode: 'overlay',
//             pointerEvents: 'none'
//           }}
//           aria-hidden="true"
//         />
//       </motion.div>
//       {/* Premium Accent Elements */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
//         {/* Enhanced animated blobs with premium colors */}
//         {isDesktop && (
//           <>
//             <motion.div 
//               className="absolute top-[15%] left-[10%] w-52 h-52 bg-gradient-to-br from-orange-400/25 via-orange-500/20 to-amber-500/15 rounded-full blur-[80px]"
//               animate={{ 
//                 scale: [1, 1.4, 1], 
//                 opacity: [0.5, 0.7, 0.5],
//                 y: [0, -20, 0]
//               }}
//               transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//             <motion.div 
//               className="absolute bottom-[25%] right-[15%] w-64 h-64 bg-gradient-to-tl from-orange-400/20 via-amber-400/15 to-yellow-300/10 rounded-full blur-[90px]"
//               animate={{ 
//                 scale: [1, 1.3, 1], 
//                 opacity: [0.4, 0.6, 0.4],
//                 y: [0, 15, 0]
//               }}
//               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//             <motion.div 
//               className="absolute top-[60%] left-[70%] w-40 h-40 bg-gradient-to-br from-orange-300/20 via-amber-300/15 to-yellow-200/10 rounded-full blur-[70px]"
//               animate={{ 
//                 scale: [1, 1.25, 1], 
//                 opacity: [0.35, 0.55, 0.35],
//                 y: [0, -10, 0]
//               }}
//               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
//               style={{ transform: 'translateZ(0)' }}
//             />
//           </>
//         )}
        
//         {/* Premium floating particles with varied sizes and colors */}
//         {particlePositions.map((particle, i) => {
//           const colors = ['rgba(251, 146, 60, 0.6)', 'rgba(249, 115, 22, 0.5)', 'rgba(217, 119, 6, 0.4)', 'rgba(245, 158, 11, 0.5)']
//           const sizes = [1, 1.5, 2, 1.2, 1.8]
//           const color = colors[i % colors.length]
//           const size = sizes[i % sizes.length]
          
//           return (
//             <motion.div
//               key={i}
//               className="absolute rounded-full"
//               style={{
//                 left: `${particle.left}%`,
//                 top: `${particle.top}%`,
//                 width: `${size}px`,
//                 height: `${size}px`,
//                 backgroundColor: color,
//                 filter: `blur(${size < 1.5 ? '0.3px' : '0.6px'})`,
//                 boxShadow: `0 0 ${size * 2}px ${color}`,
//                 transform: 'translateZ(0)'
//               }}
//               animate={{
//                 y: [0, -200 - (i * 20)],
//                 opacity: [0, 0.8, 0.3, 0],
//                 scale: [1, 1.2, 0.8]
//               }}
//               transition={{
//                 duration: particle.duration + (i % 2),
//                 repeat: Infinity,
//                 delay: particle.delay,
//                 ease: "easeOut"
//               }}
//             />
//           )
//         })}
//       </div>

//       {/* Main Content */}
//       <div className="relative z-10 w-full">
//         <div className="w-full px-4 sm:px-6 lg:px-8 py-2 md:py-4">
//           <div className="w-full">
            
//             {/* Enhanced Premium Badge */}
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, ease: "easeOut" }}
//               className="flex justify-center mb-3 md:mb-4"
//             >
//               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-orange-200/60 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
//                 <div className="relative">
//                   <Sparkles className="h-4 w-4 text-orange-600" />
//                   <motion.div
//                     className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-60"
//                     animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
//                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//                   />
//                 </div>
//                 <span className="text-xs font-black text-slate-900 tracking-[0.15em] uppercase">
//                   Africa's Premier Property Platform
//                 </span>
//               </div>
//             </motion.div>

//             {/* Enhanced Premium Headline */}
//             <motion.div 
//               className="text-center mb-3 md:mb-4"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
//             >
//               <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight mb-2 md:mb-3 px-4">
//                 <span className="block text-slate-900 drop-shadow-sm">
//                   Discover Your
//                 </span>
//                 <motion.span 
//                   className="block text-transparent drop-shadow-md"
//                   animate={{
//                     backgroundImage: [
//                       'linear-gradient(135deg, #ea580c, #dc2626)',
//                       'linear-gradient(135deg, #f97316, #fb923c)',
//                       'linear-gradient(135deg, #ea580c, #f97316)',
//                       'linear-gradient(135deg, #dc2626, #f97316, #fb923c)',
//                       'linear-gradient(135deg, #c2410c, #f97316)'
//                     ]
//                   }}
//                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
//                   style={{
//                     backgroundClip: 'text',
//                     WebkitBackgroundClip: 'text'
//                   } as any}
//                 >
//                   Dream Space
//                 </motion.span>
//               </h1>

//               <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 font-bold max-w-4xl mx-auto leading-relaxed px-4 mb-3 md:mb-4">
//                 Premium properties across <span className="text-orange-600 font-black bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">Africa</span> — 
//                 Find, rent, or list with <span className="font-black text-slate-900">confidence</span>
//               </p>
//             </motion.div>

//             {/* ✅ NEW: Animated Journey Flow - Search, Discover, Apply (Compact) */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.7, delay: 0.4 }}
//               className="mb-3 md:mb-4 px-4"
//             >
//               <div className="flex flex-row items-center justify-center gap-2 sm:gap-2 max-w-3xl mx-auto overflow-x-auto">
//                 {[
//                   { icon: Search, label: 'Search', description: 'Location & Type' },
//                   { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
//                   { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
//                 ].map((step, index) => {
//                   const Icon = step.icon
//                   return (
//                     <div key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
//                       <motion.div
//                         className="relative flex-shrink-0"
//                       >
//                         <motion.div
//                           className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
//                         >
//                           <Icon className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
//                         </motion.div>
//                       </motion.div>
//                       <div className="text-left hidden sm:block">
//                         <p className="font-black text-slate-900 text-xs sm:text-sm">{step.label}</p>
//                         <p className="text-[10px] sm:text-xs text-slate-600 font-medium">{step.description}</p>
//                       </div>
//                       <div className="sm:hidden text-left">
//                         <p className="font-bold text-slate-900 text-[11px]">{step.label}</p>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </motion.div>

//             {/* Enhanced Toggle Pills */}
//             <motion.div 
//               className="flex flex-col sm:flex-row justify-center gap-2 mb-3 md:mb-4 px-4"
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.6, delay: 0.5 }}
//             >
//               <div className="relative group">
//                 <button
//                   onClick={() => handleUserTypeClick('tenant')}
//                   className="w-full sm:w-auto px-3 sm:px-8 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-lg shadow-orange-500/20 hover:shadow-orange-600/40 hover:scale-105 hover:-translate-y-1 border border-orange-400/20"
//                   aria-label="I'm a Tenant - Find verified homes and apartments"
//                 >
//                   <div className="flex items-center justify-center gap-1.5 sm:gap-2">
//                     <div className="relative">
//                       <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                       <motion.div
//                         className="absolute -inset-2 bg-white/20 rounded-full blur-lg"
//                         animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
//                         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//                       />
//                     </div>
//                     <span>I'm a Tenant</span>
//                   </div>
//                 </button>
//                 {/* Enhanced Tooltip - only on desktop */}
//                 {isDesktop && (
//                   <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
//                     <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
//                       <div className="font-semibold mb-1">Find Your Perfect Home</div>
//                       <div className="text-xs text-slate-300">Verified properties across Africa</div>
//                       <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="relative group">
//                 <button
//                   onClick={() => handleUserTypeClick('landlord')}
//                   className="w-full sm:w-auto px-3 sm:px-8 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 hover:-translate-y-1"
//                   aria-label="I'm a Property Manager - List and manage rental properties"
//                 >
//                   <div className="flex items-center justify-center gap-1.5 sm:gap-2">
//                     <div className="relative">
//                       <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
//                       <motion.div
//                         className="absolute -inset-2 bg-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
//                       />
//                     </div>
//                     <span>I'm a Property Manager</span>
//                   </div>
//                 </button>
//                 {/* Enhanced Tooltip - only on desktop */}
//                 {isDesktop && (
//                   <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
//                     <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-slate-700">
//                       <div className="font-semibold mb-1">List Your Properties</div>
//                       <div className="text-xs text-slate-300">Connect with quality tenants</div>
//                       <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </motion.div>

//             {/* Enhanced Welcome Message */}
//             {showWelcome && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.3, ease: "easeOut" }}
//                 className="max-w-2xl mx-auto mb-2 px-4"
//               >
//                 <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-orange-100/60 overflow-hidden">
//                   <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700" />
//                   <div className="px-6 py-4 text-center">
//                     <p className="text-slate-700 font-semibold">👋 Ready to find your dream space?</p>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* ✅ RESTORED: Search Bar Component */}
//             <motion.div 
//               className="search-section w-full"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: 0.6 }}
//             >
//               <SearchBar
//                 location={location}
//                 setLocation={setLocation}
//                 priceRange={priceRange}
//                 setPriceRange={setPriceRange}
//                 propertyType={propertyType}
//                 setPropertyType={setPropertyType}
//                 showAdvanced={showAdvanced}
//                 setShowAdvanced={setShowAdvanced}
//                 locationInputRef={locationInputRef}
//                 defaultCity={defaultCity}
//               />
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Bottom Fade */}
//       <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-[2]" />
      
//       {/* Premium Scroll Indicator */}
//       {isDesktop && (
//         <motion.div
//           className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-3"
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ 
//             opacity: [0.6, 1, 0.6],
//             y: [0, 12, 0]
//           }}
//           transition={{
//             duration: 2.5,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: 2
//           }}
//         >
//           <span className="text-sm text-slate-700 font-semibold tracking-wide">Scroll to explore</span>
//           <div className="relative">
//             <motion.div
//               className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-40"
//               animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.2, 0.4] }}
//               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
//             />
//             <svg 
//               className="relative w-7 h-7 text-orange-600" 
//               fill="none" 
//               stroke="currentColor" 
//               viewBox="0 0 24 24"
//               aria-hidden="true"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//             </svg>
//           </div>
//         </motion.div>
//       )}
//     </section>
//   )
// }