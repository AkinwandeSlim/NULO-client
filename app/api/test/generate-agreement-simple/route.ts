import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { tenant_name, landlord_name, property_address, monthly_rent, lease_duration, property_type } = body

    // Validate required fields
    if (!tenant_name || !landlord_name || !property_address || !monthly_rent) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: tenant_name, landlord_name, property_address, monthly_rent" },
        { status: 400 }
      )
    }

    // Call the backend simple test agreement service (NO AUTH REQUIRED)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    
    const response = await fetch(`${backendUrl}/api/test/generate-agreement-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenant_name,
        landlord_name,
        property_address,
        monthly_rent,
        lease_duration,
        property_type
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: errorData.error || "Backend request failed" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error("Simple test agreement generation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
