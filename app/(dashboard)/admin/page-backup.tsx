

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Home, Users, TrendingUp, Eye, DollarSign, 
  CheckCircle, XCircle, Clock, Building, 
  AlertTriangle, UserCheck, Building2, Shield, Loader2,
  MapPin, Bed, Bath, Square, ArrowRight, Plus, Edit,
  FileText, Mail, Phone, Calendar, Search, Filter, RefreshCw
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Landlord {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  nin?: string;
  bvn?: string;
  id_document?: string;
  selfie_photo?: string;
  account_type?: 'individual' | 'company';
  company_name?: string;
  cac_number?: string;
  cac_certificate?: string;
  tax_id?: string;
  verification_submitted_at?: string;
  verification_approved_at?: string;
  nin_verified?: boolean;
  bvn_verified?: boolean;
  verification_cost?: number;
  created_at: string;
  phone_number?: string;
  location?: string;
}

// Static admin data
const adminStats = {
  totalUsers: 2847,
  totalTenants: 156,
  totalLandlords: 89,
  totalProperties: 1234,
  pendingVerifications: 45,
  verifiedTenants: 134,
  verifiedLandlords: 76,
  rejectedLandlords: 13,
  verifiedProperties: 198,
  monthlyRevenue: 2450000,
  growthRate: 23.5
};

const recentVerifications = [
  {
    id: 1,
    type: 'tenant',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    submittedAt: '2024-01-10',
    status: 'pending',
    documents: ['ID', 'Proof of Income']
  },
  {
    id: 2,
    type: 'landlord',
    name: 'Michael Chen',
    email: 'michael.chen@property.com',
    submittedAt: '2024-01-09',
    status: 'approved',
    documents: ['NIN', 'BVN', 'CAC']
  },
  {
    id: 3,
    type: 'tenant',
    name: 'Amina Bello',
    email: 'amina.b@email.com',
    submittedAt: '2024-01-08',
    status: 'rejected',
    documents: ['ID'],
    reason: 'Unclear document quality'
  },
  {
    id: 4,
    type: 'landlord',
    name: 'Tunde Adekoya',
    email: 'tunde.adekoya@realestate.com',
    submittedAt: '2024-01-07',
    status: 'pending',
    documents: ['ID', 'Proof of Address']
  }
];


