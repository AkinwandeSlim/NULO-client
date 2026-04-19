/**
 * useCheckLicense Hook
 * Monitors API responses for license expiry errors
 * Sets state when license expires (wrapper will show banner)
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import axios, { AxiosError } from 'axios'

export interface LicenseError {
  error: string
  message: string
  detail: string
  support: string
}

const DEFAULT_ERROR: LicenseError = {
  error: 'LICENSE_EXPIRED',
  message: 'License has expired',
  detail: 'The application license has expired. Please contact support to renew your license.',
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@nuloafrica.com',
}

export function useCheckLicense() {
  const [isLicenseExpired, setIsLicenseExpired] = useState(false)
  const [licenseError, setLicenseError] = useState<LicenseError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const interceptorRef = useRef<number | null>(null)
  const licenseExpiredRef = useRef(false)  // Track if we've already set expired state

  // Check license status on mount
  useEffect(() => {
    const checkLicense = async () => {
      console.log('🔍 [LICENSE] Checking license status...')
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await axios.get(
          `${apiUrl}/api/v1/license/status`,
          { timeout: 2000 }
        )

        console.log('✅ [LICENSE] Status check response:', response.data)
        
        // Check if license is expired from the response
        if (response.data?.license_status?.time_remaining?.status === 'expired') {
          console.error('🔒 [LICENSE] License is EXPIRED')
          licenseExpiredRef.current = true
          setIsLicenseExpired(true)
          setLicenseError({
            ...DEFAULT_ERROR,
            message: response.data?.license_status?.message || 'License expired',
          })
        } else {
          console.log('✅ [LICENSE] License is ACTIVE')
          licenseExpiredRef.current = false
          setIsLicenseExpired(false)
          setLicenseError(null)
        }
      } catch (error) {
        console.warn('⚠️ [LICENSE] Check failed:', axios.isAxiosError(error) ? error.message : 'Unknown error')
        // Don't mark as expired if check fails - let interceptor/event handler handle it
        setIsLoading(false)
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkLicense()
  }, [])

  // Listen for custom licenseExpired event from apiClient
  useEffect(() => {
    console.log('🔧 [LICENSE] Setting up license expired event listener')
    
    const handleLicenseExpired = (event: any) => {
      console.log('🔒 [LICENSE] Received licenseExpired event from apiClient:', event.detail)
      
      if (!licenseExpiredRef.current) {
        licenseExpiredRef.current = true
        setIsLicenseExpired(true)
        setLicenseError(event.detail)
        console.log('✅ [LICENSE] State updated - banner should show now')
      }
    }
    
    window.addEventListener('licenseExpired', handleLicenseExpired)
    console.log('✅ [LICENSE] License expired event listener registered')
    
    return () => {
      window.removeEventListener('licenseExpired', handleLicenseExpired)
    }
  }, [])

  // Set up axios interceptor on global axios (fallback for direct axios calls)
  useEffect(() => {
    console.log('🔧 [LICENSE] Setting up response interceptor (fallback)')
    
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Check for ANY 403 Forbidden errors
        if (error.response?.status === 403) {
          const data = error.response.data as any
          
          console.warn('⚠️ [LICENSE] Global interceptor got 403 response:', {
            statusCode: error.response.status,
            statusText: error.response.statusText,
            data: data,
            dataKeys: data ? Object.keys(data) : 'no data',
            errorField: data?.error,
            messageField: data?.message,
            detailField: data?.detail,
          })

          // Check if it's a license error (try multiple fields)
          const isLicenseError = 
            data?.error === 'LICENSE_EXPIRED' ||
            data?.message === 'LICENSE_EXPIRED' ||
            data?.detail?.includes('license') ||
            data?.message?.includes('license') ||
            data?.message?.includes('License') ||
            error.response.statusText?.includes('license')

          if (isLicenseError) {
            console.error('🔒 [LICENSE] Global interceptor detected license error')
            
            if (!licenseExpiredRef.current) {
              licenseExpiredRef.current = true
              setIsLicenseExpired(true)
              setLicenseError({
                error: data?.error || 'LICENSE_EXPIRED',
                message: data?.message || 'License expired',
                detail: data?.detail || DEFAULT_ERROR.detail,
                support: data?.support || DEFAULT_ERROR.support,
              })
              console.log('✅ [LICENSE] State updated from global interceptor')
            }
          }
        }

        return Promise.reject(error)
      }
    )

    interceptorRef.current = interceptor
    console.log('✅ [LICENSE] Global interceptor registered, ID:', interceptor)

    return () => {
      if (interceptorRef.current !== null) {
        console.log('🧹 [LICENSE] Cleaning up global interceptor')
        axios.interceptors.response.eject(interceptorRef.current)
      }
    }
  }, [])

  return {
    isLicenseExpired,
    licenseError,
    isLoading,
  }
}
