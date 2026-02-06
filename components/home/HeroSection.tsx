'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Building2, Sparkles } from 'lucide-react'
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
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]" 
      role="banner" 
      aria-label="Hero section"
    >
      {/* ✅ OPTIMIZED: Single combined texture overlay instead of 3 separate ones */}
      <div 
        className="absolute inset-0 z-[3] pointer-events-none opacity-10" 
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px)
          `,
          backgroundSize: '4px 4px, 20px 20px, 20px 20px',
          backgroundPosition: '0 0, 0 0, 0 0'
        }}
      />
      
      {/* Background with Parallax */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: imageY }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/citywaker1.png')",
            backgroundPosition: 'center 40%',
            filter: 'brightness(1.4) contrast(0.9) saturate(1.1)',
            opacity: 0.02,
            // ✅ PERFORMANCE: Use GPU acceleration
            transform: 'translateZ(0)',
            willChange: isDesktop ? 'transform' : 'auto'
          }}
          aria-hidden="true"
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-[#FFF9F1]/40 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/25 via-amber-100/15 to-transparent" aria-hidden="true" />
      </motion.div>

      {/* ✅ OPTIMIZED: Simplified accent elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
        {/* ✅ PERFORMANCE: Only show animated blobs on desktop */}
        {isDesktop && (
          <>
            <motion.div 
              className="absolute top-[20%] left-[15%] w-40 h-40 bg-gradient-to-br from-blue-200/40 via-cyan-200/30 to-sky-100/20 rounded-full blur-[60px]"
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: 'translateZ(0)' }}
            />
            <motion.div 
              className="absolute bottom-[30%] right-[20%] w-44 h-44 bg-gradient-to-tl from-blue-300/35 via-sky-200/25 to-cyan-100/15 rounded-full blur-[70px]"
              animate={{ 
                scale: [1, 1.25, 1], 
                opacity: [0.25, 0.45, 0.25]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              style={{ transform: 'translateZ(0)' }}
            />
          </>
        )}
        
        {/* ✅ OPTIMIZED: Fewer floating particles */}
        {particlePositions.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-orange-400/50 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              filter: 'blur(0.5px)',
              transform: 'translateZ(0)'
            }}
            animate={{
              y: [0, -150],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/70 backdrop-blur-md rounded-full border border-orange-200/50 shadow-sm">
                <Sparkles className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Africa's Premier Property Platform
                </span>
              </div>
            </motion.div>

            {/* Premium Headline */}
            <motion.div 
              className="text-center mb-8 md:mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight mb-4 md:mb-6 px-4">
                <span className="block text-slate-900">
                  Discover Your
                </span>
                <span className="block bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  Dream Space
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 font-semibold max-w-3xl mx-auto leading-relaxed px-4">
                Premium properties across <span className="text-orange-600 font-bold">Africa</span> — 
                Find, rent, or list with confidence
              </p>
            </motion.div>

            {/* Toggle Pills */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-3 mb-6 md:mb-8 px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="relative group">
                <button
                  onClick={() => handleUserTypeClick('tenant')}
                  className="w-full sm:w-auto px-9 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-600/40 hover:scale-105"
                  aria-label="I'm a Tenant - Find verified homes and apartments"
                >
                  <Home className="inline-block h-4 w-4 mr-2" />
                  I'm a Tenant
                </button>
                {/* Tooltip - only on desktop */}
                {isDesktop && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                      Find verified homes and apartments across Africa
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={() => handleUserTypeClick('landlord')}
                  className="w-full sm:w-auto px-9 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 bg-white/70 backdrop-blur-md text-slate-700 border border-orange-200/50 hover:bg-orange-500 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:scale-105"
                  aria-label="I'm a Property Manager - List and manage rental properties"
                >
                  <Building2 className="inline-block h-4 w-4 mr-2" />
                  I'm a Property Manager
                </button>
                {/* Tooltip - only on desktop */}
                {isDesktop && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                      List and manage your rental properties
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Welcome Message */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-2xl mx-auto mb-6 px-4"
              >
                <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-orange-100/50 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
                  
                  <div className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    
                    <div>
                      <p className="text-base font-bold text-slate-900 mb-0.5">
                        Welcome! 👋
                      </p>
                      <p className="text-sm text-slate-600">
                        What kind of space are you looking for?
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ OPTIMIZED: Simplified search bar glow animation */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1
              }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="max-w-5xl mx-auto relative search-section"
            >
              {/* ✅ PERFORMANCE: Only show pulsing glow on desktop */}
              {isDesktop && (
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-500/30 rounded-[2rem] blur-2xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ transform: 'translateZ(0)' }}
                />
              )}

              <div className="relative z-10">
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
                  userType={userType}
                  defaultCity={defaultCity}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/50 to-transparent z-[2]" />
      
      {/* ✅ OPTIMIZED: Scroll indicator only on desktop */}
      {isDesktop && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: [0.5, 1, 0.5],
            y: [0, 8, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <span className="text-xs text-slate-600 font-medium">Scroll to explore</span>
          <svg 
            className="w-6 h-6 text-orange-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      )}
    </section>
  )
}