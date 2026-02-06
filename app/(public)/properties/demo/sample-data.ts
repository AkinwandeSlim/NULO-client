// Sample property data with enhanced location info
export const sampleProperties = [
  {
    id: '1',
    title: 'Modern 2-Bedroom Apartment in Lekki',
    location: 'Lekki Phase 1, Chevron Drive',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    price: 850000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    property_type: 'apartment',
    images: ['/images/property-placeholder.svg'],
    featured: true,
    landlord: {
      id: 'landlord1',
      name: 'John Doe',
      avatar_url: null,
      trust_score: 85,
      verified: true,
      properties_count: 5,
      joined_year: 2022,
      guarantee_joined: true
    }
  },
  {
    id: '2',
    title: 'Spacious 3-Bedroom Duplex',
    location: 'Victoria Island, Adetokunbo Ademola Street',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    price: 1500000,
    beds: 3,
    baths: 3,
    sqft: 2000,
    property_type: 'duplex',
    images: ['/images/property-placeholder.svg'],
    featured: false,
    landlord: {
      id: 'landlord2',
      name: 'Jane Smith',
      avatar_url: null,
      trust_score: 92,
      verified: true,
      properties_count: 8,
      joined_year: 2021,
      guarantee_joined: true
    }
  },
  {
    id: '3',
    title: 'Cozy Studio Apartment',
    location: 'Ikoyi, Glover Road',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    price: 450000,
    beds: 1,
    baths: 1,
    sqft: 600,
    property_type: 'studio',
    images: ['/images/property-placeholder.svg'],
    featured: false,
    landlord: {
      id: 'landlord3',
      name: 'Mike Johnson',
      avatar_url: null,
      trust_score: 78,
      verified: false,
      properties_count: 3,
      joined_year: 2023,
      guarantee_joined: false
    }
  },
  {
    id: '4',
    title: 'Luxury Penthouse with Ocean View',
    location: 'Eko Atlantic, Ocean Drive',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    price: 3000000,
    beds: 4,
    baths: 4,
    sqft: 3500,
    property_type: 'penthouse',
    images: ['/images/property-placeholder.svg'],
    featured: true,
    landlord: {
      id: 'landlord4',
      name: 'Sarah Williams',
      avatar_url: null,
      trust_score: 95,
      verified: true,
      properties_count: 12,
      joined_year: 2020,
      guarantee_joined: true
    }
  }
]
