import React from 'react';
import { 
  Home, 
  Shield, 
  Users, 
  MapPin, 
  CheckCircle, 
  Star,
  TrendingUp,
  Heart,
  Lock,
  MessageSquare,
  Building,
  Zap,
  Award,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About NuloAfrica
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Zero agency fee rental platform connecting verified tenants with verified landlords across Nigeria
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/properties"
                className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Browse Properties
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/auth/signup"
                className="inline-flex items-center px-8 py-4 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800 transition-colors"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-300 rounded-full opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-300 rounded-full opacity-20"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300 rounded-full opacity-20"></div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To revolutionize the Nigerian rental market by eliminating agency fees and creating a trusted, transparent platform for tenants and landlords
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Zero Agency Fees</h3>
              <p className="text-gray-600">
                Save thousands of naira by connecting directly with verified landlords without middlemen
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verified Users</h3>
              <p className="text-gray-600">
                All tenants and landlords undergo thorough verification to ensure safety and trust
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Escrow-based payment system protects both tenants and landlords throughout the rental process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How NuloAfrica Works</h2>
            <p className="text-xl text-gray-600">Simple, transparent, and secure rental process</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Up & Verify</h3>
                <p className="text-gray-600">
                  Create your account and complete our quick verification process
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Browse Properties</h3>
                <p className="text-gray-600">
                  Search verified properties in Lagos, Abuja, and Port Harcourt
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Connect & View</h3>
                <p className="text-gray-600">
                  Schedule viewings and communicate directly with landlords
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Apply & Pay</h3>
                <p className="text-gray-600">
                  Submit applications and pay securely through our platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose NuloAfrica?</h2>
            <p className="text-xl text-gray-600">Features designed for the Nigerian rental market</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilot Cities Focus</h3>
                <p className="text-gray-600">
                  Currently serving Lagos, Abuja, and Port Harcourt with plans to expand nationwide
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trust Scores</h3>
                <p className="text-gray-600">
                  Build your reputation through our engagement-based trust scoring system
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Messaging</h3>
                <p className="text-gray-600">
                  Chat directly with landlords/tenants within our secure platform
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Management</h3>
                <p className="text-gray-600">
                  Landlords can easily manage listings, viewings, and applications
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Notifications</h3>
                <p className="text-gray-600">
                  Get real-time updates for viewings, applications, and messages
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Favorites</h3>
                <p className="text-gray-600">
                  Keep track of properties you love with our favorites system
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Making an Impact</h2>
            <p className="text-xl text-orange-100">Join thousands of Nigerians already using NuloAfrica</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-orange-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0%</div>
              <div className="text-orange-100">Agency Fees</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-orange-100">Verified Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-orange-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <Award className="h-16 w-16 text-orange-600 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Rental Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of Nigerians who are already saving money and time with NuloAfrica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Sign Up Free
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/properties"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Browse Properties
              <Home className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About NuloAfrica</h3>
              <p className="text-gray-400">
                Zero agency fee rental platform for the Nigerian market. 
                Connecting verified tenants with verified landlords since 2025.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Pilot Cities</h3>
              <ul className="text-gray-400 space-y-2">
                <li>Lagos</li>
                <li>Abuja</li>
                <li>Port Harcourt</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: support@nuloafrica.com<br />
                Phone: +234 XXX XXX XXXX<br />
                Available 24/7 for support
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
