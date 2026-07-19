"use client"

/**
 * FAQ Page — Frequently Asked Questions
 * ------------------------------------------------------------------
 * Comprehensive FAQ page with categorized questions for NEST, landlords,
 * tenants, and general platform information.
 * ------------------------------------------------------------------
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { ChevronDown, Search, Home, Building2, HelpCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/80 bg-white"}`
const getCardHoverClass = () =>
  "transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const FAQ_CATEGORIES = [
  {
    icon: TrendingUp,
    title: "About NEST",
    description: "Investment, returns, and co-ownership",
    questions: [
      { q: "What is NEST and how does it work?", a: "NEST (Nulo Equity Share Trust) lets you pool funds with other investors to acquire high-yield rental properties. Nulo Africa handles acquisition, tenant sourcing, maintenance, and rent collection, and you receive your proportional share of the rent every month. NEST is currently in early access — join the waitlist to be notified at launch." },
      { q: "What returns can I expect from NEST investments?", a: "NEST targets properties with strong rental yields and appreciation potential in Nigeria's fastest-growing markets. Returns come from two sources: monthly rental income (proportional to your investment) and long-term property appreciation. Specific return projections will be shared with waitlist members as we finalize our first investment opportunities." },
      { q: "What is the minimum investment amount?", a: "We're designing NEST to be accessible to everyday Africans. Minimum investment details will be shared with early waitlist members. Our goal is to make real estate investment achievable for people who previously couldn't access this asset class." },
      { q: "How do I receive my rental income?", a: "Once a NEST property is tenanted and generating rent, your proportional share is paid monthly to your registered bank account. All payments are automated and transparent — you can track income, expenses, and property performance through your NEST dashboard." },
      { q: "What happens if a NEST property has no tenant?", a: "Vacancy risk is managed through careful property selection, competitive pricing, and active tenant sourcing. During vacancy periods, no rental income is distributed. However, we prioritize properties in high-demand markets to minimize vacancy duration." },
      { q: "Can I sell my NEST shares?", a: "NEST is designed for medium to long-term investment (typically 3-7 years). We're building a secondary market where investors can trade shares, but liquidity is not instant like stocks. Details on the exit process will be provided to investors before you commit funds." },
    ],
  },
  {
    icon: Building2,
    title: "For Landlords",
    description: "Property management and listing",
    questions: [
      { q: "How do I list my property on NuloAfrica?", a: "Open the Landlord Dashboard, complete your verification, and add your property details (location, rent, amenities, photos). Our team reviews every listing to ensure it meets our quality standards. Once approved, your property goes live and tenants can view and apply." },
      { q: "What does the verification process involve?", a: "We verify your identity, ownership documents, and property details. This keeps the platform trustworthy and protects both landlords and tenants. Verification typically takes 24-48 hours." },
      { q: "How do I screen tenants?", a: "All applicants on NuloAfrica are pre-verified. You'll see their profiles, trust scores, and application details in your dashboard. You can approve or reject applications, schedule viewings, and communicate directly through the platform." },
      { q: "How does rent collection work?", a: "Once a tenant is approved and the lease is signed digitally, rent is collected through the platform and transferred to your account. You can track payments, send reminders, and manage renewals all in one place." },
      { q: "Are there fees for landlords?", a: "We charge a small service fee for successful rentals to cover verification, payment processing, and platform maintenance. Details are transparent and shown before you list. No hidden charges." },
    ],
  },
  {
    icon: Home,
    title: "For Tenants",
    description: "Renting and applications",
    questions: [
      { q: "How do I find properties on NuloAfrica?", a: "Use our search filters to narrow by city, budget, bedrooms, and amenities. Every listing is verified by our team, so what you see online matches reality. You can save favorites, compare properties, and book viewings directly." },
      { q: "Can I view a property before applying?", a: "Yes! You can book a viewing directly from any listing. Only proceed to application and payment once you've seen the property and are satisfied." },
      { q: "What documents do I need to apply?", a: "You'll need a valid ID, proof of income or employment, and references. Some landlords may request additional documents. All documents are securely uploaded through the platform." },
      { q: "How long does the application process take?", a: "Once you submit your application, landlords typically respond within 24-48 hours. If approved, you can sign the digital lease and pay securely through the platform. Most tenants move in within a week of approval." },
      { q: "What if I have a dispute with my landlord?", a: "Our platform includes a dispute resolution system. You can raise issues, and our support team will mediate. We keep records of all communications and agreements to ensure fairness." },
      { q: "Are all properties on NuloAfrica verified?", a: "Yes. Every listing and every landlord undergoes verification before publishing. We check ownership documents, visit properties, and run background checks to keep the marketplace trustworthy." },
    ],
  },
  {
    icon: HelpCircle,
    title: "General",
    description: "Platform, security, and support",
    questions: [
      { q: "What is NuloAfrica?", a: "NuloAfrica is Africa's rental and property-management platform. It brings together a rental marketplace for tenants, a management dashboard for landlords, and NEST — a co-ownership investment product — under one trusted brand." },
      { q: "Which cities does NuloAfrica operate in?", a: "We currently serve Lagos, Abuja, and Port Harcourt, with plans to expand to more Nigerian cities in 2026. Follow our social media or join the waitlist to be notified of new city launches." },
      { q: "Is my data secure?", a: "Yes. We use bank-level encryption to protect your data. Personal information, payment details, and documents are stored securely and never shared without your consent. We comply with Nigerian data protection laws." },
      { q: "How do I contact support?", a: "Reach us via email at nuloafrica@gmail.com or nuloafrica26@outlook.com. You can also call +234 813 494 2775. Our support team is available to assist with any questions or issues." },
      { q: "Can I use NuloAfrica on mobile?", a: "Yes! Our platform is fully responsive and works on all devices. We're also building dedicated mobile apps for iOS and Android — join the waitlist to be notified when they launch." },
      { q: "How does NuloAfrica make money?", a: "We charge small service fees for successful transactions (rentals, lease renewals, NEST investments). Fees are transparent and disclosed upfront. This allows us to keep the platform free for browsing and verification." },
    ],
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    document.body.classList.remove("has-navbar")
    document.body.style.paddingTop = "0"
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff"
    return () => {
      document.body.classList.add("has-navbar")
      document.body.style.paddingTop = ""
      document.body.style.backgroundColor = ""
    }
  }, [theme])

  // Filter questions based on search
  const filteredCategories = FAQ_CATEGORIES.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0)

  return (
    <div className={`flex min-h-screen flex-col font-sans antialiased ${theme === "dark" ? "text-white bg-black" : "text-slate-900 bg-white"}`}>
      <style jsx global>{`
        body {
          background-color: ${theme === "dark" ? "#000000" : "#ffffff"} !important;
        }
        .nulo-gradient-text {
          background: linear-gradient(135deg, #ea580c, #fb923c, #f97316);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      `}</style>

      <main className="flex-1 pt-8">
        {/* Hero */}
        <section className={`relative py-20 sm:py-24 ${theme === "dark" ? "bg-gradient-to-b from-black to-[#0A0A0A]" : "bg-gradient-to-b from-white to-slate-50"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className={cx(EYEBROW, "mb-4")}>Help Center</p>
              <h1 className="text-[36px] sm:text-[44px] font-bold leading-tight mb-6 lg:text-[52px]">
                Frequently Asked <span className="nulo-gradient-text">Questions</span>
              </h1>
              <p className={`text-[15px] sm:text-[16px] leading-relaxed mb-8 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Find answers to common questions about NuloAfrica, NEST investments, property listings, and more.
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl border pl-12 pr-4 py-4 text-[15px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${theme === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-white/25" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {!searchQuery && (
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
                  {FAQ_CATEGORIES.map((category, index) => (
                    <motion.button
                      key={category.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                      onClick={() => setSelectedCategory(index)}
                      className={cx(
                        getCardClass(theme),
                        "flex flex-col items-center gap-4 p-6 text-center transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5",
                        selectedCategory === index && "border-orange-500/50"
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25">
                        <category.icon className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h3 className={`mb-1 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{category.title}</h3>
                        <p className={`text-[13px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{category.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Questions */}
              <div className="max-w-4xl mx-auto">
                {filteredCategories.map((category, categoryIndex) => (
                  <div key={category.title} className="mb-12">
                    {!searchQuery && (
                      <h2 className={`mb-6 text-[24px] font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {category.title}
                      </h2>
                    )}
                    <div className="space-y-4">
                      {category.questions.map((item, questionIndex) => {
                        const globalIndex = `${categoryIndex}-${questionIndex}`
                        const isOpen = openQuestion === globalIndex
                        return (
                          <div
                            key={item.q}
                            className={cx(
                              getCardClass(theme),
                              "overflow-hidden transition-all duration-300"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setOpenQuestion(isOpen ? null : globalIndex)}
                              className={`flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white" : "text-slate-800"}`}
                            >
                              <span className="text-[15px] font-medium leading-relaxed">{item.q}</span>
                              <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className={`px-6 pb-6 pt-0 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className={`text-center py-12 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                    No questions found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-black" : "bg-gradient-to-b from-slate-50 to-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <h2 className="mb-4 text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                Still Have <span className="nulo-gradient-text">Questions?</span>
              </h2>
              <p className={`mx-auto mb-8 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Can't find what you're looking for? Reach out to our support team and we'll help you get started.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/contact">
                  <Button className="rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 px-8 py-4 text-[15px]">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="rounded-lg border border-orange-500/70 bg-transparent text-orange-400 font-semibold transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-black px-8 py-4 text-[15px]">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
