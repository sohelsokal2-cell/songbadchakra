import { toBengaliNumber } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  icon: string
  description?: string
  trend?: string
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

export default function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = 'blue',
}: StatCardProps) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100',
      iconBg: 'bg-purple-100',
    },
  }

  const currentTheme = colorMap[variant]

  return (
    <div className={`p-5 rounded-xl bg-white border ${currentTheme.border} shadow-xs font-bengali flex items-start justify-between transition-all hover:shadow-md`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <div className="text-3xl font-extrabold text-slate-800">
          {toBengaliNumber(value)}
        </div>
        {description && (
          <p className="text-xs text-slate-500">
            {description}
          </p>
        )}
        {trend && (
          <div className="text-[11px] font-medium text-emerald-600 mt-1">
            {trend}
          </div>
        )}
      </div>

      <div className={`w-12 h-12 rounded-xl ${currentTheme.iconBg} flex items-center justify-center text-xl shrink-0`}>
        {icon}
      </div>
    </div>
  )
}
