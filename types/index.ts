// Re-export everything from the new types location
export * from './auth'
export type {
  Pagination,
  Property,
  Favorite,
  ViewingRequest,
  PropertySearchParams,
  PropertySearchResponse,
  CreatePropertyData,
  UpdatePropertyData,
  LandlordInfo,
  PlatformStats,
  CityWithCount,
  PopularLocation,
  PopularLocationsResponse,
} from '../lib/types/property'
