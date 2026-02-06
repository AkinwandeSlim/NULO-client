"use client"

import { useState } from 'react'
import PropertyGridEnhanced from '@/components/properties/PropertyGridEnhanced'

import { sampleProperties } from './sample-data'

export default function PropertiesDemoPage() {
  const [favorites, setFavorites] = useState<string[]>([])

  const handlePropertySelect = (property: any) => {
    console.log('Selected property:', property)
    // Navigate to property details page
    // router.push(`/properties/${property.id}`)
  }

  const handlePropertyFavorite = (propertyId: string) => {
    setFavorites(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  return (
    <PropertyGridEnhanced
      properties={sampleProperties}
      loading={false}
      onPropertySelect={handlePropertySelect}
      onPropertyFavorite={handlePropertyFavorite}
      favorites={favorites}
    />
  )
}
