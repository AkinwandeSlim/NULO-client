import Link from "next/link"
import { ArrowRight, Bed, Bath } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Property {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths: number
  images: string[]
  featured?: boolean
}

interface FeaturedPropertiesSectionProps {
  properties: Property[]
  loading?: boolean
  formatPrice: (price: number) => string
}

export function FeaturedPropertiesSection({ 
  properties, 
  loading, 
  formatPrice 
}: FeaturedPropertiesSectionProps) {
  if (loading) {
    return (
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Animation - Matching your style */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl animate-pulse"></div>
        <div 
          className="absolute bottom-20 left-20 w-48 h-48 bg-slate-300 rounded-full blur-2xl animate-bounce" 
          style={{animationDelay: '2s', animationDuration: '4s'}}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header - Matching your text style */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 animate-fade-in-up">
            Featured <span className="text-orange-600">Properties</span>
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Handpicked premium properties verified by our team
          </p>
        </div>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <Card 
                className="group glass-card hover-lift transition-all duration-500 rounded-2xl animate-fade-in-scale hover-glow overflow-hidden" 
                style={{animationDelay: `${0.4 + index * 0.1}s`}}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={property.images?.[0] || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Featured Badge */}
                  {property.featured && (
                    <Badge className="absolute top-4 left-4 bg-orange-500 text-white border-0 px-3 py-1 shadow-lg">
                      Featured
                    </Badge>
                  )}
                  
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {/* Content */}
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors duration-300">
                    {property.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 mb-4 line-clamp-1 flex items-center gap-1">
                    <span className="text-orange-500">📍</span>
                    {property.location}
                  </p>
                  
                  {/* Price and Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPrice(property.price)}
                      <span className="text-sm text-slate-600 font-normal">/mo</span>
                    </span>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.beds}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.baths}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Button - Matching your CTA style */}
        <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '1s'}}>
          <Link href="/properties">
            <button className="h-14 px-8 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center gap-2">
              View All Properties
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Animation styles - Matching your existing */}
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

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.6s ease-out forwards;
          opacity: 0;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .hover-lift:hover {
          transform: translateY(-8px);
        }

        .hover-glow:hover {
          box-shadow: 0 20px 50px rgba(251, 146, 60, 0.2);
        }
      `}</style>
    </section>
  )
}