import React from 'react';
import { FileText, Shield, Users, CreditCard, AlertTriangle, AlertCircle, CheckCircle, Scale, Clock, Building, Home, UserCheck, Lock, Calendar, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Scale className="h-16 w-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              These terms govern your use of NuloAfrica's rental platform services in Nigeria.
            </p>
            <p className="text-orange-200 mt-4">
              Last updated: March 15, 2024
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          
          {/* Agreement Section */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-12">
            <h2 className="text-xl font-bold text-orange-900 mb-3">Agreement to Terms</h2>
            <p className="text-orange-800">
              By accessing and using NuloAfrica, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Platform Description",
                "Eligibility and Account Registration",
                "User Responsibilities",
                "Property Listings",
                "Rental Applications",
                "Payments and Fees",
                "Verification Process",
                "Communication Guidelines",
                "Prohibited Activities",
                "Intellectual Property",
                "Dispute Resolution",
                "Limitation of Liability",
                "Termination",
                "Governing Law",
                "Changes to Terms"
              ].map((item, index) => (
                <a key={index} href={`#section-${index + 1}`} className="flex items-center text-orange-600 hover:text-orange-700">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            
            {/* Section 1 */}
            <section id="section-1">
              <div className="flex items-center mb-4">
                <Building className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Platform Description</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  NuloAfrica is a zero-agency-fee rental platform that connects verified tenants with verified landlords in Nigeria. 
                  Our platform operates in Lagos, Abuja, and Port Harcourt, providing:
                </p>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Property listing and search functionality</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Tenant and landlord verification services</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Secure payment processing and escrow services</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Communication tools for tenants and landlords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Dispute resolution support</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <div className="flex items-center mb-4">
                <UserCheck className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Eligibility and Account Registration</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Requirements</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Must be at least 18 years of age</li>
                    <li>• Must be a Nigerian citizen or legal resident</li>
                    <li>• Must have valid identification documents</li>
                    <li>• Must have a functional email address and phone number</li>
                    <li>• Must not be barred from using rental platforms by law</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Provide accurate, complete, and current information</li>
                    <li>• Maintain the security of your account credentials</li>
                    <li>• Promptly update your information when it changes</li>
                    <li>• You are responsible for all activities under your account</li>
                    <li>• Notify us immediately of unauthorized account use</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">Important</p>
                  <p className="text-red-700">
                    Creating an account with false information or on behalf of someone else is strictly prohibited 
                    and may result in immediate account termination.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">User Responsibilities</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For Tenants</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Provide truthful information in applications</li>
                    <li>• Respect landlords' time and property</li>
                    <li>• Pay rent and deposits on time as agreed</li>
                    <li>• Maintain the property in good condition</li>
                    <li>• Follow property rules and regulations</li>
                    <li>• Communicate promptly with landlords</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">For Landlords</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Provide accurate property descriptions</li>
                    <li>• Maintain properties in habitable condition</li>
                    <li>• Respond to tenant inquiries and applications promptly</li>
                    <li>• Respect tenants' privacy and rights</li>
                    <li>• Handle security deposits according to Nigerian law</li>
                    <li>• Make necessary repairs in a timely manner</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4">
              <div className="flex items-center mb-4">
                <Home className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Property Listings</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Listing Requirements</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Must be the legal owner or authorized representative</li>
                    <li>• Must provide accurate property details and photos</li>
                    <li>• Must disclose all known property issues</li>
                    <li>• Must comply with all applicable laws and regulations</li>
                    <li>• Must set realistic rental prices</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Listings</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Properties you don't own or have authority to rent</li>
                    <li>• Illegal or unsafe properties</li>
                    <li>• Misleading or fraudulent information</li>
                    <li>• Discriminatory language or requirements</li>
                    <li>• Properties that don't meet minimum habitability standards</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Rental Applications</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Process</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Applications must include complete and accurate information</li>
                    <li>• Supporting documents must be authentic and current</li>
                    <li>• Multiple applications for the same property are not permitted</li>
                    <li>• Applications are processed on a first-come, first-served basis</li>
                    <li>• Landlords have the right to accept or reject applications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Fees</h3>
                  <p className="text-gray-600">
                    NuloAfrica does not charge application fees. Any fees charged by landlords must be 
                    disclosed upfront and are subject to Nigerian rental laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Payments and Fees</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <p className="font-semibold text-green-800">Zero Agency Fees</p>
                  <p className="text-green-700">
                    NuloAfrica does not charge traditional agency fees. Our platform is free for tenants, 
                    and landlords pay only a small service fee upon successful tenant placement.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Processing</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• All payments are processed through secure payment gateways</li>
                    <li>• Rent payments are held in escrow until both parties confirm</li>
                    <li>• Security deposits are managed according to Nigerian law</li>
                    <li>• Payment receipts are provided for all transactions</li>
                    <li>• Refunds are processed according to our refund policy</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Landlord Service Fees</h3>
                  <p className="text-gray-600">
                    Landlords pay a service fee equal to 2% of the annual rent only when a tenant 
                    successfully placed through our platform signs a lease agreement.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7">
              <div className="flex items-center mb-4">
                <UserCheck className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Verification Process</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tenant Verification</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Government-issued ID verification</li>
                    <li>• Email and phone number verification</li>
                    <li>• Employment and income verification (optional)</li>
                    <li>• Previous rental history checks (with consent)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Landlord Verification</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Government-issued ID verification</li>
                    <li>• Property ownership document verification</li>
                    <li>• Business registration (for corporate landlords)</li>
                    <li>• Bank account verification for payments</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="font-semibold text-blue-800">Verification Timeline</p>
                  <p className="text-blue-700">
                    Most verifications are completed within 24-48 hours. You will be notified via email 
                    once verification is complete.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Communication Guidelines</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceptable Communication</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Professional and respectful language</li>
                    <li>• Relevant questions about properties or applications</li>
                    <li>• Timely responses to inquiries</li>
                    <li>• Use of our platform messaging system for official communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Communication</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Harassment, threats, or abusive language</li>
                    <li>• Discriminatory remarks or requests</li>
                    <li>• Spam or unsolicited commercial messages</li>
                    <li>• Sharing personal contact information before mutual interest</li>
                    <li>• Attempts to circumvent platform fees</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Prohibited Activities</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>You may not use our platform to:</p>
                <ul className="space-y-2">
                  <li>• Commit fraud or any illegal activity</li>
                  <li>• Create fake or misleading listings</li>
                  <li>• Impersonate another person or entity</li>
                  <li>• Violate applicable laws or regulations</li>
                  <li>• Interfere with platform functionality</li>
                  <li>• Harvest or collect user information</li>
                  <li>• Discriminate based on protected characteristics</li>
                  <li>• Bypass our verification or payment systems</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10">
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Intellectual Property</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  All content on NuloAfrica, including text, graphics, logos, and software, is owned by 
                  NuloAfrica or its licensors and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You may not use, copy, reproduce, or distribute any content from our platform without 
                  our prior written consent, except as necessary for your personal use of our services.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11">
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Dispute Resolution</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Mediation</h3>
                  <p className="text-gray-600">
                    We offer mediation services to help resolve disputes between tenants and landlords. 
                    Our mediation team will review the situation and facilitate communication between parties.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dispute Process</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Submit a dispute through your dashboard</li>
                    <li>• Provide evidence and documentation</li>
                    <li>• Participate in good faith in mediation</li>
                    <li>• Follow the mediator's recommendations</li>
                    <li>• Escalate to legal proceedings if necessary</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  NuloAfrica is a platform that connects tenants and landlords. We are not a real estate 
                  agency, property manager, or legal advisor. Our liability is limited as follows:
                </p>
                <ul className="space-y-2">
                  <li>• We are not responsible for the quality of properties listed</li>
                  <li>• We are not liable for disputes between users</li>
                  <li>• We are not responsible for user actions or omissions</li>
                  <li>• Our maximum liability is the service fees paid in the preceding 12 months</li>
                </ul>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="font-semibold text-yellow-800">Important Disclaimer</p>
                  <p className="text-yellow-700">
                    We recommend that users seek independent legal advice before entering into rental agreements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Termination</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Termination by User</h3>
                  <p className="text-gray-600">
                    You may terminate your account at any time by contacting our support team or using 
                    the account deletion feature in your settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Termination by NuloAfrica</h3>
                  <p className="text-gray-600">
                    We may terminate or suspend your account immediately if you violate these terms, 
                    engage in fraudulent activity, or misuse our platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Effect of Termination</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Access to platform services will be terminated</li>
                    <li>• Active listings will be removed</li>
                    <li>• Pending transactions will be completed according to our policies</li>
                    <li>• We may retain certain information as required by law</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14">
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. 
                  Any disputes arising from these terms will be resolved in Nigerian courts.
                </p>
                <p>
                  These terms comply with Nigerian Data Protection Regulation (NDPR), Tenancy Laws of various states, 
                  and other applicable Nigerian regulations.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section id="section-15">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Changes to Terms</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update these Terms of Service from time to time. We will notify you of any changes by:
                </p>
                <ul className="space-y-2">
                  <li>• Posting the updated terms on our website</li>
                  <li>• Sending email notifications for significant changes</li>
                  <li>• Displaying prominent notices on our platform</li>
                </ul>
                <p>
                  Your continued use of our services after any changes indicates your acceptance of the updated terms.
                </p>
              </div>
            </section>
          </div>

          {/* Contact Information */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions About These Terms?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Mail className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Email Us</h3>
                  <p className="text-gray-600">legal@nuloafrica.com</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Phone className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Call Us</h3>
                  <p className="text-gray-600">+234 800 000 0000</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Visit Us</h3>
                  <p className="text-gray-600">Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Scale className="h-16 w-16 text-orange-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Fair and Transparent Terms
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We believe in creating a platform that works for everyone. Our terms are designed to be fair, clear, and protective of all users.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/privacy"
              className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              View Privacy Policy
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contact Legal Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
