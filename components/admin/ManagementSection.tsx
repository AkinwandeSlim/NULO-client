"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle, Users, Building } from "lucide-react"
import { useRouter } from "next/navigation"

interface ManagementSectionProps {
  title: string
  description?: string
  icon: ReactNode
  color: "orange" | "purple" | "green"
  stats: {
    total: number
    verified: number
    pending: number
    rejected: number
  }
  additionalStats?: Array<{
    label: string
    value: number
    icon?: ReactNode
  }>
  primaryAction: {
    label: string
    href: string
    icon?: ReactNode
  }
  secondaryAction: {
    label: string
    href: string
    icon?: ReactNode
  }
}

const colorClasses = {
  orange: {
    header: "bg-gradient-to-r from-orange-50 to-orange-100",
    border: "border-orange-200",
    iconBg: "bg-orange-500",
    titleColor: "text-orange-900",
    valueColor: "text-orange-600",
    primaryBtn: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    secondaryBtn: "border-orange-300 text-orange-700 hover:bg-orange-50"
  },
  purple: {
    header: "bg-gradient-to-r from-purple-50 to-purple-100",
    border: "border-purple-200",
    iconBg: "bg-purple-500",
    titleColor: "text-purple-900",
    valueColor: "text-purple-600",
    primaryBtn: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    secondaryBtn: "border-purple-300 text-purple-700 hover:bg-purple-50"
  },
  green: {
    header: "bg-gradient-to-r from-green-50 to-green-100",
    border: "border-green-200",
    iconBg: "bg-green-500",
    titleColor: "text-green-900",
    valueColor: "text-green-600",
    primaryBtn: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    secondaryBtn: "border-green-300 text-green-700 hover:bg-green-50"
  }
}

export default function ManagementSection({
  title,
  description,
  icon,
  color,
  stats,
  additionalStats = [],
  primaryAction,
  secondaryAction
}: ManagementSectionProps) {
  const router = useRouter()
  const classes = colorClasses[color]

  return (
    <Card className="bg-white/80 backdrop-blur-lg border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <CardHeader className={`${classes.header} rounded-t-2xl pb-4`}>
        <CardTitle className={`flex items-center gap-3 ${classes.titleColor} font-bold text-lg`}>
          <div className={`p-2 ${classes.iconBg} rounded-lg shadow-lg`}>
            {icon}
          </div>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className={`${classes.titleColor.replace('900', '700')} font-medium text-sm mt-1`}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Total Registered</span>
          <span className={`text-3xl font-bold ${classes.valueColor}`}>{stats.total}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
            <span className="text-sm font-medium text-slate-700">✓ Verified</span>
            <Badge className="bg-green-500 text-white font-bold">{stats.verified}</Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border-2 border-orange-200">
            <span className="text-sm font-medium text-slate-700">⏳ Pending</span>
            <Badge className="bg-orange-500 text-white font-bold">{stats.pending}</Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border-2 border-red-200">
            <span className="text-sm font-medium text-slate-700">✗ Rejected</span>
            <Badge className="bg-red-500 text-white font-bold">{stats.rejected}</Badge>
          </div>
          
          {additionalStats.map((additionalStat, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-slate-300">
              <span className="text-sm font-medium text-slate-700">
                {additionalStat.icon} {additionalStat.label}
              </span>
              <Badge variant="outline" className={`border-2 ${classes.border.replace('200', '300')} ${classes.valueColor} font-bold`}>
                {additionalStat.value}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button 
            variant="outline"
            size="sm"
            className={`flex-1 border-2 ${classes.secondaryBtn} font-bold rounded-xl transition-all duration-300 hover:scale-105`} 
            onClick={() => router.push(secondaryAction.href)}
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </Button>
          <Button 
            size="sm"
            className={`flex-1 ${classes.primaryBtn} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`} 
            onClick={() => router.push(primaryAction.href)}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
