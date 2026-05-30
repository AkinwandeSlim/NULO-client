import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

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

    // Call the backend agreement service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    
    const response = await fetch(`${backendUrl}/api/test/generate-agreement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
    console.error("Test agreement generation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
