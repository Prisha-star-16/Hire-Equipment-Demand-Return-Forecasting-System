'use client'

import React, { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, TooltipProps
} from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'

interface MarketBreakdownChartProps {
  marketData: Array<{
    market: string
    market_code?: string
    total_qty: number
    pct: number
  }>
  categoryData: Array<{
    category: string
    total_qty: number
    pct_of_total: number
  }>
}

const CHART_COLORS = [
  '#1E5F8C', '#2E86AB', '#F5A623', '#6AB187',
  '#EB5757', '#A8A8A8', '#9B59B6', '#3498DB'
]

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="glass-card p-3 text-xs min-w-[160px]">
      <p className="text-brand-text font-semibold mb-1">{d.name}</p>
      <p className="text-brand-muted">
        Volume: <span className="text-brand-text">{Number(d.value).toLocaleString()}</span>
      </p>
      {d.payload?.pct != null && (
        <p className="text-brand-muted">
          Share: <span className="text-brand-orange">{d.payload.pct}%</span>
        </p>
      )}
    </div>
  )
}

type TabType = 'market' | 'category'

export default function MarketBreakdownChart({ marketData, categoryData }: MarketBreakdownChartProps) {
  const [activeTab, setActiveTab] = useState<TabType>('market')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const isMarket = activeTab === 'market'
  const pieData = isMarket
    ? marketData.map(d => ({ name: d.market.slice(0, 30), value: d.total_qty, pct: d.pct }))
    : categoryData.map(d => ({ name: d.category, value: d.total_qty, pct: d.pct_of_total }))

  const barData = isMarket
    ? marketData.slice(0, 6).map(d => ({ name: d.market.slice(0, 20), value: d.total_qty }))
    : categoryData.slice(0, 8).map(d => ({ name: d.category.slice(0, 22), value: d.total_qty }))

  return (
    <section id="markets" className="glass-card p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieIcon size={16} className="text-brand-steel-light" />
            <h2 className="text-brand-text font-semibold text-base">Volume Breakdown</h2>
          </div>
          <p className="text-brand-muted text-xs">Hire quantity distribution</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 glass-card p-1">
          {(['market', 'category'] as TabType[]).map(tab => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Charts row: Donut + Bar */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Donut Chart */}
        <div id="donut-chart" className="h-52 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div id="breakdown-bar-chart" className="h-52 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#0F172A', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString(), 'Units']}
                contentStyle={{ background: '#1C2330', border: '1px solid #30363D', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#E6EDF3' }}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={14}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-brand-border">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {pieData.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center gap-1 text-xs">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-brand-muted truncate max-w-[120px]">
                {item.name} ({item.pct}%)
              </span>
            </div>
          ))}
          {pieData.length > 5 && (
            <span className="text-brand-muted text-xs">+{pieData.length - 5} more</span>
          )}
        </div>
      </div>
    </section>
  )
}
