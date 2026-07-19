"use client"

/**
 * Contact Page — Full form + contact info
 * ------------------------------------------------------------------
 * Dedicated contact page with:
 * - Full 3-field form (name, email, message)
 * - Contact details (email, phone, location)
 * - Social media links
 * - Office hours / support availability
 * ------------------------------------------------------------------
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { MapPin, Mail, Phone, Send, Clock, Users, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/80 bg-white"}`

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const SOCIAL_ICONS = [
  {
    label: "Facebook",
    href: "#",
    path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68-1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-10.4a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.44v6.3ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { theme } = useTheme()
  const { toast } = useToast()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      })
      setFormData({ name: "", email: "", message: "" })
      setIsSubmitting(false)
    }, 1000)
  }

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
        <section className={`relative py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-black to-[#0A0A0A]" : "bg-gradient-to-b from-white to-slate-50"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className={cx(EYEBROW, "mb-4")}>Get In Touch</p>
              <h1 className="text-[36px] sm:text-[44px] font-bold leading-tight mb-6 lg:text-[52px]">
                Let&apos;s <span className="nulo-gradient-text">Talk</span>
              </h1>
              <p className={`text-[15px] sm:text-[16px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Have a question about NEST, rentals, or property management? We&apos;re here to help.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Form + Info */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <div className="grid gap-10 sm:gap-16 lg:grid-cols-2">
              {/* Left — Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="mb-6">
                  <h2 className={`text-[24px] sm:text-[28px] font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Send Us a Message
                  </h2>
                  <p className={`text-[14px] ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className={cx(getCardClass(theme), "p-6 lg:p-8")}>
                  <div className="mb-5">
                    <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${
                        theme === "dark"
                          ? "border-white/10 bg-black/50 text-white placeholder:text-white/25"
                          : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>

                  <div className="mb-5">
                    <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${
                        theme === "dark"
                          ? "border-white/10 bg-black/50 text-white placeholder:text-white/25"
                          : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>

                  <div className="mb-6">
                    <label className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Message
                    </label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Tell us how we can help…"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-[14px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-none ${
                        theme === "dark"
                          ? "border-white/10 bg-black/50 text-white placeholder:text-white/25"
                          : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 w-full py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </motion.div>

              {/* Right — Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col gap-8"
              >
                {/* Location */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <MapPin className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className={`text-[18px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Our Location</h3>
                  </div>
                  <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    Abuja, Nigeria
                    <br />
                    Serving Lagos, Abuja &amp; Port Harcourt
                  </p>
                </div>

                {/* Email */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <Mail className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className={`text-[18px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Email Us</h3>
                  </div>
                  <div className={`space-y-2 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    <p>
                      <span className="font-medium text-orange-400">General:</span>{" "}
                      <a href="mailto:nuloafrica@gmail.com" className="hover:text-orange-400 transition-colors">
                        nuloafrica@gmail.com
                      </a>
                    </p>
                    <p>
                      <span className="font-medium text-orange-400">Support:</span>{" "}
                      <a href="mailto:nuloafrica26@outlook.com" className="hover:text-orange-400 transition-colors">
                        nuloafrica26@outlook.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <Phone className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className={`text-[18px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Call Us</h3>
                  </div>
                  <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    <a href="tel:+2348134942775" className="hover:text-orange-400 transition-colors">
                      +234 813 494 2775
                    </a>
                  </p>
                </div>

                {/* Office Hours */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <Clock className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className={`text-[18px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Support Hours</h3>
                  </div>
                  <div className={`space-y-1 text-[14px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    <p>Monday – Friday: 9:00 AM – 6:00 PM WAT</p>
                    <p>Saturday: 10:00 AM – 4:00 PM WAT</p>
                    <p>Sunday: Closed</p>
                    <p className="mt-2 text-orange-400 font-medium">Emergency support available 24/7</p>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <Users className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className={`text-[18px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Follow Us</h3>
                  </div>
                  <div className="flex gap-3">
                    {SOCIAL_ICONS.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:border-orange-500/50 hover:bg-orange-500/10 ${
                          theme === "dark" ? "border-white/10 text-white/60" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <path d={s.path} />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quick Links CTA */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-black" : "bg-gradient-to-b from-slate-50 to-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center mb-12">
                <h2 className="mb-4 text-[28px] sm:text-[34px] font-bold leading-tight">
                  Looking for <span className="nulo-gradient-text">Quick Answers?</span>
                </h2>
                <p className={`mx-auto max-w-xl text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                  Check out our FAQ page or explore our resources below.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                <Link href="/faq">
                  <div className={cx(
                    getCardClass(theme),
                    "flex flex-col items-center text-center p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"
                  )}>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <MessageSquare className="h-7 w-7 text-orange-400" />
                    </div>
                    <h3 className={`text-[16px] font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      FAQs
                    </h3>
                    <p className={`text-[13px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Common questions answered
                    </p>
                  </div>
                </Link>

                <Link href="/about">
                  <div className={cx(
                    getCardClass(theme),
                    "flex flex-col items-center text-center p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"
                  )}>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <Users className="h-7 w-7 text-orange-400" />
                    </div>
                    <h3 className={`text-[16px] font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      About Us
                    </h3>
                    <p className={`text-[13px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Meet the team
                    </p>
                  </div>
                </Link>

                <Link href="/">
                  <div className={cx(
                    getCardClass(theme),
                    "flex flex-col items-center text-center p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"
                  )}>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                      <MessageSquare className="h-7 w-7 text-orange-400" />
                    </div>
                    <h3 className={`text-[16px] font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      Back to Home
                    </h3>
                    <p className={`text-[13px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Explore NuloAfrica
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <Toaster />
    </div>
  )
}
