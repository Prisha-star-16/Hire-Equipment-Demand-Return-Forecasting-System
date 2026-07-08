'use client'

import React, { useMemo } from 'react'
import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, TooltipProps
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface DemandForecastChartProps {
  forecastData: Array<{
    week: string
    forecast: number
    lower: number
    upper: number
    actual?: number | null
  }>
  historyData: Array<{ month: string; total_qty: number }>
  selectedCategory: string
  selectedHorizon: 30 | 60 | 90
  showML: boolean
}

// --------------------------------------------------------
// Custom Tooltip
// --------------------------------------------------------
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] shadow-md rounded-lg p-3 min-w-[180px] text-xs">
      <p className="text-brand-muted font-medium mb-2 border-b border-[#E2E8F0] pb-1.5">
        📅 {label}
      </p>
      {payload.map((entry, i) => (
        entry.value != null && (
          <div key={i} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-brand-muted">{entry.name}</span>
            </div>
            <span className="text-brand-text font-semibold">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        )
      ))}
    </div>
  )
}

// --------------------------------------------------------
// Main Component
// --------------------------------------------------------
export default function DemandForecastChart({
  forecastData,
  historyData,
  selectedCategory,
  selectedHorizon,
  showML
}: DemandForecastChartProps) {

  const categoryLabel = selectedCategory === 'all_categories'
    ? 'All Equipment Categories'
    : selectedCategory

  // Combine last 8 months of history + forecast into one series
  const chartData = useMemo(() => {
    // Build recent history points (weekly approx from monthly)
    const historyPoints = historyData.slice(-6).map(d => ({
      week: d.month,
      history: d.total_qty,
      forecast: null,
      lower: null,
      upper: null,
      actual: null,
      isHistory: true
    }))

    // Build forecast points
    const forecastPoints = forecastData.map(d => ({
      week: d.week,
      history: null,
      forecast: d.forecast,
      lower: Math.max(0, d.lower),
      upper: d.upper,
      actual: d.actual ?? null,
      isHistory: false
    }))

    return [...historyPoints, ...forecastPoints]
  }, [forecastData, historyData])

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.history ?? 0, d.upper ?? 0, d.actual ?? 0))
  )

  return (
    <section id="forecast" className="glass-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-brand-orange" />
            <h2 className="text-brand-text font-semibold text-base">
              {showML ? 'XGBoost Demand Forecast' : 'Expected Equipment Demand'}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange font-medium">
              {selectedHorizon}-Day Horizon
            </span>
          </div>
          <p className="text-brand-muted text-xs">
            Predicted weekly hire volume — <span className="text-brand-text">{categoryLabel}</span>
          </p>
        </div>

        {/* Legend badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { color: '#205295', label: 'Historical Demand', dash: false },
            { color: '#E67E22', label: showML ? 'XGBoost Forecast' : 'Expected', dash: true },
            { color: '#EF4444', label: 'Actual (if available)', dash: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 flex items-center">
                <div
                  className="w-full h-0.5 rounded"
                  style={{
                    backgroundColor: item.color,
                    borderTop: item.dash ? `2px dashed ${item.color}` : undefined,
                    background: item.dash ? 'none' : item.color
                  }}
                />
              </div>
              <span className="text-brand-muted">{item.label}</span>
            </div>
          ))}
          {showML && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 rounded" style={{ background: 'rgba(230,126,34,0.2)' }} />
              <span className="text-brand-muted">80% Confidence</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div id="demand-chart" className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#205295" stopOpacity={0.20} />
                <stop offset="95%" stopColor="#205295" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E67E22" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E67E22" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />

            <XAxis
              dataKey="week"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={v => typeof v === 'string' ? v.slice(0, 7) : (v || '')}
              interval={1}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              domain={[0, Math.ceil(maxValue * 1.1 / 1000) * 1000]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Confidence band (area between lower/upper) */}
            {showML && (
              <>
                <Area
                  dataKey="upper"
                  fill="url(#forecastGrad)"
                  stroke="none"
                  name="Upper bound"
                  legendType="none"
                  connectNulls
                />
                <Area
                  dataKey="lower"
                  fill="#FFFFFF"
                  stroke="none"
                  name="Lower bound"
                  legendType="none"
                  connectNulls
                />
              </>
            )}

            {/* Historical demand area */}
            <Area
              type="monotone"
              dataKey="history"
              stroke="#205295"
              strokeWidth={2}
              fill="url(#historyGrad)"
              name="Historical Demand"
              dot={false}
              connectNulls
            />

            {/* Actual values (if within test set) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#EF4444"
              strokeWidth={2}
              name="Actual"
              dot={{ fill: '#EF4444', r: 3 }}
              connectNulls
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#E67E22"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              name={showML ? "XGBoost Forecast" : "Expected Demand"}
              dot={{ fill: '#E67E22', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#E67E22', stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls
            />

            {/* Reference line at forecast start */}
            {forecastData.length > 0 && (
              <ReferenceLine
                x={forecastData[0]?.week}
                stroke="#E67E22"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: 'Forecast Start', fill: '#64748B', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Horizon info bar */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-4 text-xs text-brand-muted">
        <span>📊 <strong className="text-brand-text">{forecastData.length}</strong> weeks plotted</span>
        <span>🎯 Horizon: <strong className="text-brand-text">{selectedHorizon} days</strong></span>
        {showML && <span>🤖 Model: <strong className="text-brand-text">XGBoost (Recursive)</strong></span>}
        {showML && <span>📐 Confidence band: <strong className="text-brand-text">80% interval</strong></span>}
      </div>
    </section>
  )
}
