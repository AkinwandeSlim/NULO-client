"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Users, DollarSign, TrendingUp, Plus, Eye, Edit, MessageSquare, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

const propertyStats = [
  {
    title: "Total Properties",
    value: "12",
    change: "+2 this month",
    icon: Home,
    color: "amber",
  },
  {
    title: "Active Tenants",
    value: "28",
    change: "+5 this month",
    icon: Users,
    color: "amber",
  },
  {
    title: "Monthly Revenue",
    value: "$45,600",
    change: "+12% from last month",
    icon: DollarSign,
    color: "green",
  },
  {
    title: "Occupancy Rate",
    value: "92%",
    change: "+3% from last month",
    icon: TrendingUp,
    color: "amber",
  },
]

const myProperties = [
  {
    id: 1,
    title: "Modern Villa in Nairobi",
    location: "Westlands, Nairobi",
    price: "$2,500/month",
    status: "occupied",
    tenant: "John Doe",
    image: "/modern-villa-nairobi.jpg",
    views: 234,
  },
  {
    id: 2,
    title: "Luxury Apartment Lagos",
    location: "Victoria Island, Lagos",
    price: "$1,800/month",
    status: "vacant",
    tenant: null,
    image: "/luxury-apartment-lagos.jpg",
    views: 189,
  },
  {
    id: 3,
    title: "Beachfront House Zanzibar",
    location: "Nungwi, Zanzibar",
    price: "$3,000/month",
    status: "occupied",
    tenant: "Sarah Smith",
    image: "/beachfront-zanzibar.jpg",
    views: 456,
  },
]

const recentInquiries = [
  {
    id: 1,
    name: "Alice Johnson",
    property: "Modern Villa in Nairobi",
    message: "Interested in viewing this property...",
    date: "2 hours ago",
    status: "new",
  },
  {
    id: 2,
    name: "Bob Williams",
    property: "Luxury Apartment Lagos",
    message: "Is this property still available?",
    date: "5 hours ago",
    status: "replied",
  },
  {
    id: 3,
    name: "Carol Davis",
    property: "Beachfront House Zanzibar",
    message: "Can I schedule a viewing?",
    date: "1 day ago",
    status: "new",
  },
]

const maintenanceRequests = [
  {
    id: 1,
    property: "Modern Villa in Nairobi",
    tenant: "John Doe",
    issue: "Leaking Faucet",
    priority: "medium",
    status: "in-progress",
    date: "Dec 10, 2024",
  },
  {
    id: 2,
    property: "Beachfront House Zanzibar",
    tenant: "Sarah Smith",
    issue: "AC Not Working",
    priority: "high",
    status: "pending",
    date: "Dec 8, 2024",
  },
]

export default function LandlordDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Landlord Dashboard</h1>
            <p className="text-slate-600">Manage your properties and tenants</p>
          </div>
          <Link href="/landlord/properties/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {propertyStats.map((stat, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className={`mt-1 text-sm ${stat.color === 'green' ? 'text-green-600' : 'text-amber-600'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`rounded-lg ${stat.color === 'green' ? 'bg-green-100' : 'bg-amber-100'} p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color === 'green' ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Properties */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">My Properties</CardTitle>
                  <Link href="/landlord/properties">
                    <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myProperties.map((property) => (
                    <div key={property.id} className="flex gap-4 p-4 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all">
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        className="h-24 w-32 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{property.title}</h3>
                            <p className="text-sm text-slate-600">{property.location}</p>
                          </div>
                          <Badge
                            className={
                              property.status === "occupied"
                                ? "bg-green-100 text-green-700 border-0"
                                : "bg-amber-100 text-amber-700 border-0"
                            }
                          >
                            {property.status === "occupied" ? "Occupied" : "Vacant"}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold text-amber-600 mb-2">{property.price}</p>
                        {property.tenant && (
                          <p className="text-sm text-slate-600">Tenant: {property.tenant}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Eye className="h-3 w-3" />
                          {property.views} views
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link href={`/properties/${property.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-300 hover:bg-amber-50 hover:border-amber-500">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/landlord/edit/${property.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-300 hover:bg-amber-50 hover:border-amber-500">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Requests */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">Maintenance Requests</CardTitle>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    {maintenanceRequests.filter(r => r.status === 'pending').length} Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceRequests.map((request) => (
                    <div key={request.id} className="p-4 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{request.issue}</h4>
                            <Badge
                              className={
                                request.priority === "high"
                                  ? "bg-red-100 text-red-700 border-0 text-xs"
                                  : "bg-amber-100 text-amber-700 border-0 text-xs"
                              }
                            >
                              {request.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{request.property}</p>
                          <p className="text-xs text-slate-500">Tenant: {request.tenant}</p>
                          <p className="text-xs text-slate-500 mt-1">{request.date}</p>
                        </div>
                        <Badge
                          className={
                            request.status === "in-progress"
                              ? "bg-amber-100 text-amber-700 border-0"
                              : "bg-slate-100 text-slate-700 border-0"
                          }
                        >
                          {request.status === "in-progress" ? "In Progress" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white flex-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Complete
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-300 hover:bg-amber-50">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Recent Inquiries */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">Recent Inquiries</CardTitle>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    {recentInquiries.filter(i => i.status === 'new').length} New
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="p-3 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-slate-900">{inquiry.name}</h4>
                          <p className="text-xs text-slate-600">{inquiry.property}</p>
                        </div>
                        <Badge
                          className={
                            inquiry.status === "new"
                              ? "bg-amber-100 text-amber-700 border-0 text-xs"
                              : "bg-green-100 text-green-700 border-0 text-xs"
                          }
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{inquiry.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{inquiry.date}</p>
                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2">
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/landlord/properties/new">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Property
                    </Button>
                  </Link>
                  <Link href="/landlord/tenants">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-600">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Tenants
                    </Button>
                  </Link>
                  <Link href="/landlord/payments">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-600">
                      <DollarSign className="mr-2 h-4 w-4" />
                      View Payments
                    </Button>
                  </Link>
                  <Link href="/landlord/reports">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-600">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Reports
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <CardTitle className="text-slate-900">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Lease Expiring Soon</p>
                      <p className="text-xs text-slate-600">Modern Villa lease expires in 30 days</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Payment Received</p>
                      <p className="text-xs text-slate-600">Rent payment from John Doe</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
