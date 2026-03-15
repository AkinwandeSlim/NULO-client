import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, Mail, Phone, MapPin, Calendar, FileText, AlertCircle, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
          
          {/* Table of Contents */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Information We Collect",
                "How We Use Your Information", 
                "Information Sharing",
                "Data Security",
                "Your Rights",
                "Cookies and Tracking",
                "Data Retention",
                "International Transfers",
                "Children's Privacy",
                "Changes to This Policy",
                "Contact Us"
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
                <Database className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Name and contact details:</strong> Full name, email address, phone number</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Identification documents:</strong> Government-issued ID, passport, driver's license</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Address information:</strong> Current address, property preferences</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Financial information:</strong> Bank account details for rent payments (encrypted)</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Property details:</strong> Address, photos, specifications, rental terms</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Ownership documents:</strong> Deed of assignment, C of O, receipts</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Platform activity:</strong> Properties viewed, searches, messages sent, applications submitted</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Device information:</strong> IP address, browser type, device identifiers</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Location data:</strong> Approximate location for property search functionality</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <p className="font-semibold text-orange-800">Core Platform Functions</p>
                  <p className="text-orange-700">We use your information to provide and maintain our rental platform services.</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Account Management:</strong> Create and manage your account, verify your identity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Property Matching:</strong> Connect tenants with suitable properties and landlords</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Communication:</strong> Enable messaging between tenants and landlords</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Payment Processing:</strong> Process rent payments and security deposits securely</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Safety & Verification:</strong> Conduct background checks and verify user identities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Customer Support:</strong> Respond to your inquiries and provide assistance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Platform Improvement:</strong> Analyze usage patterns to improve our services</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Legal Compliance:</strong> Comply with Nigerian laws and regulations</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <p className="font-semibold text-green-800">We Never Sell Your Personal Information</p>
                  <p className="text-green-700">Your data is never sold to third parties for marketing purposes.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">When We Share Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>With Other Users:</strong> Contact information is shared only when you express interest in a property or agree to connect</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Service Providers:</strong> Payment processors, verification services, and cloud hosting providers</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Business Transfer:</strong> In case of merger, acquisition, or sale of assets</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4">
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">We implement industry-standard security measures to protect your information:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Technical Security</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• SSL/TLS encryption for all data transmissions</li>
                      <li>• Encrypted database storage</li>
                      <li>• Secure password hashing</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Role-based access permissions</li>
                      <li>• Multi-factor authentication</li>
                      <li>• Regular access reviews</li>
                      <li>• Employee training on data protection</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800">Important Note</p>
                  <p className="text-red-700">While we take reasonable measures to protect your information, no method of transmission over the internet is 100% secure.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <div className="flex items-center mb-4">
                <UserCheck className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">Under Nigerian Data Protection Regulation (NDPR), you have the following rights:</p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Right to Access</h4>
                    <p className="text-gray-600">Request a copy of your personal information</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Right to Rectification</h4>
                    <p className="text-gray-600">Correct inaccurate or incomplete information</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Right to Erasure</h4>
                    <p className="text-gray-600">Request deletion of your personal information</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Right to Portability</h4>
                    <p className="text-gray-600">Request your data in a machine-readable format</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Right to Object</h4>
                    <p className="text-gray-600">Object to processing of your personal information</p>
                  </div>
                </div>
                
                <p className="text-gray-600">
                  To exercise these rights, contact us at <a href="mailto:privacy@nuloafrica.com" className="text-orange-600 font-semibold">privacy@nuloafrica.com</a>
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>We use cookies and similar technologies to enhance your experience:</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                    <p>Required for basic website functionality (authentication, security, etc.)</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Performance Cookies</h4>
                    <p>Help us understand how our website is used and improve performance</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">Functional Cookies</h4>
                    <p>Remember your preferences and personalize your experience</p>
                  </div>
                </div>
                
                <p>You can control cookies through your browser settings.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>We retain your information only as long as necessary:</p>
                
                <ul className="space-y-2">
                  <li>• <strong>Active Accounts:</strong> Retained while your account is active</li>
                  <li>• <strong>Deleted Accounts:</strong> Information retained for 1 year for legal compliance</li>
                  <li>• <strong>Transaction Records:</strong> Retained for 7 years for tax and legal purposes</li>
                  <li>• <strong>Communication Logs:</strong> Retained for 2 years for safety and dispute resolution</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">International Data Transfers</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  Your information is primarily stored in Nigeria. We may transfer data internationally when:
                </p>
                <ul className="space-y-2">
                  <li>• Using cloud service providers with data centers outside Nigeria</li>
                  <li>• Complying with legal requirements in other jurisdictions</li>
                  <li>• With your explicit consent</li>
                </ul>
                <p>
                  All international transfers comply with NDPR requirements and include appropriate safeguards.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                  personal information from children under 18. If we become aware that we have collected such information, 
                  we will take steps to delete it immediately.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="space-y-2">
                  <li>• Posting the updated policy on our website</li>
                  <li>• Sending email notifications for significant changes</li>
                  <li>• Displaying prominent notices on our platform</li>
                </ul>
                <p>
                  Your continued use of our services after any changes indicates your acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11">
              <div className="flex items-center mb-4">
                <Mail className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  If you have questions about this privacy policy or our data practices, please contact us:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Privacy Inquiries</h4>
                    <div className="space-y-2">
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 text-orange-600 mr-2" />
                        <span>privacy@nuloafrica.com</span>
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 text-orange-600 mr-2" />
                        <span>+234 800 000 0000</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Office Address</h4>
                    <div className="space-y-2">
                      <p className="flex items-start">
                        <MapPin className="h-4 w-4 text-orange-600 mr-2 mt-0.5" />
                        <span>
                          NuloAfrica Headquarters<br />
                          Lagos, Nigeria<br />
                          (Physical address available on request)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <p className="font-semibold text-orange-800">Data Protection Officer</p>
                  <p className="text-orange-700">
                    For data protection concerns, contact our Data Protection Officer at dpo@nuloafrica.com
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 text-orange-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Privacy Matters
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're committed to protecting your information and earning your trust every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/terms"
              className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              View Terms of Service
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