export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loadingLandlords, setLoadingLandlords] = useState(false);
  const [stats, setStats] = useState(adminStats);

  // Fetch landlords data
  const fetchLandlords = async () => {
    try {
      setLoadingLandlords(true);
      const response = await fetch(`${API_URL}/api/v1/landlord-verifications/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLandlords(data.verifications || []);
        
        // Update stats based on real data
        const pendingCount = data.verifications?.filter((l: Landlord) => l.verification_status === 'pending').length || 0;
        const approvedCount = data.verifications?.filter((l: Landlord) => l.verification_status === 'approved').length || 0;
        const rejectedCount = data.verifications?.filter((l: Landlord) => l.verification_status === 'rejected').length || 0;
        
        setStats(prev => ({
          ...prev,
          totalLandlords: data.verifications?.length || 0,
          pendingVerifications: pendingCount,
          verifiedLandlords: approvedCount,
          rejectedLandlords: rejectedCount
        }));
      }
    } catch (error) {
      console.error('Error fetching landlords:', error);
      toast.error('Failed to fetch landlord data');
    } finally {
      setLoadingLandlords(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && user) {
      fetchLandlords();
    }
  }, [mounted, authLoading, user]);

  useEffect(() => {
    console.log('🔐 [ADMIN PAGE] Auth check:', { 
      hasUser: !!user, 
      user_type: user?.user_type,
      authLoading, 
      mounted 
    });
    
    if (!authLoading && mounted) {
      if (!user) {
        console.log('🚫 [ADMIN PAGE] No user, redirecting to signin');
        router.push('/signin');
        return;
      }
      
      // Check if user is admin
      if (user.user_type !== 'admin') {
        console.log('🚫 [ADMIN PAGE] User is not admin:', user.user_type);
        router.push('/');
        return;
      }
      
      console.log('✅ [ADMIN PAGE] Admin access granted!');
    }
  }, [user, authLoading, router, mounted]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">
            {authLoading ? 'Authenticating...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl md:text-4xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.full_name || user?.email || 'Admin'}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-orange-100 text-orange-700 px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Administrator
              </Badge>
              {/* <p className="text-sm text-gray-500 mt-1">{user?.email}</p> */}
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-green-600 font-medium">+23% from last month</p>
                </div>
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalTenants.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-blue-600 font-medium">{stats.verifiedTenants} verified</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Landlords</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLandlords.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-purple-600 font-medium">{stats.verifiedLandlords} verified</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Verifications</p>
                  <p className="mt-2 text-3xl font-bold text-orange-600">{stats.pendingVerifications}</p>
                  <p className="mt-1 text-sm text-orange-600 font-medium">Need review</p>
                </div>
                <div className="p-4 bg-orange-100 rounded-xl">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-green-600 font-medium">{stats.verifiedProperties} verified</p>
                </div>
                <div className="p-4 bg-orange-100 rounded-xl">
                  <Building className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/90 backdrop-blur-sm border-white/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg font-medium">Overview</TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg font-medium">Properties</TabsTrigger>
            <TabsTrigger value="verifications" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg font-medium">Verifications</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg font-medium">Users</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg font-medium">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Admin Overview</h2>
                <p className="text-gray-600 mb-6">Complete administrative dashboard with comprehensive management tools</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{adminStats.pendingVerifications}</p>
                    <p className="text-sm text-gray-600">Pending Verifications</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{adminStats.verifiedTenants + adminStats.verifiedLandlords}</p>
                    <p className="text-sm text-gray-600">Verified Users</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{adminStats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">+{adminStats.growthRate}%</p>
                    <p className="text-sm text-gray-600">Growth Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="properties" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardContent className="p-8 text-center">
                <Building className="h-16 w-16 mx-auto text-orange-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Property Management</h2>
                <p className="text-gray-600 mb-6">Complete property management system coming soon</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Landlord Verification Management
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Review and manage landlord onboarding applications
                    </p>
                  </div>
                  <Button 
                    onClick={fetchLandlords} 
                    disabled={loadingLandlords}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingLandlords ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLandlords ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-2 text-gray-600">Loading landlord data...</span>
                  </div>
                ) : landlords.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Landlord Applications</h3>
                    <p className="text-gray-600">No landlord verification applications found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold text-orange-900">Pending Review</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600 mt-1">
                          {landlords.filter(l => l.verification_status === 'pending').length}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">Verified</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {landlords.filter(l => l.verification_status === 'approved').length}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-900">Rejected</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600 mt-1">
                          {landlords.filter(l => l.verification_status === 'rejected').length}
                        </p>
                      </div>
                    </div>

                    {/* Landlords Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Landlord Info</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {landlords.map((landlord) => (
                            <TableRow key={landlord.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-gray-900">{landlord.full_name || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">ID: {landlord.id.slice(0, 8)}...</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{landlord.email}</span>
                                  </div>
                                  {landlord.phone_number && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-600">{landlord.phone_number}</span>
                                    </div>
                                  )}
                                  {landlord.location && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <MapPin className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-600">{landlord.location}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Badge variant={landlord.account_type === 'company' ? 'secondary' : 'outline'}>
                                    {landlord.account_type === 'company' ? 'Company' : 'Individual'}
                                  </Badge>
                                  {landlord.company_name && (
                                    <p className="text-sm text-gray-600 mt-1">{landlord.company_name}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {landlord.nin && <Badge variant="outline" className="text-xs">NIN</Badge>}
                                  {landlord.bvn && <Badge variant="outline" className="text-xs">BVN</Badge>}
                                  {landlord.id_document && <Badge variant="outline" className="text-xs">ID</Badge>}
                                  {landlord.cac_certificate && <Badge variant="outline" className="text-xs">CAC</Badge>}
                                  {landlord.selfie_photo && <Badge variant="outline" className="text-xs">Photo</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {landlord.verification_submitted_at ? (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        <span>{new Date(landlord.verification_submitted_at).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {new Date(landlord.verification_submitted_at).toLocaleTimeString()}
                                      </p>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">Not submitted</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    landlord.verification_status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : landlord.verification_status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }
                                >
                                  {landlord.verification_status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {landlord.verification_status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                  {landlord.verification_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {landlord.verification_status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/admin/landlord-verification/${landlord.id}`)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 mx-auto text-purple-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">User Management</h2>
                <p className="text-gray-600 mb-6">Comprehensive user management tools coming soon</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Manage All Users
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">Advanced analytics and insights coming soon</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
