import { useState, useEffect } from 'react'
import { locationsAPI } from '@/lib/api/locations'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin } from 'lucide-react'

interface LocationSelectorProps {
  selectedState: string
  selectedCity: string
  onStateChange: (state: string) => void
  onCityChange: (city: string) => void
  onCityNameChange?: (cityName: string) => void
  required?: boolean
}

interface CityData {
  id: string
  name: string
  state_code: string
  lat?: number
  lng?: number
}

export function LocationSelector({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  onCityNameChange,
  required = true
}: LocationSelectorProps) {
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<CityData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)

  // Load states on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await locationsAPI.getStates()
        setStates(response.states || [])
      } catch (error) {
        console.error('Failed to load states:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStates()
  }, [])

  // Load cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([])
      return
    }

    const fetchCities = async () => {
      setLoadingCities(true)
      try {
        const response = await locationsAPI.getCities(selectedState)
        setCities(response.cities || [])
        // Reset city selection when state changes
        onCityChange('')
        if (onCityNameChange) {
          onCityNameChange('')
        }
      } catch (error) {
        console.error('Failed to load cities:', error)
        setCities([])
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [selectedState, onCityChange, onCityNameChange])

  const handleStateChange = (value: string) => {
    onStateChange(value)
  }

  const handleCityChange = (value: string) => {
    onCityChange(value)
    
    // Find the city data and pass the name
    const selectedCityData = cities.find(c => c.id === value)
    if (selectedCityData && onCityNameChange) {
      onCityNameChange(selectedCityData.name)
    }
  }

  const stateCode = states.find(s => s.name === selectedState)?.state_code

  return (
    <div className="space-y-4">
      {/* State Selection */}
      <div>
        <Label htmlFor="state" className="text-slate-700 font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          State/Region {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={selectedState} onValueChange={handleStateChange} disabled={loading}>
          <SelectTrigger 
            id="state"
            className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
          >
            <SelectValue placeholder="Select state or region..." />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.id} value={state.name}>
                <div className="flex items-center gap-2">
                  <span>{state.name}</span>
                  <span className="text-xs text-slate-500">({state.state_code})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      {selectedState && (
        <div>
          <Label htmlFor="city" className="text-slate-700 font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            City/Area {required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={selectedCity} onValueChange={handleCityChange} disabled={loadingCities}>
            <SelectTrigger 
              id="city"
              className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
            >
              <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city or area..."} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  <div className="flex items-center gap-2">
                    <span>{city.name}</span>
                    <span className="text-xs text-slate-500">({stateCode})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info Box */}
      {selectedState && selectedCity && (
        <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-4 rounded-2xl">
          <div className="flex items-center gap-3 text-orange-700">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium">Location Selected</p>
              <p className="text-orange-600">
                {cities.find(c => c.id === selectedCity)?.name}, {selectedState}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
