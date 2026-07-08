'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import KPISummaryCards from '@/components/KPISummaryCards'
import DemandForecastChart from '@/components/DemandForecastChart'
import ReturnForecastChart from '@/components/ReturnForecastChart'
import MarketBreakdownChart from '@/components/MarketBreakdownChart'
import FilterPanel from '@/components/FilterPanel'
import EDAInsights from '@/components/EDAInsights'

// ============================================================
// Type Definitions
// ============================================================
export interface ForecastData {
  generated_at: string
  model_used: string
  total_records: number
  forecast_reference_date: string
  model_metrics: Record<string, Record<string, number>>
  kpi_summary: {
    total_orders: number
    unique_equipment_types: number
    avg_hire_duration_days: number
    total_qty_forecast_30d: number
    total_qty_forecast_60d: number
    total_qty_forecast_90d: number
    most_demanded_category: string
  }
  equipment_categories: string[]
  weekly_demand_forecast: {
    all_categories: Array<{
      week: string
      actual: number | null
      forecast: number
      lower: number
      upper: number
    }>
    [key: string]: Array<{
      week: string
      forecast: number
      lower: number
      upper: number
      actual?: number | null
    }>
  }
  weekly_return_forecast: {
    all_categories: Array<{
      week: string
      expected_returns: number
      cumulative: number
    }>
    [key: string]: Array<{
      week: string
      expected_returns: number
      cumulative: number
    }>
  }
  market_breakdown: Array<{
    market: string
    market_code: string
    total_qty: number
    pct: number
  }>
  category_volume: Array<{
    category: string
    total_qty: number
    pct_of_total: number
  }>
  monthly_demand_history: Array<{
    month: string
    total_qty: number
  }>
  eda_insights: Array<{
    id: string
    title: string
    value: string
    description: string
    icon: string
    color: string
  }>
}

// ============================================================
// Main Dashboard Page
// ============================================================
export default function DashboardPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all_categories')
  const [selectedHorizon, setSelectedHorizon] = useState<30 | 60 | 90>(30)
  const [showML, setShowML] = useState(false)

  // --------------------------------------------------------
  // Data Fetching
  // Security: Raw CSV never reaches the client.
  // We only fetch the pre-computed, aggregated JSON file.
  // --------------------------------------------------------
  useEffect(() => {
    fetch('/data/forecast_results.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: ForecastData) => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // --------------------------------------------------------
  // Loading State
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-brand-border" />
            <div className="absolute inset-0 rounded-full border-t-2 border-brand-orange animate-spin" />
          </div>
          <p className="text-brand-muted text-sm font-medium tracking-widest uppercase">
            Loading Forecast Data...
          </p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------
  // Error State
  // --------------------------------------------------------
  if (error || !data) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-md mx-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Failed to Load Data</h2>
          <p className="text-brand-muted text-sm">
            {error || 'Could not fetch forecast_results.json. Make sure the file exists in /public/data/.'}
          </p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------
  // Compute filtered forecast data based on selected horizon
  // --------------------------------------------------------
  const horizonWeeks = selectedHorizon === 30 ? 4 : selectedHorizon === 60 ? 8 : 14
  const categoryKey = selectedCategory === 'all_categories' ? 'all_categories' : selectedCategory
  const forecastSeries = (data.weekly_demand_forecast[categoryKey] || data.weekly_demand_forecast['all_categories'])
    .slice(0, horizonWeeks)

  return (
    <div className="min-h-screen bg-brand-surface bg-grid-pattern">
      {/* ---- Navigation ---- */}
      <Navbar generatedAt={data.generated_at} model={data.model_used} />

      {/* ---- Hero Header ---- */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="animate-slide-up">
              <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-1">
                SGB Group / Brand Safway — UAE Market
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold text-brand-navy leading-tight">
                Equipment Inventory <span className="gradient-text">Planner</span>
              </h1>
              <p className="text-brand-muted mt-2 text-sm max-w-xl">
                Expected equipment needs and returns for the coming weeks.
                Based on {data.total_records.toLocaleString()} historical hire records.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 animate-slide-up items-center" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 glass-card px-4 py-2">
                <input 
                  type="checkbox" 
                  id="ml-toggle" 
                  checked={showML} 
                  onChange={(e) => setShowML(e.target.checked)}
                  className="w-4 h-4 text-brand-orange bg-gray-100 border-gray-300 rounded focus:ring-brand-orange"
                />
                <label htmlFor="ml-toggle" className="text-brand-text text-sm font-medium cursor-pointer">
                  Advanced Data Science View
                </label>
              </div>
              <div className="glass-card px-4 py-2 text-center">
                <p className="text-brand-muted text-xs">Data Updated</p>
                <p className="text-brand-text font-semibold text-sm">{data.generated_at}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Main Content ---- */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* KPI Cards Row */}
        <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <KPISummaryCards kpi={data.kpi_summary} metrics={data.model_metrics} showML={showML} />
        </div>

        {/* Filter Panel */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <FilterPanel
            categories={data.equipment_categories || []}
            selectedCategory={selectedCategory}
            selectedHorizon={selectedHorizon}
            onCategoryChange={setSelectedCategory}
            onHorizonChange={setSelectedHorizon}
          />
        </div>

        {/* Main Chart — Demand Forecast */}
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <DemandForecastChart
            forecastData={forecastSeries}
            historyData={data.monthly_demand_history}
            selectedCategory={selectedCategory}
            selectedHorizon={selectedHorizon}
            showML={showML}
          />
        </div>

        {/* Two-column: Return Forecast + Market Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <ReturnForecastChart
            returnData={(data.weekly_return_forecast[categoryKey] || data.weekly_return_forecast['all_categories']).slice(0, horizonWeeks)}
            selectedHorizon={selectedHorizon}
          />
          <MarketBreakdownChart
            marketData={data.market_breakdown}
            categoryData={data.category_volume}
          />
        </div>

        {/* EDA Insights */}
        <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
          <EDAInsights
            insights={data.eda_insights}
            metrics={data.model_metrics}
            showML={showML}
          />
        </div>

        {/* Security Disclosure Footer */}
        <div className="glass-card p-4 flex items-start gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="text-brand-green text-lg flex-shrink-0 mt-0.5">🔒</div>
          <div>
            <p className="text-brand-text text-sm font-semibold mb-0.5">Data Security</p>
            <p className="text-brand-muted text-xs leading-relaxed">
              Raw hire invoice data (BrandDummy_Data.csv) is processed locally by the Python notebook and 
              never deployed to this server. This dashboard only serves pre-computed, aggregated forecast 
              numbers — no individual transaction records, project references, or customer data are exposed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-muted text-xs">
            © 2026 Hire Equipment Forecasting Capstone — Educational Portfolio Project
          </p>
          <div className="flex items-center gap-4 text-xs text-brand-muted">
            <span>Stack: Next.js 14 + XGBoost + Prophet</span>
            <span className="text-brand-border">|</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
               className="hover:text-brand-orange transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
