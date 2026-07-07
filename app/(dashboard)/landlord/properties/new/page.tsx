"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, ArrowRight, Upload, X, MapPin,
  Home, Building2, DollarSign, Bed, Bath, Square,
  Wifi, Car, Dumbbell, Shield, Wind, Tv, Coffee,
  Dog, Waves, Zap, CheckCircle, ChevronDown
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

// ── NuloAfrica Pilot: Lagos · Abuja · Port Harcourt ──────────────────────────
// Each neighbourhood carries a lat/lng centroid so the marketplace map can
// pin listings immediately. These map to DB columns:
//   city, state, neighborhood, address, full_address, latitude, longitude, location

interface Neighbourhood {
  id: string
  name: string
  lat: number
  lng: number
  addressHint: string
}

interface PilotCity {
  id: string
  name: string
  state: string
  state_code: string
  lat: number
  lng: number
  neighbourhoods: Neighbourhood[]
}

const PILOT_CITIES: PilotCity[] = [
  {
    id: 'lagos',
    name: 'Lagos',
    state: 'Lagos State',
    state_code: 'LA',
    lat: 6.5244,
    lng: 3.3792,
    neighbourhoods: [
      { id: 'lekki-phase-1',   name: 'Lekki Phase 1',      lat: 6.4280, lng: 3.5148, addressHint: 'e.g. 12 Admiralty Way, Lekki Phase 1' },
      { id: 'lekki-phase-2',   name: 'Lekki Phase 2',      lat: 6.4350, lng: 3.5500, addressHint: 'e.g. 5 Fola Osibo Street, Lekki Phase 2' },
      { id: 'victoria-island', name: 'Victoria Island',    lat: 6.4281, lng: 3.4219, addressHint: 'e.g. 23 Adeola Odeku Street, Victoria Island' },
      { id: 'ikoyi',           name: 'Ikoyi',              lat: 6.4549, lng: 3.4366, addressHint: 'e.g. 7 Bourdillon Road, Ikoyi' },
      { id: 'banana-island',   name: 'Banana Island',      lat: 6.4650, lng: 3.4616, addressHint: 'e.g. 4 Bobo Street, Banana Island' },
      { id: 'badagry',         name: 'Badagry',            lat: 6.4969, lng: 2.8933, addressHint: 'e.g. Badagry Road, Badagry, Lagos' },
      { id: 'ikeja',           name: 'Ikeja',              lat: 6.5958, lng: 3.3398, addressHint: 'e.g. 10 Allen Avenue, Ikeja' },
      { id: 'ikeja-gra',       name: 'Ikeja GRA',          lat: 6.5735, lng: 3.3527, addressHint: 'e.g. 3 Mobolaji Bank Anthony Way, Ikeja GRA' },
      { id: 'surulere',        name: 'Surulere',           lat: 6.4969, lng: 3.3535, addressHint: 'e.g. 15 Bode Thomas Street, Surulere' },
      { id: 'yaba',            name: 'Yaba',               lat: 6.5100, lng: 3.3792, addressHint: 'e.g. 22 Herbert Macaulay Way, Yaba' },
      { id: 'ajah',            name: 'Ajah',               lat: 6.4680, lng: 3.5850, addressHint: 'e.g. Beside Abraham Adesanya Estate, Ajah' },
      { id: 'lagos-island',    name: 'Lagos Island',       lat: 6.4550, lng: 3.3947, addressHint: 'e.g. 8 Campbell Street, Lagos Island' },
      { id: 'apapa',           name: 'Apapa',              lat: 6.4483, lng: 3.3582, addressHint: 'e.g. 1 Creek Road, Apapa' },
      { id: 'ikorodu',         name: 'Ikorodu',            lat: 6.6194, lng: 3.5106, addressHint: 'e.g. 40 Lagos Road, Ikorodu' },
      { id: 'magodo',          name: 'Magodo',             lat: 6.5990, lng: 3.3870, addressHint: 'e.g. 11 CMD Road, Magodo' },
      { id: 'maryland',        name: 'Maryland',           lat: 6.5630, lng: 3.3590, addressHint: 'e.g. 5 Mobolaji Johnson Avenue, Maryland' },
      { id: 'gbagada',         name: 'Gbagada',            lat: 6.5540, lng: 3.3860, addressHint: 'e.g. 3 Hospital Road, Gbagada' },
    ],
  },
  {
    id: 'abuja',
    name: 'Abuja',
    state: 'FCT',
    state_code: 'FC',
    lat: 9.0579,
    lng: 7.4951,
    neighbourhoods: [
      { id: 'maitama',   name: 'Maitama',                   lat: 9.0765, lng: 7.3986, addressHint: 'e.g. 14 Aguiyi Ironsi Street, Maitama' },
      { id: 'asokoro',   name: 'Asokoro',                   lat: 9.0333, lng: 7.5333, addressHint: 'e.g. 5 Tafawa Balewa Way, Asokoro' },
      { id: 'wuse-2',    name: 'Wuse II',                   lat: 9.0600, lng: 7.4800, addressHint: 'e.g. 12 Aminu Kano Crescent, Wuse II' },
      { id: 'wuse',      name: 'Wuse I',                    lat: 9.0833, lng: 7.5000, addressHint: 'e.g. Zone 5, Wuse, Abuja' },
      { id: 'garki',     name: 'Garki',                     lat: 9.0333, lng: 7.4833, addressHint: 'e.g. Plot 8 Moshood Abiola Way, Garki' },
      { id: 'jabi',      name: 'Jabi',                      lat: 9.0500, lng: 7.4333, addressHint: 'e.g. Jabi Lake Road, Jabi' },
      { id: 'gwarinpa',  name: 'Gwarinpa',                  lat: 9.1167, lng: 7.4167, addressHint: 'e.g. 1st Avenue, Gwarinpa Estate' },
      { id: 'kubwa',     name: 'Kubwa',                     lat: 9.0833, lng: 7.3500, addressHint: 'e.g. Phase 4, Kubwa, Abuja' },
      { id: 'life-camp', name: 'Life Camp',                 lat: 9.0900, lng: 7.4100, addressHint: 'e.g. 3 Nile Street, Life Camp' },
      { id: 'utako',     name: 'Utako',                     lat: 9.0667, lng: 7.4667, addressHint: 'e.g. Plot 14 Uke Street, Utako' },
      { id: 'katampe',   name: 'Katampe',                   lat: 9.0850, lng: 7.4550, addressHint: 'e.g. Katampe Extension, Abuja' },
      { id: 'lugbe',     name: 'Lugbe',                     lat: 8.9833, lng: 7.4167, addressHint: 'e.g. Airport Road, Lugbe' },
      { id: 'cbd',       name: 'Central Business District', lat: 9.0500, lng: 7.5000, addressHint: 'e.g. Plot 433 Herbert Macaulay Way, CBD' },
    ],
  },
  {
    id: 'port-harcourt',
    name: 'Port Harcourt',
    state: 'Rivers State',
    state_code: 'RI',
    lat: 4.8156,
    lng: 7.0498,
    neighbourhoods: [
      { id: 'old-gra',     name: 'Old GRA',       lat: 4.8167, lng: 7.0500, addressHint: 'e.g. 3 Peter Odili Road, Old GRA' },
      { id: 'new-gra',     name: 'New GRA',       lat: 4.8200, lng: 7.0600, addressHint: 'e.g. 15 Rumuola Road, New GRA' },
      { id: 'elekahia',    name: 'Elekahia',      lat: 4.8333, lng: 7.0500, addressHint: 'e.g. 7 Elekahia Road, Port Harcourt' },
      { id: 'rumuola',     name: 'Rumuola',       lat: 4.8500, lng: 7.0667, addressHint: 'e.g. 22 Rumuola Road, Port Harcourt' },
      { id: 'rumuokwuta',  name: 'Rumuokwuta',    lat: 4.8500, lng: 7.0333, addressHint: 'e.g. 5 Rumuokwuta Road, Port Harcourt' },
      { id: 'trans-amadi', name: 'Trans Amadi',   lat: 4.8667, lng: 7.0500, addressHint: 'e.g. Trans Amadi Industrial Layout, PH' },
      { id: 'd-line',      name: 'D-Line',        lat: 4.8300, lng: 7.0450, addressHint: 'e.g. 10 Stadium Road, D-Line' },
      { id: 'rumuigbo',    name: 'Rumuigbo',      lat: 4.8600, lng: 7.0200, addressHint: 'e.g. Rumuigbo, Obio-Akpor' },
      { id: 'ada-george',  name: 'Ada George',    lat: 4.8750, lng: 7.0250, addressHint: 'e.g. Ada George Road, Port Harcourt' },
      { id: 'woji',        name: 'Woji',          lat: 4.8400, lng: 7.0100, addressHint: 'e.g. Woji Road, Port Harcourt' },
      { id: 'peter-odili', name: 'Peter Odili',   lat: 4.8250, lng: 7.0400, addressHint: 'e.g. Peter Odili Road, PH' },
    ],
  },
]

