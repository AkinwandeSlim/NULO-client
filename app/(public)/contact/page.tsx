"use client"

import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send,
  Clock,
  Users,
  Shield,
  Building,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Home
} from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    userType: 'tenant'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting NuloAfrica. Our team will get back to you within 24 hours.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Back to Home
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact NuloAfrica
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              We're here to help you with your rental journey. Get in touch with our team.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Phone Support</h3>
              <p className="text-gray-600 mb-4">24/7 Customer Support</p>
              <a href="tel:+2348000000000" className="text-orange-600 font-semibold hover:text-orange-700">
                +234 800 000 0000
              </a>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Email Support</h3>
              <p className="text-gray-600 mb-4">We respond within 24 hours</p>
              <a href="mailto:support@nuloafrica.com" className="text-green-600 font-semibold hover:text-green-700">
                support@nuloafrica.com
              </a>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Office Locations</h3>
              <p className="text-gray-600 mb-4">Available in 3 cities</p>
              <div className="text-blue-600 font-semibold">
                Lagos, Abuja, Port Harcourt
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                      I am a...
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="tenant">Tenant</option>
                      <option value="landlord">Landlord</option>
                      <option value="both">Both</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="verification">Account Verification</option>
                    <option value="property">Property Listing Issue</option>
                    <option value="payment">Payment & Billing</option>
                    <option value="safety">Safety & Security</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="feedback">Feedback & Suggestions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* FAQ & Info */}
            <div className="space-y-8">
              {/* Quick FAQs */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How quickly do you respond?</h3>
                    <p className="text-gray-600">
                      We respond to all inquiries within 24 hours. Urgent issues are prioritized and handled faster.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you charge agency fees?</h3>
                    <p className="text-gray-600">
                      No! NuloAfrica is a zero-fee platform. We don't charge tenants or landlords agency fees.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Which cities do you operate in?</h3>
                    <p className="text-gray-600">
                      We currently operate in Lagos, Abuja, and Port Harcourt, with plans to expand nationwide.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I verify my account?</h3>
                    <p className="text-gray-600">
                      Account verification involves email confirmation, phone verification, and ID submission for landlords.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Hours */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 text-white">
                <Clock className="h-12 w-12 mb-4 text-orange-200" />
                <h2 className="text-2xl font-bold mb-4">Support Hours</h2>
                <div className="space-y-2 text-orange-100">
                  <p><strong>Phone Support:</strong> 24/7</p>
                  <p><strong>Email Support:</strong> Mon-Sat, 9AM-6PM</p>
                  <p><strong>Live Chat:</strong> Mon-Fri, 9AM-5PM</p>
                  <p><strong>Emergency Issues:</strong> Available 24/7</p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Why Choose NuloAfrica?</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Verified Users Only</h3>
                      <p className="text-gray-600 text-sm">All tenants and landlords are thoroughly verified</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Zero Agency Fees</h3>
                      <p className="text-gray-600 text-sm">Save thousands on rental commissions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Secure Payments</h3>
                      <p className="text-gray-600 text-sm">Escrow system protects both parties</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                      <p className="text-gray-600 text-sm">Always here when you need help</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
            <div className="flex items-start">
              <AlertCircle className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Emergency Support</h2>
                <p className="text-gray-700 mb-4">
                  For urgent issues related to safety, security, or immediate property concerns, 
                  please contact our emergency hotline immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="tel:+2348000000000" className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    <Phone className="h-5 w-5 mr-2" />
                    Emergency Hotline: +234 800 000 0000
                  </a>
                  <a href="mailto:emergency@nuloafrica.com" className="inline-flex items-center px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                    <Mail className="h-5 w-5 mr-2" />
                    emergency@nuloafrica.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Looking for Something Else?</h2>
            <p className="text-xl text-gray-600">Explore these helpful resources</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <Link 
              href="/about"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
            >
              <Building className="h-8 w-8 text-orange-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">About Us</h3>
              <p className="text-gray-600 text-sm">Learn more about NuloAfrica</p>
            </Link>
            
            <Link 
              href="/properties"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
            >
              <Home className="h-8 w-8 text-orange-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Browse Properties</h3>
              <p className="text-gray-600 text-sm">Find your next home</p>
            </Link>
            
            <Link 
              href="/auth/signup"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
            >
              <Users className="h-8 w-8 text-orange-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Sign Up</h3>
              <p className="text-gray-600 text-sm">Join our platform</p>
            </Link>
            
            <Link 
              href="/faq"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
            >
              <MessageSquare className="h-8 w-8 text-orange-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">FAQs</h3>
              <p className="text-gray-600 text-sm">Get quick answers</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
