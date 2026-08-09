"use client"

/**
 * About Page — CEO Letter + Founders
 * ------------------------------------------------------------------
 * Moved from landing page to give investors/users a dedicated space
 * to learn about the people and story behind NuloAfrica.
 * ------------------------------------------------------------------
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { ChevronRight, Eye, Target, ShieldCheck, MapPin, Mail, Phone, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/80 bg-white"}`
const getCardHoverClass = () =>
  "transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const FOUNDERS = [
  {
    name: "Terver Orbunde (MBA)",
    role: "Founder & Chief Executive Officer",
    bio: "Visionary leader driving the trust infrastructure for Africa's housing economy through technology, data, and innovative financing models.",
    image: "/images/ceo.jpg",
  },
  {
    name: "Fakorede Akinwande Alexander",
    role: "Founding Engineer / Technical Lead",
    bio: "Technology architect building scalable platforms and AI-powered solutions for African real estate markets.",
    image: "/images/cto2.png",
  },
]

export default function AboutPage() {
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
              <p className={cx(EYEBROW, "mb-4")}>About NuloAfrica</p>
              <h1 className="text-[36px] sm:text-[44px] font-bold leading-tight mb-6 lg:text-[52px]">
                The People Behind{" "}
                <span className="nulo-gradient-text">Africa&apos;s Housing Revolution</span>
              </h1>
              <p className={`text-[15px] sm:text-[16px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Meet the team building the trust infrastructure for Africa&apos;s housing economy.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CEO Message */}
        <section className={`py-16 sm:py-20 lg:py-24 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="grid items-start gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16"
            >
              {/* Left — Text */}
              <div>
                <p className={cx(EYEBROW, "mb-3")}>Message from the CEO</p>
                <h2 className="mb-5 sm:mb-6 text-[24px] sm:text-[30px] font-bold leading-tight lg:text-[36px]">
                  Building the Future of{" "}
                  <span className="nulo-gradient-text">Housing in Africa</span>
                </h2>
                <div className={`space-y-4 text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/65" : "text-slate-600"}`}>
                  <p>
                    Housing is one of humanity&apos;s most fundamental needs, yet for millions of
                    Africans, it remains one of life&apos;s greatest challenges.
                  </p>
                  <p>
                    For too long, access to housing has been defined by high barriers, fragmented
                    markets, limited financing, and a lack of trust. Families struggle to find safe
                    places to rent. Investors face unnecessary obstacles to participating in real
                    estate. Property owners and managers navigate inefficient systems that slow
                    growth and reduce confidence.
                  </p>
                  <p>
                    At Nulo Africa, we believe there is a better way. We are building the trust
                    infrastructure that powers Africa&apos;s housing economy. Our ambition goes
                    beyond creating products—we are creating an ecosystem where technology, data, and
                    innovative financing models work together to make housing more accessible,
                    transparent, and inclusive.
                  </p>
                  <p>
                    Through our Equity Share Trust Platform (NEST), we are democratizing property
                    ownership by enabling more people to invest in rental real estate through
                    fractional ownership. Through our AI-powered Rental Marketplace, we are creating
                    trusted digital experiences that simplify renting and property management.
                    Through our Advisory Services, we partner with governments, institutions, and
                    private sector leaders to design the policies, systems, and strategies that will
                    shape the future of housing across the continent.
                  </p>
                  <p>
                    We believe that prosperous nations are not defined by the number of buildings
                    they construct, but by the number of people who can confidently participate in
                    the opportunities those buildings create. This is more than real estate. It is
                    about financial inclusion, economic resilience, and generational wealth. It is
                    about building systems that outlast us and creating opportunities that extend to
                    every African.
                  </p>
                  <p className="font-medium text-orange-400">
                    Thank you for joining us on this journey. Together, we are not simply building
                    houses—we are building the future of housing in Africa.
                  </p>
                </div>

                {/* Signature */}
                <div className={`mt-8 flex items-center gap-4 border-t pt-6 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                  <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-orange-500/40 flex-shrink-0">
                    <img src="/images/pceo.jpg" alt="Terver Orbunde" className="h-full w-full object-cover object-[center_10%]" />
                  </div>
                  <div>
                    <div className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Terver Orbunde (MBA)</div>
                    <div className="text-[13px] text-orange-400">Founder &amp; Chief Executive Officer, Nulo Africa</div>
                  </div>
                </div>
              </div>

              {/* Right — Image card */}
              <div className="lg:sticky lg:top-28">
                <div className={`relative overflow-hidden rounded-2xl shadow-2xl shadow-black/30
                  ${theme === "dark" ? "border border-white/[0.06]" : "border border-orange-500/20"}`}>
                  <div className="relative h-[480px] sm:h-[560px] w-full">
                    <img
                      src="/images/ceo1.jpg"
                      alt="Terver Orbunde — CEO, NuloAfrica"
                      className="h-full w-full object-cover object-[center_8%] transition-transform duration-700 hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Logo badge */}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center justify-center rounded-xl bg-black/50 px-2.5 py-2 shadow-lg backdrop-blur-sm">
                        <img
                          src="/nuloafrica-newlightlogo-complete.png"
                          alt="NuloAfrica"
                          className="h-6 w-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* Bottom badge */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-400">Founder &amp; CEO</span>
                      </div>
                      <div className="text-[18px] font-bold text-white leading-tight">Terver Orbunde (MBA)</div>
                      <div className="mt-1 text-[12px] text-white/60">NuloAfrica · Abuja, Nigeria</div>
                    </div>
                  </div>

                  {/* Quote strip */}
                  <div className={`px-5 py-4 border-t ${theme === "dark" ? "border-white/[0.06] bg-[#0d0d0d]" : "border-orange-500/10 bg-slate-50"}`}>
                    <p className={`text-[12px] leading-relaxed italic ${theme === "dark" ? "text-white/45" : "text-slate-500"}`}>
                      &ldquo;We are not simply building houses — we are building the future of housing in Africa.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Founders */}
        <section className={`py-16 sm:py-20 lg:py-24 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-gradient-to-b from-slate-50 to-orange-50"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center mb-12 sm:mb-16">
                <p className={cx(EYEBROW, "mb-3")}>Meet the Founders</p>
                <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                  The Team Behind <span className="nulo-gradient-text">NuloAfrica</span>
                </h2>
                <p className={`mt-4 text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/55" : "text-slate-500"}`}>
                  A passionate team building the future of African real estate.
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl items-stretch gap-8 sm:grid-cols-2">
                {FOUNDERS.map((founder, index) => (
                  <motion.div
                    key={founder.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                    className={cx(getCardClass(theme), getCardHoverClass(), "flex h-full flex-col overflow-hidden")}
                  >
                    {/* Image */}
                    <div className="relative h-80 w-full overflow-hidden sm:h-[420px]">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        className="h-full w-full object-cover object-[center_10%]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-[17px] font-bold text-white leading-tight">{founder.name}</h3>
                        <p className="mt-1 text-[13px] font-semibold text-orange-400">{founder.role}</p>
                      </div>
                    </div>
                    {/* Bio */}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/55" : "text-slate-500"}`}>{founder.bio}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our Values */}
        <section className={`py-16 sm:py-20 lg:py-24 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center mb-12 sm:mb-16">
                <p className={cx(EYEBROW, "mb-3")}>Our Values</p>
                <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                  What Drives <span className="nulo-gradient-text">Our Mission</span>
                </h2>
              </div>

              <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cx(
                    getCardClass(theme),
                    "flex items-start gap-4 p-6 sm:p-7 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                  )}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <Eye className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className={`mb-2 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Our Vision</h3>
                    <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      A future where every African has a trusted pathway to secure housing, build wealth, and participate in the continent&apos;s real estate economy.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className={cx(
                    getCardClass(theme),
                    "flex items-start gap-4 p-6 sm:p-7 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                  )}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <Target className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className={`mb-2 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Our Mission</h3>
                    <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Leverage technology, data, and innovative financing to make housing accessible, transparent, and inclusive across Africa.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className={cx(
                    getCardClass(theme),
                    "flex items-start gap-4 p-6 sm:p-7 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                  )}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <ShieldCheck className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className={`mb-2 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Our Values</h3>
                    <p className={`text-[14px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      Trust first. Verified always. Built for the way Africans live, work, and invest — with people at the center.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-black" : "bg-gradient-to-b from-orange-50 to-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <h2 className="mb-4 text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                Ready to <span className="nulo-gradient-text">Join the Revolution?</span>
              </h2>
              <p className={`mx-auto mb-8 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Be part of Africa&apos;s housing transformation. Whether you&apos;re looking to rent, manage, or invest — NuloAfrica has a place for you.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="https://nest-by-nulo.vercel.app/">
                  <Button className="rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 px-8 py-4 text-[15px] group">
                    Join the NEST Waitlist
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button className="rounded-lg border border-orange-500/70 bg-transparent text-orange-400 font-semibold transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-black px-8 py-4 text-[15px]">
                    Explore Properties
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
