import { MapPin } from "lucide-react"

interface PreferencesStepProps {
  formData: {
    location: string
  }
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

// ✅ Nigerian cities only - organized by popularity
const NIGERIAN_CITIES = [
  // Major cities (most searched)
  { value: "lagos", label: "Lagos", state: "Lagos State" },
  { value: "abuja", label: "Abuja", state: "FCT" },
  { value: "port-harcourt", label: "Port Harcourt", state: "Rivers State" },
  
  // Other major cities
  { value: "ibadan", label: "Ibadan", state: "Oyo State" },
  { value: "kano", label: "Kano", state: "Kano State" },
  { value: "benin-city", label: "Benin City", state: "Edo State" },
  { value: "jos", label: "Jos", state: "Plateau State" },
  { value: "kaduna", label: "Kaduna", state: "Kaduna State" },
  { value: "enugu", label: "Enugu", state: "Enugu State" },
  { value: "abeokuta", label: "Abeokuta", state: "Ogun State" },
  { value: "calabar", label: "Calabar", state: "Cross River State" },
  { value: "warri", label: "Warri", state: "Delta State" },
  { value: "owerri", label: "Owerri", state: "Imo State" },
  { value: "uyo", label: "Uyo", state: "Akwa Ibom State" },
  { value: "ilorin", label: "Ilorin", state: "Kwara State" },
]

export function PreferencesStep({ formData, errors, onChange }: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Where are you looking to rent?
        </h3>
        <p className="text-sm text-slate-600">
          Select your preferred city to see relevant properties
        </p>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
          Preferred City *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={onChange}
            className={`w-full h-12 pl-10 pr-4 rounded-xl border-2 transition-all duration-300 appearance-none cursor-pointer ${
              errors.location 
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20'
            } focus:outline-none text-slate-800`}
          >
            <option value="">Select your city</option>
            
            {/* Popular cities first */}
            <optgroup label="🔥 Popular Cities">
              {NIGERIAN_CITIES.slice(0, 3).map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}, {city.state}
                </option>
              ))}
            </optgroup>
            
            {/* Other cities */}
            {/* <optgroup label="Other Cities">
              {NIGERIAN_CITIES.slice(3).map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}, {city.state}
                </option>
              ))}
            </optgroup> */}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {errors.location && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
            {errors.location}
          </p>
        )}
        
        <p className="mt-2 text-xs text-slate-500">
          💡 You can search in other cities later from your dashboard
        </p>
      </div>

      {/* Quick Stats - Optional but nice touch */}
      {formData.location && (
        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-100">
          <p className="text-sm text-orange-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Great choice! We have{" "}
            <span className="font-semibold">
              {formData.location === 'lagos' ? '10+' : 
               formData.location === 'abuja' ? '5+' : 
               formData.location === 'port-harcourt' ? '3+' : '2+'}
            </span>{" "}
            verified properties in{" "}
            {NIGERIAN_CITIES.find(c => c.value === formData.location)?.label}
          </p>
        </div>
      )}
    </div>
  )
}