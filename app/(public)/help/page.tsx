'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Shield, 
  Home, 
  CreditCard, 
  MessageSquare, 
  Phone, 
  Mail, 
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  Lock,
  Star,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon?: React.ElementType;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    question: "How do I create an account on NuloAfrica?",
    answer: "Creating an account is simple! Click on 'Sign Up' on the homepage, choose whether you're a tenant or landlord, fill in your details, and verify your email. The whole process takes less than 5 minutes.",
    category: "Getting Started",
    icon: Users
  },
  {
    question: "Is NuloAfrica really free to use?",
    answer: "Yes! NuloAfrica is completely free for tenants. For landlords, we charge a small service fee only when you successfully find a tenant through our platform. There are no hidden charges or subscription fees.",
    category: "Getting Started",
    icon: CreditCard
  },
  {
    question: "Which cities does NuloAfrica operate in?",
    answer: "We currently operate in Lagos, Abuja, and Port Harcourt. We're planning to expand to other major Nigerian cities soon. Sign up for our newsletter to stay updated on our expansion.",
    category: "Getting Started",
    icon: MapPin
  },

  // For Tenants
  {
    question: "How do I search for properties?",
    answer: "Use our advanced search filters to find properties by location, price range, property type, number of bedrooms, and amenities. You can also save properties to your favorites and receive notifications for new listings that match your criteria.",
    category: "For Tenants",
    icon: Search
  },
  {
    question: "How do I schedule a property viewing?",
    answer: "Once you find a property you like, click 'Request Viewing' and select your preferred date and time. The landlord will receive your request and can confirm or suggest alternative times. You'll receive notifications about the status of your request.",
    category: "For Tenants",
    icon: Clock
  },
  {
    question: "What is the Trust Score and how does it work?",
    answer: "The Trust Score is our proprietary system that measures reliability based on verification status, engagement on the platform, and user reviews. Higher trust scores increase your chances of getting approved for properties and building credibility with landlords.",
    category: "For Tenants",
    icon: Star
  },
  {
    question: "How do I apply for a property?",
    answer: "After viewing a property (or scheduling a viewing), click 'Apply Now' on the property page. Fill in the application form with your details, upload required documents, and submit. The landlord will review your application and respond within 48 hours.",
    category: "For Tenants",
    icon: FileText
  },
  {
    question: "Is my personal information secure?",
    answer: "Absolutely! We use bank-level encryption to protect your data. Your contact information is only shared with landlords after you've expressed interest in their property or scheduled a viewing. We never sell your data to third parties.",
    category: "For Tenants",
    icon: Shield
  },

  // For Landlords
  {
    question: "How do I list my property on NuloAfrica?",
    answer: "Sign up as a landlord, complete your verification, then click 'List Property' from your dashboard. Fill in property details, upload photos, set your rental terms, and publish. Your property will be live once approved by our team (usually within 24 hours).",
    category: "For Landlords",
    icon: Building
  },
  {
    question: "What documents do I need for verification?",
    answer: "Landlords need: valid ID card, proof of property ownership (deed of assignment, C of O, or receipt), and recent utility bill. The verification process typically takes 24-48 hours.",
    category: "For Landlords",
    icon: FileText
  },
  {
    question: "How do I manage viewing requests?",
    answer: "From your landlord dashboard, you can view all viewing requests, confirm or reschedule appointments, and communicate directly with tenants. You'll receive real-time notifications for new requests and messages.",
    category: "For Landlords",
    icon: Clock
  },
  {
    question: "How does the tenant screening process work?",
    answer: "Tenants complete detailed profiles with employment information, income verification, and references. You can review their Trust Score, verification status, and application details before approving tenancy.",
    category: "For Landlords",
    icon: Users
  },
  {
    question: "When and how do I receive payments?",
    answer: "Through our secure payment system, tenants pay rent directly to your registered bank account. Payments are processed monthly and you receive notifications for all transactions. We handle payment collection so you don't have to chase tenants.",
    category: "For Landlords",
    icon: CreditCard
  },

  // Payments & Security
  {
    question: "How does the payment system work?",
    answer: "We use an escrow system where payments are held securely until both parties confirm the transaction. This protects both tenants and landlords. We support bank transfers, debit cards, and other popular Nigerian payment methods.",
    category: "Payments & Security",
    icon: Lock
  },
  {
    question: "Are there agency fees?",
    answer: "No! Unlike traditional rental agencies, we don't charge agency fees. Tenants pay only their rent and security deposit. Landlords pay a small service fee only upon successful tenant placement.",
    category: "Payments & Security",
    icon: CreditCard
  },
  {
    question: "How do you verify users?",
    answer: "We use a multi-step verification process including ID verification, phone verification, email confirmation, and document review. For landlords, we also verify property ownership documents.",
    category: "Payments & Security",
    icon: Shield
  },
  {
    question: "What happens if there's a dispute?",
    answer: "We have a dedicated dispute resolution team that mediates conflicts between tenants and landlords. We also provide clear guidelines in our terms of service and can assist with legal referrals if needed.",
    category: "Payments & Security",
    icon: AlertCircle
  },

  // Technical Support
  {
    question: "I forgot my password. How do I reset it?",
    answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link expires after 24 hours for security reasons.",
    category: "Technical Support",
    icon: Lock
  },
  {
    question: "How do I update my profile information?",
    answer: "Log in to your account, go to 'Profile Settings' from your dashboard, and update your information. Some changes may require re-verification for security purposes.",
    category: "Technical Support",
    icon: Users
  },
  {
    question: "Why can't I see my property listing?",
    answer: "New listings go through a review process and are typically approved within 24 hours. If your listing isn't visible after this time, check your email for any notifications about required changes or contact support.",
    category: "Technical Support",
    icon: Building
  },
  {
    question: "How do I report a problem or bug?",
    answer: "You can report issues through our contact form, email us at support@nuloafrica.com, or use the in-app chat support. Please provide details about the issue and screenshots if possible.",
    category: "Technical Support",
    icon: MessageSquare
  }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getCategoryIcon = (category: string) => {
    const item = faqData.find(item => item.category === category);
    return item?.icon || HelpCircle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Help Center
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-8">
              Find answers to common questions about NuloAfrica
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Help Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-4 mb-12">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`p-4 rounded-lg font-semibold transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-orange-50'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                    selectedCategory === category
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {category}
                </button>
              );
            })}
          </div>

          {/* FAQ Results */}
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try searching with different keywords or browse all categories.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((item, index) => {
                  const isExpanded = expandedItems.includes(index);
                  const Icon = item.icon || HelpCircle;
                  
                  return (
                    <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                            <Icon className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.question}</h3>
                            <p className="text-sm text-orange-600">{item.category}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-4">
                          <div className="pl-14">
                            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Topics</h2>
            <p className="text-xl text-gray-600">Quick access to the most helpful information</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8">
              <Shield className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety & Security</h3>
              <p className="text-gray-600 mb-4">
                Learn about our verification process, secure payments, and how we protect both tenants and landlords.
              </p>
              <button
                onClick={() => setSelectedCategory('Payments & Security')}
                className="text-orange-600 font-semibold hover:text-orange-700"
              >
                View Safety FAQs →
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8">
              <CreditCard className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payments & Fees</h3>
              <p className="text-gray-600 mb-4">
                Understand our transparent pricing, payment methods, and how our zero agency fee model works.
              </p>
              <button
                onClick={() => setSelectedCategory('Payments & Security')}
                className="text-orange-600 font-semibold hover:text-orange-700"
              >
                View Payment FAQs →
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8">
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Getting Started</h3>
              <p className="text-gray-600 mb-4">
                New to NuloAfrica? Learn how to create an account, verify your profile, and start using our platform.
              </p>
              <button
                onClick={() => setSelectedCategory('Getting Started')}
                className="text-orange-600 font-semibold hover:text-orange-700"
              >
                View Getting Started FAQs →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <MessageSquare className="h-16 w-16 text-orange-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <Phone className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 text-sm mb-3">24/7 Available</p>
              <a href="tel:+2348000000000" className="text-orange-600 font-semibold">
                +234 800 000 0000
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <Mail className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">Response within 24 hours</p>
              <a href="mailto:support@nuloafrica.com" className="text-green-600 font-semibold">
                support@nuloafrica.com
              </a>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm mb-3">Mon-Fri, 9AM-5PM</p>
              <Link 
                href="/contact"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Start Chat →
              </Link>
            </div>
          </div>
          
          <Link 
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Contact Support Team
            <ChevronDown className="ml-2 h-5 w-5 rotate-270" />
          </Link>
        </div>
      </section>
    </div>
  );
}
