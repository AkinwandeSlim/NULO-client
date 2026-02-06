"use client"

import { useState, useEffect, useRef } from "react"
import { motion, Variants } from "framer-motion"
import { Footer } from "@/components/footer"
import { 
  HeroSection, 
  FeaturesSection, 
  StatsSection, 
  HowItWorksSection,
  PopularCitiesSection,
  TestimonialsSection,
  CTASection,
  FeaturedPropertiesSection
} from "@/components/home"
import { propertiesAPI } from "@/lib/api/properties"
import { toast } from "sonner"

// ✅ REMOVED: Hardcoded cities - now fetched from API
// const NIGERIAN_CITIES = [...] 

export default function HomePage() {
  const [location, setLocation] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [propertyType, setPropertyType] = useState("all")
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // ✅ FIXED: Real stats from dedicated API endpoint
  const [realStats, setRealStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    verifiedLandlords: 0,
    citiesCovered: 0,
    newThisWeek: 0,
    verificationRate: 95,
    avgResponseTime: "< 24h",
    loading: true
  })
  
  // ✅ FIXED: Cities from dedicated API endpoint
  const [citiesWithCounts, setCitiesWithCounts] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  
  // ✅ IMPROVED: Featured properties from dedicated endpoint
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  const locationInputRef = useRef<HTMLInputElement | null>(null)

  // ✅ FIXED: Fetch REAL statistics from dedicated endpoint
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        console.log('📊 Fetching real platform statistics...')
        
        // Call the new stats API endpoint
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/stats/platform-summary`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        
        const data = await response.json()
        console.log('✅ Real stats received:', data)
        
        setRealStats({
          totalProperties: data.total_properties || 0,
          activeTenants: data.active_tenants || 0,  // ✅ REAL count from database
          verifiedLandlords: data.verified_landlords || 0,  // ✅ REAL count
          citiesCovered: data.cities_covered || 3,  // ✅ REAL count
          newThisWeek: data.new_this_week || 0,  // ✅ REAL count from last 7 days
          verificationRate: data.verification_rate || 95,
          avgResponseTime: data.avg_response_time || "< 24h",
          loading: false
        })
        
      } catch (error) {
        console.error('❌ Failed to fetch stats:', error)
        
        // Fallback to basic count if stats endpoint fails
        try {
          const propertiesResponse = await propertiesAPI.search({
            page: 1,
            limit: 1
          })
          
          const total = propertiesResponse.pagination?.total || 0
          
          setRealStats({
            totalProperties: total,
            activeTenants: 0,  // Unknown without stats endpoint
            verifiedLandlords: 0,  // Unknown without stats endpoint
            citiesCovered: 3,
            newThisWeek: 0,
            verificationRate: 95,
            avgResponseTime: "< 24h",
            loading: false
          })
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
          setRealStats(prev => ({ ...prev, loading: false }))
        }
      }
    }

    fetchRealStats()
  }, [])

  // ✅ FIXED: Fetch cities from single API call (not 3 separate calls)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true)
        console.log('🌆 Fetching cities summary...')
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/locations/cities-summary`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch cities')
        }
        
        const data = await response.json()
        console.log('✅ Cities received:', data)
        
        // Map to match your component's expected format
        const cities = data.cities.map((city: any) => ({
          name: city.name,
          state: city.state,
          country: city.country,
          image: city.image_url,
          description: city.description,
          properties: city.property_count,
          loading: false
        }))
        
        setCitiesWithCounts(cities)
        
      } catch (error) {
        console.error('❌ Failed to fetch cities:', error)
        
        // Fallback to manual counting if API fails
        const FALLBACK_CITIES = [
          {
            name: "Lagos",
            state: "Lagos State",
            country: "Nigeria",
            image: "/lagos-victoria-island-skyline.jpg",
            description: "Nigeria's commercial capital with vibrant city life",
          },
          {
            name: "Abuja",
            state: "FCT",
            country: "Nigeria",
            image: "/contemporary-townhouse-johannesburg.jpg",
            description: "Nigeria's modern capital city with planned infrastructure",
          },
          {
            name: "Port Harcourt",
            state: "Rivers State",
            country: "Nigeria",
            image: "/citywaker1.png",
            description: "The Garden City - Nigeria's oil and gas hub",
          },
        ]
        
        // Try to get counts for fallback cities
        try {
          const citiesWithFallbackCounts = await Promise.all(
            FALLBACK_CITIES.map(async (city) => {
              try {
                const response = await propertiesAPI.search({
                  location: city.name,
                  page: 1,
                  limit: 1
                })
                
                return {
                  ...city,
                  properties: response.pagination?.total || 0,
                  loading: false
                }
              } catch {
                return {
                  ...city,
                  properties: 0,
                  loading: false
                }
              }
            })
          )
          
          setCitiesWithCounts(citiesWithFallbackCounts)
        } catch {
          // If all fails, just use default cities with 0 count
          setCitiesWithCounts(FALLBACK_CITIES.map(city => ({
            ...city,
            properties: 0,
            loading: false
          })))
        }
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [])

  // ✅ IMPROVED: Fetch featured properties from dedicated endpoint
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoadingProperties(true)
        console.log('🌟 Fetching featured properties...')
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/featured?limit=6`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured properties')
        }
        
        const data = await response.json()
        const propertiesArray = data.properties || data.data || data || []
        console.log('✅ Featured properties received:', propertiesArray.length || 0)
        
        setFeaturedProperties(propertiesArray.length > 0 ? propertiesArray : [])
        
      } catch (error) {
        console.error('❌ Failed to fetch featured properties:', error)
        
        // Fallback to search endpoint
        try {
          const response = await propertiesAPI.search({
            page: 1,
            limit: 6,
            sort: 'newest'
          })
          
          // Prefer featured, fallback to newest
          const featured = response.properties?.filter((p: any) => p.featured) || []
          const toShow = featured.length > 0 ? featured : response.properties?.slice(0, 6) || []
          
          console.log('✅ Using fallback featured properties:', toShow.length)
          setFeaturedProperties(toShow)
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
          // Don't show error toast - silently fallback to empty
          setFeaturedProperties([])
        }
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchFeaturedProperties()
  }, [])

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`
    return `₦${value.toLocaleString()}`
  }

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden relative">
      {/* Background Textures */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 texture-dots opacity-5" />
        <div className="absolute inset-0 texture-square-grid opacity-8" />
        <div className="absolute inset-0 texture-noise opacity-10" />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          location={location}
          setLocation={setLocation}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          locationInputRef={locationInputRef}
          defaultCity="Abuja" // ✅ Change to 'Abuja' or 'Port Harcourt' for other cities
        />

        {/* Features Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <FeaturesSection />
        </motion.div>

        {/* Stats Section with REAL DATA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <StatsSection 
            stats={realStats}  // ✅ Pass real stats
            loading={realStats.loading}
          />
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <HowItWorksSection />
        </motion.div>

        {/* Featured Properties */}
        {featuredProperties.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <FeaturedPropertiesSection
              properties={featuredProperties}
              loading={loadingProperties}
              formatPrice={formatPrice}
            />
          </motion.div>
        )}

        {/* Popular Cities */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <PopularCitiesSection 
            cities={citiesWithCounts}
            loading={loadingCities}  // ✅ Use separate loading state
          />
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <TestimonialsSection />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <CTASection />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionVariants}
        >
          <Footer />
        </motion.div>
      </div>
    </div>
  )
}