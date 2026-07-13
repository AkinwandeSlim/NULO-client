"use client"

import { Building2, Users, Shield, Clock } from 'lucide-react'
import { useTheme } from "@/contexts/ThemeContext"

interface StatsProps {
  stats: {
    totalProperties: number
    activeTenants: number
    verifiedLandlords: number
    citiesCovered: number
    newThisWeek?: number
    verificationRate?: number
    avgResponseTime?: string
    loading: boolean
  }
  loading?: boolean
  theme?: "dark" | "light"
}

export function StatsSection({ stats, loading, theme = "dark" }: StatsProps) {
  // ✅ UPDATED: All stats now use orange color scheme
  const displayStats = [
    { 
      icon: Building2,
      value: stats.loading ? "..." : `${stats.totalProperties}+`, 
      label: "Verified Properties", 
      delay: "0.2s",
      subtext: stats.newThisWeek && stats.newThisWeek > 0 
        ? `+${stats.newThisWeek} this week` 
        : 'Growing daily',
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "bg-orange-500/10",
      darkColor: "text-orange-400"
    },
    { 
      icon: Clock,
      value: stats.avgResponseTime || "< 24h", 
      label: "Response Time", 
      delay: "0.4s", 
      pulseDelay: "0.5s",
      subtext: "Fast landlord replies",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "bg-orange-500/10",
      darkColor: "text-orange-400"
    },
    { 
      icon: Shield,
      value: stats.loading ? "..." : `${stats.verificationRate || 95}%`, 
      label: "Verified Landlords", 
      delay: "0.6s", 
      pulseDelay: "1s",
      subtext: "Background checked",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "bg-orange-500/10",
      darkColor: "text-orange-400"
    },
    { 
      icon: Users,
      value: stats.loading ? "..." : `${stats.activeTenants}+`, 
      label: "Active Tenants", 
      delay: "0.8s", 
      pulseDelay: "1.5s",
      subtext: stats.citiesCovered > 0 
        ? `In ${stats.citiesCovered} cities` 
        : "Across Nigeria",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "bg-orange-500/10",
      darkColor: "text-orange-400"
    }
  ]

  return (
    <section className={`py-28 lg:py-32 relative overflow-hidden ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-gradient-to-br from-orange-50 to-slate-50"}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-10 left-1/4 w-32 h-32 rounded-full blur-2xl animate-pulse ${theme === "dark" ? "bg-orange-500" : "bg-orange-300"}`}></div>
        <div 
          className={`absolute bottom-10 right-1/4 w-40 h-40 rounded-full blur-3xl animate-bounce ${theme === "dark" ? "bg-orange-500" : "bg-orange-400"}`}
          style={{animationDelay: '1s', animationDuration: '3s'}}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 lg:mb-16">
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400 mb-3">
            Platform Stats
          </p>
          <h2 className={`text-[28px] font-semibold leading-tight tracking-tight mb-4 ${theme === "dark" ? "text-white" : "text-slate-900"} sm:text-[32px] lg:text-[38px]`}>
            Quality You Can Trust
          </h2>
          <p className={`text-[15px] leading-relaxed tracking-wide max-w-3xl mx-auto ${theme === "dark" ? "text-white/60" : "text-slate-800"}`}>
            Every property verified. Every landlord screened. Every transaction protected.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index}
                className="animate-fade-in-up hover:scale-105 transition-all duration-300" 
                style={{animationDelay: stat.delay}}
              >
                <div className={`${theme === "dark" ? "bg-[#0A0A0A] border border-white/5" : "bg-white"} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
                  {/* Icon */}
                  <div className={`${theme === "dark" ? stat.darkBgColor : stat.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${theme === "dark" ? stat.darkColor : stat.color}`} />
                  </div>
                  
                  {/* Value */}
                  <div 
                    className={`text-4xl font-bold mb-2 ${theme === "dark" ? stat.darkColor : stat.color} ${stats.loading ? '' : 'animate-pulse'}`}
                    style={{animationDelay: stat.pulseDelay}}
                  >
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className={`font-semibold mb-2 text-lg ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                    {stat.label}
                  </div>
                  
                  {/* Subtext */}
                  {stat.subtext && (
                    <div className={`text-sm ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                      {stat.subtext}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust badge */}
        <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '1s'}}>
          <div className={`inline-flex items-center gap-2 backdrop-blur-sm px-5 py-2 rounded-full shadow-md border ${theme === "dark" ? "bg-white/10 border-white/10" : "bg-white/80 border-orange-100"}`}>
            <svg className={`h-5 w-5 ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
              Trusted by {stats.activeTenants > 0 ? `${stats.activeTenants}+` : 'thousands of'} tenants across Nigeria
            </span>
          </div>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`mt-8 text-center text-xs ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>
            <details className="inline-block">
              <summary className="cursor-pointer hover:text-slate-600">View Stats Data</summary>
              <pre className={`mt-2 text-left p-4 rounded max-w-2xl mx-auto overflow-auto ${theme === "dark" ? "bg-white/5" : "bg-slate-100"}`}>
                {JSON.stringify(stats, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  )
}