// ── Property types & amenities ────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { id: 'apartment',  label: 'Apartment',  icon: Building2 },
  { id: 'house',      label: 'House',      icon: Home },
  { id: 'condo',      label: 'Condo',      icon: Building2 },
  { id: 'townhouse',  label: 'Townhouse',  icon: Home },
  { id: 'studio',     label: 'Studio',     icon: Building2 },
  { id: 'duplex',     label: 'Duplex',     icon: Home },
]

const AMENITIES = [
  { id: 'wifi',      label: 'WiFi',           icon: Wifi },
  { id: 'parking',   label: 'Parking',        icon: Car },
  { id: 'gym',       label: 'Gym',            icon: Dumbbell },
  { id: 'security',  label: '24/7 Security',  icon: Shield },
  { id: 'ac',        label: 'Air Conditioning',icon: Wind },
  { id: 'tv',        label: 'Cable TV',       icon: Tv },
  { id: 'kitchen',   label: 'Full Kitchen',   icon: Coffee },
  { id: 'pets',      label: 'Pet Friendly',   icon: Dog },
  { id: 'pool',      label: 'Swimming Pool',  icon: Waves },
  { id: 'generator', label: 'Generator',      icon: Zap },
]

// ── Form types ────────────────────────────────────────────────────────────────
interface PropertyFormData {
  title: string
  description: string
  property_type: string
  // Location — maps directly to DB columns
  city: string           // e.g. "Lagos"
  state: string          // e.g. "Lagos State"
  country: string
  neighborhood: string   // e.g. "Lekki Phase 1"
  address: string        // street address typed by landlord
  full_address: string   // computed: "{address}, {neighborhood}, {city}, {state}, Nigeria"
  location: string       // short display: "{neighborhood}, {city}"
  latitude: number | null
  longitude: number | null
  // Rest of form
  price: number
  // payment_frequency: how often the rent is collected. Drives the FULL_PAYMENT
  // threshold in nomba.py:calculate_expected_amount (rent * frequency multiplier).
  // Stored on properties.payment_frequency (varchar, check constraint
  // properties_payment_frequency_check). Must match DB values:
  //   ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')
  // Defaults to MONTHLY for back-compat.
  payment_frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL'
  bedrooms: number
  bathrooms: number
  sqft: number
  amenities: string[]
  images: File[]
  coverImageIndex: number  // index of image designated as cover photo
  available_from: string
}

