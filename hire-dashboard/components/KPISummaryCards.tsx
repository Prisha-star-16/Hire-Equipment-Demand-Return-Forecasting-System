import clsx from 'clsx'
import { Package, Clock, TrendingUp, BarChart3, Award, Zap } from 'lucide-react'

interface KPIProps {
  kpi: {
    total_orders: number
    unique_equipment_types: number
    avg_hire_duration_days: number
    total_qty_forecast_30d: number
    total_qty_forecast_60d: number
    total_qty_forecast_90d: number
    most_demanded_category: string
  }
  metrics: Record<string, Record<string, number>>
  showML: boolean
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
  accentColor: 'orange' | 'blue' | 'navy' | 'green'
  delay?: number
}

const ACCENT_STYLES: Record<string, { icon: string; badge: string; border: string; glow: string }> = {
  orange: {
    icon:   'text-brand-orange bg-brand-orange/10',
    badge:  'text-brand-orange bg-brand-orange/10',
    border: 'hover:border-brand-orange/40',
    glow:   'hover:shadow-glow-orange'
  },
  blue: {
    icon:   'text-brand-steel-light bg-brand-steel/10',
    badge:  'text-brand-steel-light bg-brand-steel/10',
    border: 'hover:border-brand-steel-light/40',
    glow:   'hover:shadow-glow-steel'
  },
  navy: {
    icon:   'text-blue-400 bg-blue-400/10',
    badge:  'text-blue-400 bg-blue-400/10',
    border: 'hover:border-blue-400/40',
    glow:   ''
  },
  green: {
    icon:   'text-brand-green bg-brand-green/10',
    badge:  'text-brand-green bg-brand-green/10',
    border: 'hover:border-brand-green/40',
    glow:   ''
  }
}

function MetricCard({ icon, label, value, subtext, accentColor, delay = 0 }: MetricCardProps) {
  const styles = ACCENT_STYLES[accentColor]
  return (
    <div
      className={clsx(
        'glass-card p-5 flex flex-col gap-3 transition-all duration-300 cursor-default',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        styles.border,
        styles.glow,
        'animate-slide-up'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={clsx('p-2.5 rounded-lg', styles.icon)}>
          {icon}
        </div>
        {subtext && (
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', styles.badge)}>
            {subtext}
          </span>
        )}
      </div>
      <div>
        <p className="text-brand-muted text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-brand-text text-2xl font-bold leading-none">{value}</p>
      </div>
    </div>
  )
}

export default function KPISummaryCards({ kpi, metrics, showML }: KPIProps) {
  // Extract best model RMSE for the 30-day horizon
  const xgbRmse30 = metrics['30-day_(4_wks)']?.xgboost_rmse
    ?? metrics['30_day']?.xgb_rmse
    ?? '—'
  const prophetRmse30 = metrics['30-day_(4_wks)']?.prophet_rmse
    ?? metrics['30_day']?.prophet_rmse
    ?? '—'

  let cards: MetricCardProps[] = [
    {
      icon: <Package size={18} />,
      label: 'Total Invoices',
      value: kpi.total_orders.toLocaleString(),
      subtext: 'Processed',
      accentColor: 'blue',
      delay: 0
    },
    {
      icon: <BarChart3 size={18} />,
      label: 'Equipment Types',
      value: kpi.unique_equipment_types.toLocaleString(),
      subtext: '8 categories',
      accentColor: 'navy',
      delay: 50
    },
    {
      icon: <Clock size={18} />,
      label: 'Avg Hire Time',
      value: `${kpi.avg_hire_duration_days} days`,
      subtext: 'Median',
      accentColor: 'orange',
      delay: 100
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'Expected: 30 Day',
      value: kpi.total_qty_forecast_30d.toLocaleString(),
      subtext: 'units',
      accentColor: 'green',
      delay: 150
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'Expected: 60 Day',
      value: kpi.total_qty_forecast_60d.toLocaleString(),
      subtext: 'units',
      accentColor: 'blue',
      delay: 200
    },
    {
      icon: <TrendingUp size={18} />,
      label: 'Expected: 90 Day',
      value: kpi.total_qty_forecast_90d.toLocaleString(),
      subtext: 'units',
      accentColor: 'orange',
      delay: 250
    },
    {
      icon: <Award size={18} />,
      label: 'Highest Demand',
      value: kpi.most_demanded_category,
      subtext: 'by volume',
      accentColor: 'orange',
      delay: 300
    }
  ]

  if (showML) {
    cards.push({
      icon: <Zap size={18} />,
      label: 'XGBoost RMSE (30d)',
      value: typeof xgbRmse30 === 'number' ? xgbRmse30.toFixed(0) : String(xgbRmse30),
      subtext: typeof prophetRmse30 === 'number' ? `Prophet: ${Number(prophetRmse30).toFixed(0)}` : 'vs Prophet',
      accentColor: 'green',
      delay: 350
    })
  }

  return (
    <section id="kpi-cards">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <MetricCard key={i} {...c} />
        ))}
      </div>
    </section>
  )
}
