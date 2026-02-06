import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface City {
  name: string
  state?: string
  country: string
  properties: number
  description: string
  image: string
  loading?: boolean
}

interface PopularCitiesSectionProps {
  cities: City[]
  loading?: boolean
}

export function PopularCitiesSection({ cities, loading }: PopularCitiesSectionProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
      {/* Background Elements - Matching your style */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div 
          className="absolute bottom-20 left-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" 
          style={{animationDelay: '2s', animationDuration: '4s'}}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header - Matching your text style */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-50 text-orange-700 border-0 px-4 py-2">
            <MapPin className="h-3 w-3 inline mr-2" />
            Explore Nigeria
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
            Popular <span className="text-orange-600">Cities</span>
          </h2>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Discover verified properties in Nigeria's major cities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cities.map((city, index) => (
            <Link key={index} href={`/properties?location=${city.name}`}>
              <Card className="group relative bg-white/90 backdrop-blur-sm border-white/50 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 cursor-pointer overflow-hidden h-[400px] animate-fade-in-up" style={{animationDelay: `${0.4 + index * 0.1}s`}}>
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                  <img
                    src={city.image || "/placeholder.svg"}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient Overlay - Matching your style */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  {/* Animated Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>

                {/* Content */}
                <CardContent className="relative z-10 h-full flex flex-col justify-end p-8">
                  {/* Property Count Badge with Loading State */}
                  <Badge className="absolute top-6 right-6 bg-orange-500 text-white border-0 px-4 py-2 shadow-lg">
                    {city.loading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `${city.properties} Properties`
                    )}
                  </Badge>

                  {/* City Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors duration-300">
                        {city.name}
                      </h3>
                      <p className="text-orange-400 font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {city.country}
                      </p>
                    </div>
                    
                    <p className="text-white/90 text-sm">
                      {city.description}
                    </p>

                    {/* Explore Button */}
                    <div className="flex items-center gap-2 text-white font-semibold pt-4 group-hover:gap-4 transition-all duration-300">
                      <span>Explore Properties</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>

                {/* Decorative Corner */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  )
}