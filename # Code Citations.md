# Code Citations

## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: GPL-2.0
https://github.com/specify/specify7/blob/81d7139a237ce1bfeb622a11d7ca9d9776f7e4f3/specifyweb/frontend/js_src/lib/components/icons.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/toffeenut/toffeenut.github.io/blob/8c4d289485f006468fbc01d29eca031889818bb7/schedule/pages/integrations/index.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/kesne/HostyHosting/blob/9bbcff7c7a617a0177bc965b5b8a066b726ea177/packages/frontend/src/components/ui/List.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```


## License: unknown
https://github.com/alvinleung/daybreak-pattern-generator/blob/62572d24ae9752ee387023e0166dcd646cc52168/src/components/PatternBuilder/ElementPalette.tsx

```
I'll help you update the actual HeroSection.tsx file with all the improvements. Let me create the complete updated version with your SearchBar component integrated:

````tsx
// filepath: c:\Users\ALEX\Documents\Nuelo_Poc\NULO-DEV\client\components\home\HeroSection.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Building2, Sparkles, Search, CheckCircle } from 'lucide-react'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
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

  // ✅ Animation variants for reusability
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

        {/* Premium Noise & Grain Texture Overlay */}
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
        {isDesktop && (
          <>
            {/* Animated Blob 1 */}
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
            {/* Animated Blob 2 */}
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
            {/* Animated Blob 3 */}
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

      {/* Main Content Container - ✅ IMPROVED SPACING */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-14 lg:mb-16"
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

          {/* ✅ NEW: Animated Journey Flow with better spacing */}
          <motion.div
            variants={itemVariants}
            className="mb-12 md:mb-16 px-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto">
              {[
                { icon: Search, label: 'Search', description: 'Location & Type' },
                { icon: Sparkles, label: 'Discover', description: 'Verified Homes' },
                { icon: CheckCircle, label: 'Apply', description: 'Book Viewing' }
              ].map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={`step-${index}`} className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left flex-1 sm:flex-none">
                      <p className="font-black text-slate-900 text-sm sm:text-base">{step.label}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{step.description}</p>
                    </div>
                    {index < 2 && (
                      <div className="hidden sm:block text-orange-400 ml-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12 md:mb-16 px-4"
          >
            {/* Tenant Button */}
            <motion.div className="relative group w-full sm:w-auto">
              <motion.button
                onClick={() => handleUserTypeClick('tenant')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg sm:shadow-xl shadow-orange-500/25 hover:shadow-orange-600/50 border border-orange-400/30"
                aria-label="I'm a Tenant - Find verified homes and apartments"
              >
                <div className="flex items-center justify-center gap-2">
                  <Home className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Tenant</span>
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
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500 bg-white/90 backdrop-blur-xl text-slate-800 border-2 border-orange-200/60 hover:bg-gradient-to-r hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 hover:text-white hover:border-orange-500 shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
                aria-label="I'm a Property Manager - List and manage rental properties"
              >
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 sm:h-5 sm:w-5" />
                  <span>I'm a Property Manager</span>
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
              transition={{ duration: 0.3
```

