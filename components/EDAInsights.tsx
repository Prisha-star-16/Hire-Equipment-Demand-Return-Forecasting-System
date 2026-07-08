'use client'

import React from 'react'
import { Lightbulb, TrendingUp, Layers, Clock, Zap } from 'lucide-react'
import clsx from 'clsx'

interface InsightItem {
  id: string
  title: string
  value: string
  description: string
  icon: string
  color: string
}

interface EDAInsightsProps {
  insights: InsightItem[]
  metrics: Record<string, Record<string, number>>
  showML: boolean
}

const ICON_MAP: Record<string, React.ReactNode> = {
  trending_up:    <TrendingUp size={20} />,
  layers:         <Layers size={20} />,
  schedule:       <Clock size={20} />,
  model_training: <Zap size={20} />,
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; value: string }> = {
  orange: {
    bg: 'bg-brand-orange/10',
    text: 'text-brand-orange',
    border: 'border-brand-orange/20',
    value: 'text-brand-orange'
  },
  blue: {
    bg: 'bg-brand-steel/10',
    text: 'text-brand-steel-light',
    border: 'border-brand-steel-light/20',
    value: 'text-brand-steel-light'
  },
  navy: {
    bg: 'bg-blue-900/30',
    text: 'text-blue-400',
    border: 'border-blue-400/20',
    value: 'text-blue-400'
  },
  green: {
    bg: 'bg-brand-green/10',
    text: 'text-brand-green',
    border: 'border-brand-green/20',
    value: 'text-brand-green'
  }
}

function InsightCard({ item }: { item: InsightItem }) {
  const colors = COLOR_MAP[item.color] ?? COLOR_MAP.blue

  return (
    <div
      id={item.id}
      className={clsx(
        'glass-card p-5 border transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-2.5 rounded-xl', colors.bg, colors.text)}>
          {ICON_MAP[item.icon] ?? <Lightbulb size={20} />}
        </div>
        <span className={clsx('text-2xl font-black leading-none', colors.value)}>
          {item.value}
        </span>
      </div>
      <h3 className="text-brand-text font-semibold text-sm mb-2">{item.title}</h3>
      <p className="text-brand-muted text-xs leading-relaxed">{item.description}</p>
    </div>
  )
}

function ModelComparisonTable({ metrics }: { metrics: Record<string, Record<string, number>> }) {
  const horizons = Object.keys(metrics)
  if (horizons.length === 0) return null

  return (
    <div className="glass-card p-5 border border-brand-border">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={15} className="text-brand-orange" />
        <h3 className="text-brand-text font-semibold text-sm">Model Evaluation — Detailed Metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table id="metrics-table" className="w-full text-xs">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left text-brand-muted pb-2 pr-4">Horizon</th>
              <th className="text-right text-brand-muted pb-2 px-3">Prophet MAE</th>
              <th className="text-right text-brand-muted pb-2 px-3">Prophet RMSE</th>
              <th className="text-right text-brand-muted pb-2 px-3">XGBoost MAE</th>
              <th className="text-right text-brand-muted pb-2 px-3">XGBoost RMSE</th>
              <th className="text-right text-brand-muted pb-2 pl-3">Winner</th>
            </tr>
          </thead>
          <tbody>
            {horizons.map(h => {
              const m = metrics[h]
              const pRmse = m.prophet_rmse
              const xRmse = m.xgb_rmse
              const xgbWins = xRmse < pRmse
              return (
                <tr key={h} className="border-b border-brand-border/50 hover:bg-brand-surface transition-colors">
                  <td className="py-2.5 pr-4 text-brand-text font-medium">{h.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-3 text-right text-brand-muted">{m.prophet_mae?.toFixed(1) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-brand-muted">{pRmse?.toFixed(1) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-brand-text">{m.xgb_mae?.toFixed(1) ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-brand-text font-semibold">{xRmse?.toFixed(1) ?? '—'}</td>
                  <td className="py-2.5 pl-3 text-right">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      xgbWins
                        ? 'bg-brand-green/10 text-brand-green'
                        : 'bg-blue-400/10 text-blue-400'
                    )}>
                      {xgbWins ? '⚡ XGBoost' : '🔮 Prophet'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-brand-muted text-xs mt-3 pt-3 border-t border-brand-border">
        <strong className="text-brand-text">Interpretation</strong>: Lower RMSE = better accuracy. 
        XGBoost&#39;s lag features capture autocorrelation patterns that Prophet&#39;s Fourier decomposition misses 
        on datasets with &lt;3 full seasonal cycles.
      </p>
    </div>
  )
}

export default function EDAInsights({ insights, metrics, showML }: EDAInsightsProps) {
  // If not showing ML, filter out ML-related insights to keep it operational
  let defaultInsights = [
    {
      id: 'insight_q3',
      title: 'Strong Q3 Demand Peak',
      value: '+24%',
      description: 'Equipment demand peaks Jul–Sep driven by optimal construction weather. Plan inventory 60 days before Q3.',
      icon: 'trending_up',
      color: 'orange'
    },
    {
      id: 'insight_formwork',
      title: 'Formwork Panels Dominate',
      value: '38.4%',
      description: 'MANTO and PROTECTO systems account for over a third of all hire volume — the most critical inventory category.',
      icon: 'layers',
      color: 'blue'
    },
    {
      id: 'insight_duration',
      title: 'Long Hire Cycles',
      value: '187 days',
      description: 'Average 6-month hire duration creates capital lock-up risk. Return forecasting is as critical as demand forecasting.',
      icon: 'schedule',
      color: 'navy'
    }
  ]

  if (showML) {
    defaultInsights.push({
      id: 'insight_xgb',
      title: 'XGBoost Wins on RMSE',
      value: '36% better',
      description: 'XGBoost achieves 36% lower RMSE than Prophet on 30-day forecasts via rich lag feature engineering.',
      icon: 'model_training',
      color: 'green'
    })
  }

  const finalInsights = insights?.length > 0 
    ? (showML ? insights : insights.filter(i => i.id !== 'insight_xgb' && !i.title.includes('RMSE'))) 
    : defaultInsights

  return (
    <section id="insights" className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-brand-orange" />
        <h2 className="text-brand-text font-semibold text-base">
          {showML ? 'EDA Insights & Model Analysis' : 'Key Business Insights'}
        </h2>
        <span className="text-brand-muted text-xs ml-2">/ Key Findings</span>
      </div>

      {/* Insight cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {finalInsights.map(item => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>

      {/* Model comparison table - ONLY SHOW IF ML TOGGLE IS ON */}
      {showML && Object.keys(metrics).length > 0 && (
        <ModelComparisonTable metrics={metrics} />
      )}
    </section>
  )
}
