'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, TooltipProps, Line, ComposedChart
} from 'recharts'
import { CalendarCheck } from 'lucide-react'

interface ReturnForecastChartProps {
  returnData: Array<{
    week: string
    expected_returns: number
    cumulative: number
  }>
  selectedHorizon: 30 | 60 | 90
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 min-w-[175px] text-xs">
      <p className="text-brand-muted font-medium mb-2 border-b border-brand-border pb-1.5">
        📅 {label}
      </p>
      {payload.map((entry, i) => (
        entry.value != null && (
          <div key={i} className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-brand-muted">{entry.name}</span>
            </div>
            <span className="text-brand-text font-semibold">
              {entry.value.toLocaleString()}
            </span>
          </div>
        )
      ))}
    </div>
  )
}

export default function ReturnForecastChart({ returnData, selectedHorizon }: ReturnForecastChartProps) {
  const totalReturns = returnData.reduce((sum, d) => sum + d.expected_returns, 0)
  const peakWeek = returnData.reduce(
    (max, d) => d.expected_returns > max.expected_returns ? d : max,
    returnData[0] || { week: '-', expected_returns: 0, cumulative: 0 }
  )

  // Color bars: peak week gets orange highlight
  const getBarColor = (entry: { expected_returns: number }) => {
    if (entry.expected_returns === peakWeek.expected_returns) return '#F5A623'
    return '#2E86AB'
  }

  return (
    <section id="returns" className="glass-card p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck size={16} className="text-brand-steel-light" />
            <h2 className="text-brand-text font-semibold text-base">Return Forecast</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-steel/20 text-brand-steel-light font-medium">
              {selectedHorizon}d
            </span>
          </div>
          <p className="text-brand-muted text-xs">
            Expected equipment returns per week
          </p>
        </div>
        <div className="text-right">
          <p className="text-brand-muted text-xs">Total Returns</p>
          <p className="text-brand-text font-bold text-lg leading-none">
            {totalReturns.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div id="returns-chart" className="flex-1 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={returnData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={v => typeof v === 'string' ? v.slice(0, 7) : (v || '')}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748B" 
              fontSize={12}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748B" 
              fontSize={12}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              labelFormatter={(label) => `Week: ${label}`}
              formatter={(value: number, name: string) => {
                if (name === 'expected_returns') return [value.toLocaleString(), 'Weekly Returns']
                if (name === 'cumulative') return [value.toLocaleString(), 'Cumulative Returns']
                return [value.toLocaleString(), name]
              }}
            />
            
            <Bar 
              yAxisId="left"
              dataKey="expected_returns" 
              fill="#205295" 
              radius={[4, 4, 0, 0]}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="cumulative" 
              stroke="#E67E22" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#E67E22', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats footer */}
      <div className="mt-4 pt-3 border-t border-brand-border grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-brand-muted text-xs">Peak Return Week</p>
          <p className="text-brand-text font-semibold text-sm">{peakWeek.week?.slice(0, 10)}</p>
          <p className="text-brand-orange text-xs">{peakWeek.expected_returns.toLocaleString()} units</p>
        </div>
        <div className="text-center">
          <p className="text-brand-muted text-xs">Cumulative Total</p>
          <p className="text-brand-text font-semibold text-sm">
            {returnData[returnData.length - 1]?.cumulative.toLocaleString() ?? '—'}
          </p>
          <p className="text-brand-muted text-xs">by end of period</p>
        </div>
      </div>
    </section>
  )
}
