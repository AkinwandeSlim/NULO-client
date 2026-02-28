"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Eye, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface StatsCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: ReactNode
  color: "orange" | "purple" | "green" | "slate"
  trend?: {
    value: number
    isPositive: boolean
  }
  action?: {
    label: string
    href: string
  }
  badge?: {
    text: string
    variant: "default" | "success" | "warning" | "error"
  }
}

const colorClasses = {
  orange: {
    border: "border-orange-350 hover:border-orange-500",
    iconBg: "bg-gradient-to-br from-orange-200 to-orange-300",
    iconColor: "text-orange-700",
    valueColor: "text-orange-700",
    badge: "bg-orange-500 text-white"
  },
  purple: {
    border: "border-purple-350 hover:border-purple-500",
    iconBg: "bg-gradient-to-br from-purple-200 to-purple-300",
    iconColor: "text-purple-700",
    valueColor: "text-purple-700",
    badge: "bg-purple-500 text-white"
  },
  green: {
    border: "border-green-350 hover:border-green-500",
    iconBg: "bg-gradient-to-br from-green-200 to-green-300",
    iconColor: "text-green-700",
    valueColor: "text-green-700",
    badge: "bg-green-500 text-white"
  },
  slate: {
    border: "border-slate-350 hover:border-slate-500",
    iconBg: "bg-gradient-to-br from-slate-200 to-slate-300",
    iconColor: "text-slate-700",
    valueColor: "text-slate-700",
    badge: "bg-slate-500 text-white"
  }
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  action, 
  badge 
}: StatsCardProps) {
  const router = useRouter()
  const classes = colorClasses[color]

  return (
    <Card 
      className={`cursor-pointer group bg-white/80 backdrop-blur-sm border ${classes.border} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
      onClick={() => action && router.push(action.href)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`text-sm font-semibold ${classes.iconColor}`}>
          {title}
        </CardTitle>
        <div className={`p-3 ${classes.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={`text-3xl font-bold ${classes.valueColor}`}>
          {value}
        </div>
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
          {subtitle}
        </p>
        
        {trend && (
          <div className="flex items-center gap-2 text-sm">
            <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>
            <span className="text-gray-500">vs last period</span>
          </div>
        )}
        
        {badge && (
          <Badge className={`mt-3 ${classes.badge} border-0 font-semibold shadow-lg`}>
            {badge.text}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