export default function AddPropertyPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_type: '',
    city: '',
    state: '',
    country: 'Nigeria',
    neighborhood: '',
    address: '',
    full_address: '',
    location: '',
    latitude: null,
    longitude: null,
    price: 0,
    payment_frequency: 'MONTHLY',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 0,
    amenities: [],
    images: [],
    coverImageIndex: 0,
    available_from: '',
  })

  const totalSteps = 5

  // ── Stage 3 polish: Generate NUBAN opt-in ────────────────────────────────
  // The landlord can opt into auto-provisioning a Nomba virtual account
  // (NUBAN) for this property the moment it's created. The flag is sent
  // with the property payload; the backend handles the actual /provision-nomba
  // call once the property has an id. Default is OFF so landlords who
  // don't want auto-NUBAN can opt out.
  const [generateNuban, setGenerateNuban] = useState(false)

  // ── ONBD-09: Frontend safety net. The backend already rejects this
  //    (properties.py create_property + DB trigger), but we also block
  //    here so a rejected/pending landlord who navigates directly to
  //    /landlord/properties/new sees a friendly redirect instead of an
  //    empty form that will explode on submit.
  useEffect(() => {
    if (user && (user.verification_status === 'rejected' || user.verification_status !== 'approved')) {
      const message = user.verification_status === 'rejected' 
        ? 'Your landlord account was rejected. You cannot create new properties. Please contact support to re-verify.'
        : 'Your verification is pending. You can list properties once your account is approved.'
      toast.error(message)
      router.replace('/landlord/properties')
    }
  }, [user, router])

  // Hard guard: render nothing while we redirect rejected/pending landlords.
  // Placed AFTER all hooks to satisfy the rules-of-hooks.
  if (user && (user.verification_status === 'rejected' || user.verification_status !== 'approved')) {
    return null
  }

  const updateFormData = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // When a city card is clicked — set city + state, clear neighbourhood
  const handleCitySelect = (city: PilotCity) => {
    setFormData(prev => ({
      ...prev,
      city: city.name,
      state: city.state,
      neighborhood: '',
      address: '',
      full_address: '',
      location: '',
      latitude: null,
      longitude: null,
    }))
  }

  // When a neighbourhood is clicked — set neighbourhood + derive lat/lng + recompute full_address
  const handleNeighbourhoodSelect = (nb: Neighbourhood) => {
    setFormData(prev => {
      const full = prev.address
        ? `${prev.address}, ${nb.name}, ${prev.state}, Nigeria`
        : `${nb.name}, ${prev.state}, Nigeria`
      return {
        ...prev,
        neighborhood: nb.name,
        latitude: nb.lat,
        longitude: nb.lng,
        location: `${nb.name}, ${prev.city}`,
        full_address: full,
      }
    })
  }

  // When address is typed — recompute full_address
  const handleAddressChange = (address: string) => {
    setFormData(prev => {
      const full = address
        ? `${address}, ${prev.neighborhood}, ${prev.state}, Nigeria`
        : `${prev.neighborhood}, ${prev.state}, Nigeria`
      return { ...prev, address, full_address: full }
    })
  }

  const toggleAmenity = (amenityId: string) => {
    const amenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(id => id !== amenityId)
      : [...formData.amenities, amenityId]
    updateFormData('amenities', amenities)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    // If this is the first upload, set first image as cover
    const newCoverIndex = formData.images.length === 0 ? 0 : formData.coverImageIndex
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      coverImageIndex: newCoverIndex
    }))
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    let newCoverIndex = formData.coverImageIndex
    
    // Adjust cover index if removed image was the cover or came before it
    if (index < formData.coverImageIndex) {
      newCoverIndex = formData.coverImageIndex - 1
    } else if (index === formData.coverImageIndex && index >= newImages.length) {
      // If we removed the cover image and it was the last one, set to previous
      newCoverIndex = Math.max(0, newImages.length - 1)
    }
    
    setFormData(prev => ({
      ...prev,
      images: newImages,
      coverImageIndex: newCoverIndex
    }))
  }

  const setCoverImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coverImageIndex: index
    }))
    toast.success('Cover photo updated')
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: return !!(formData.title && formData.description && formData.property_type)
      case 2: return !!(formData.city && formData.neighborhood && formData.address)
      case 3: return formData.price > 0
      case 4: return formData.bedrooms > 0 && formData.bathrooms > 0
      case 5: return formData.images.length > 0
      default: return true
    }
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      setLoading(true)
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('property_type', formData.property_type)
      submitData.append('city', formData.city)
      submitData.append('state', formData.state)
      submitData.append('country', formData.country)
      submitData.append('address', formData.address)
      submitData.append('neighborhood', formData.neighborhood)
      submitData.append('full_address', formData.full_address)
      // Stage 3 polish: pass the opt-in flag so the backend knows to fire
      // /provision-nomba after the property row is created.
      submitData.append('generate_nuban', generateNuban ? 'true' : 'false')
      
      // Only append the cover image (first image is always sent first, but we'll ensure cover is first in array)
      // In reality, the API should accept coverImageIndex or we reorder on backend
      // For now, all images are appended - backend can use the first one as cover
      submitData.append('location', formData.location)
      if (formData.latitude !== null)  submitData.append('latitude',  String(formData.latitude))
      if (formData.longitude !== null) submitData.append('longitude', String(formData.longitude))
      submitData.append('price', String(formData.price))
      submitData.append('payment_frequency', formData.payment_frequency)
      submitData.append('beds',  String(formData.bedrooms))
      submitData.append('baths', String(formData.bathrooms))
      if (formData.sqft)           submitData.append('sqft',           String(formData.sqft))
      if (formData.available_from) submitData.append('available_from', formData.available_from)
      submitData.append('amenities', JSON.stringify(formData.amenities))
      formData.images.forEach(image => submitData.append('images', image))

      await propertiesAPI.create(submitData)
      toast.success('🎉 Property listed successfully!')
      router.push('/landlord/properties')
    } catch (error: any) {
      console.error('Failed to create property:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create property'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ── Step renderers ─────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {

      // ── Step 1: Basic info ────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-700 font-medium">Property Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern 2BR Apartment in Victoria Island"
                  value={formData.title}
                  onChange={e => updateFormData('title', e.target.value)}
                  className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-700 font-medium">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property in detail..."
                  value={formData.description}
                  onChange={e => updateFormData('description', e.target.value)}
                  rows={4}
                  className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Property Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {PROPERTY_TYPES.map(type => {
                    const Icon = type.icon
                    const isSelected = formData.property_type === type.id
                    return (
                      <button key={type.id} type="button" onClick={() => updateFormData('property_type', type.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                          isSelected ? 'border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-white' : 'border-slate-200 hover:border-orange-300 bg-white'
                        }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>{type.label}</span>
                        {isSelected && <CheckCircle className="h-4 w-4 text-orange-500 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 2: Location — guided 3-step picker ───────────────────────────
      case 2: {
        const selectedCity = PILOT_CITIES.find(c => c.name === formData.city) ?? null
        const selectedNb   = selectedCity?.neighbourhoods.find(n => n.name === formData.neighborhood) ?? null

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Location</h3>
              <p className="text-sm text-slate-500 mt-1">
                NuloAfrica is currently available in 3 cities during the pilot phase.
              </p>
            </div>

            {/* ① City picker */}
            <div>
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select City *
              </Label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {PILOT_CITIES.map(city => {
                  const isSelected = formData.city === city.name
                  return (
                    <button key={city.id} type="button" onClick={() => handleCitySelect(city)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        isSelected ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-white shadow-lg' : 'border-slate-200 hover:border-orange-300 bg-white'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-orange-500' : 'bg-orange-100'}`}>
                        <MapPin className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-slate-800'}`}>{city.name}</p>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`}>{city.state}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-4 w-4 text-orange-500" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ② Neighbourhood picker — only shown once a city is chosen */}
            {selectedCity && (
              <div>
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Select Neighbourhood / Area *
                </Label>
                <div className="relative mt-3">
                  <select
                    value={formData.neighborhood}
                    onChange={e => {
                      const nb = selectedCity.neighbourhoods.find(n => n.name === e.target.value)
                      if (nb) handleNeighbourhoodSelect(nb)
                    }}
                    className="w-full appearance-none border-2 border-slate-300 rounded-xl px-4 py-3 pr-10 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all bg-white text-slate-900"
                  >
                    <option value="">Choose a neighbourhood in {selectedCity.name}...</option>
                    {selectedCity.neighbourhoods.map(nb => (
                      <option key={nb.id} value={nb.name}>{nb.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* ③ Street address — only shown once a neighbourhood is chosen */}
            {selectedNb && (
              <div>
                <Label htmlFor="address" className="text-slate-700 font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Street Address *
                </Label>
                <Textarea
                  id="address"
                  placeholder={selectedNb.addressHint}
                  value={formData.address}
                  onChange={e => handleAddressChange(e.target.value)}
                  rows={2}
                  className="mt-3 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Include the house/flat number, street name, and any estate name if applicable.
                </p>
              </div>
            )}

            {/* Full address preview + map pin confirmation */}
            {formData.city && formData.neighborhood && formData.address && (
              <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">Location confirmed ✓</p>
                    <p className="text-sm text-orange-700 mt-0.5">{formData.full_address}</p>
                    {formData.latitude && (
                      <p className="text-xs text-orange-400 mt-1">
                        Map pin: {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)} — your property will appear on the map at this location.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pilot notice */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-lg">🚀</span>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Pilot phase:</span> NuloAfrica is launching in Lagos, Abuja, and Port Harcourt. More cities coming soon.
              </p>
            </div>
          </div>
        )
      }

      // ── Step 3: Pricing ───────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Pricing</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-slate-700 font-medium">Monthly Rent (₦) *</Label>
                <div className="relative mt-2">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₦</span>
                    </div>
                  </div>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.price || ''}
                    onChange={e => {
                      // Parse the value and ensure no leading zeros
                      const rawValue = e.target.value.replace(/^0+(?=\d)/, '')
                      const numValue = rawValue === '' ? 0 : parseInt(rawValue) || 0
                      updateFormData('price', numValue)
                    }}
                    // Remove native spinner for better UX with large values
                    onWheel={e => e.currentTarget.blur()}
                    className="pl-12 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 hide-spinner"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="available_from" className="text-slate-700 font-medium">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={e => updateFormData('available_from', e.target.value)}
                  className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Payment Frequency</Label>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  How often do you collect rent? Tenants will see this and the FULL_PAYMENT threshold updates automatically.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { id: 'MONTHLY',    label: 'Monthly',    hint: 'Every month' },
                    { id: 'QUARTERLY',  label: 'Quarterly',  hint: 'Every 3 months' },
                    { id: 'SEMI_ANNUAL',label: 'Semi-Annual',hint: 'Every 6 months' },
                    { id: 'ANNUAL',     label: 'Annual',     hint: 'Once a year' },
                  ] as const).map((opt) => {
                    const isSelected = formData.payment_frequency === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateFormData('payment_frequency', opt.id)}
                        className={
                          'p-3 rounded-xl border-2 text-left transition ' +
                          (isSelected
                            ? 'border-orange-500 shadow-lg bg-gradient-to-br from-orange-50 to-white'
                            : 'border-slate-200 hover:border-orange-300 bg-white')
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span className={'text-sm font-semibold ' + (isSelected ? 'text-orange-700' : 'text-slate-700')}>
                            {opt.label}
                          </span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-orange-500" />}
                        </div>
                        <p className={'text-xs mt-1 ' + (isSelected ? 'text-orange-600' : 'text-slate-400')}>
                          {opt.hint}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
              {formData.price > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 text-orange-800">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Monthly Rent: ₦{formData.price.toLocaleString()}</p>
                      <p className="text-sm text-orange-600 mt-1">Annual: ₦{(formData.price * 12).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      // ── Step 4: Features & amenities ──────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Features & Amenities</h3>
            <div className="space-y-6">
              <div>
                <Label className="text-slate-700 font-medium">Basic Features *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {[
                    { id: 'bedrooms', label: 'Bedrooms', icon: Bed, min: 1, step: 1 },
                    { id: 'bathrooms', label: 'Bathrooms', icon: Bath, min: 1, step: 1 },
                    { id: 'sqft', label: 'Square Feet', icon: Square, min: 0, placeholder: 'Optional', step: 100 },
                  ].map(field => {
                    const Icon = field.icon
                    return (
                      <div key={field.id}>
                        <Label htmlFor={field.id} className="text-sm text-slate-600 font-medium">{field.label}</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Icon className="h-4 w-4 text-orange-500" />
                          </div>
                          <Input
                            id={field.id}
                            type="number"
                            min={field.min}
                            step={field.step}
                            placeholder={field.placeholder}
                            value={(formData as any)[field.id] || ''}
                            onChange={e => updateFormData(field.id as any, parseInt(e.target.value) || (field.min === 1 ? 1 : 0))}
                            onWheel={e => e.currentTarget.blur()}
                            className="border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 hide-spinner"
                            style={{ MozAppearance: 'textfield' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                  {AMENITIES.map(amenity => {
                    const Icon = amenity.icon
                    const isSelected = formData.amenities.includes(amenity.id)
                    return (
                      <button key={amenity.id} type="button" onClick={() => toggleAmenity(amenity.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                          isSelected ? 'border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-white' : 'border-slate-200 hover:border-orange-300 bg-white'
                        }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>{amenity.label}</span>
                        {isSelected && <CheckCircle className="h-4 w-4 text-orange-500 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 5: Photos ────────────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Property Photos</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center bg-gradient-to-br from-orange-50 to-white">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-orange-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Upload Property Photos</h4>
                <p className="text-slate-600 mb-4">Showcase your property with high-quality images</p>
                <p className="text-sm text-slate-500 mb-6">Maximum 10 images, JPG or PNG format</p>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Button type="button" variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                  <Upload className="h-4 w-4 mr-2" /> Choose Files
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div>
                  <Label className="text-slate-700 font-medium">Uploaded Images ({formData.images.length}/10)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                          index === formData.coverImageIndex
                            ? 'border-4 border-yellow-400 ring-2 ring-yellow-300'
                            : 'border-slate-200 group-hover:border-orange-300'
                        }`}>
                          <img src={URL.createObjectURL(image)} alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        
                        {/* Remove button */}
                        <button type="button" onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-10">
                          <X className="h-3 w-3" />
                        </button>
                        
                        {/* Set as cover button */}
                        {index !== formData.coverImageIndex && (
                          <button type="button" onClick={() => setCoverImage(index)}
                            className="absolute bottom-2 left-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                            Set as Cover
                          </button>
                        )}
                        
                        {/* Cover badge */}
                        {index === formData.coverImageIndex && (
                          <div className="absolute bottom-2 left-2">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-lg shadow-lg border border-yellow-300">⭐ Cover Photo</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-4 rounded-2xl mt-4">
                    <div className="flex items-center gap-3 text-orange-700">
                      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">Click "Set as Cover" on any image to designate it as the cover photo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ── Page shell ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header — matches viewings and application detail page pattern */}
        <div className="mb-8">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Add New Property
              </h1>
              <p className="text-slate-600">
                List your property for rent with our premium platform
              </p>
            </div>
            {/* Primary action could go here if needed */}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-orange-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
        </div>

        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}
            className="border-2 border-slate-300 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <Button onClick={nextStep}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !validateStep(currentStep)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Creating...</>
                ) : (
                  <>Create Property <Building2 className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}