'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  HardHat, 
  BarChart2, 
  DollarSign, 
  MinusCircle, 
  Briefcase, 
  Lightbulb, 
  Cpu, 
  RefreshCw,
  Layers,
  MapPin
} from 'lucide-react';

// --- TS TYPE CONTRACT MATCHING PYTHON PIPELINE (forecast_results.json) ---
interface KPISummary {
  total_orders: number;
  total_qty_forecast_30d: number;
  total_qty_forecast_60d: number;
  total_qty_forecast_90d: number;
  total_returns_forecast_30d: number;
  total_returns_forecast_60d: number;
  total_returns_forecast_90d: number;
}

interface DemandPoint {
  week: string;
  forecast: number;
  lower: number;
  upper: number;
}

interface ReturnPoint {
  week: string;
  expected_returns: number;
  cumulative: number;
}

interface MarketBreakdownItem {
  market: string;
  total_qty: number;
  pct: number;
}

interface CategoryVolumeItem {
  category: string;
  total_qty: number;
  pct_of_total: number;
}

interface HistoryPoint {
  BOOKED_DATE?: string;
  QUANTITY?: number;
  [key: string]: any;
}

interface AttritionItem {
  name: string;
  sale: number;
  oea: number;
}

interface OrderTypes {
  summary: { hire: number; sale: number; oea: number };
  attritionBreakdown: AttritionItem[];
}

interface LivePipelineData {
  kpi_summary: KPISummary;
  weekly_demand_forecast: Record<string, DemandPoint[]>;
  weekly_return_forecast: Record<string, ReturnPoint[]>;
  market_breakdown: MarketBreakdownItem[];
  category_volume: CategoryVolumeItem[];
  monthly_demand_history: HistoryPoint[];
  orderTypes?: OrderTypes;
}

// --- STANDARD HIGH-FIDELITY FALLBACK DATA ---
const fallbackData: LivePipelineData = {
  kpi_summary: {
    total_orders: 12450,
    total_qty_forecast_30d: 165600,
    total_qty_forecast_60d: 312000,
    total_qty_forecast_90d: 450000,
    total_returns_forecast_30d: 136100,
    total_returns_forecast_60d: 295000,
    total_returns_forecast_90d: 480000
  },
  weekly_demand_forecast: {
    all_categories: [
      { week: 'Wk 1', forecast: 38500, lower: 33400, upper: 43600 },
      { week: 'Wk 2', forecast: 42100, lower: 36600, upper: 47600 },
      { week: 'Wk 3', forecast: 45800, lower: 39800, upper: 51800 },
      { week: 'Wk 4', forecast: 39200, lower: 34100, upper: 44300 },
      { week: 'Wk 5', forecast: 37500, lower: 32600, upper: 42400 },
      { week: 'Wk 6', forecast: 36000, lower: 31300, upper: 40700 },
      { week: 'Wk 7', forecast: 35800, lower: 31100, upper: 40500 },
      { week: 'Wk 8', forecast: 37100, lower: 32200, upper: 42000 },
      { week: 'Wk 9', forecast: 34000, lower: 29500, upper: 38500 },
      { week: 'Wk 10', forecast: 32500, lower: 28200, upper: 36800 },
      { week: 'Wk 11', forecast: 31000, lower: 26900, upper: 35100 },
      { week: 'Wk 12', forecast: 30500, lower: 26500, upper: 34500 },
    ],
    'Formwork Panels': [
      { week: 'Wk 1', forecast: 11200, lower: 9800, upper: 12600 },
      { week: 'Wk 2', forecast: 12500, lower: 11000, upper: 14000 },
      { week: 'Wk 3', forecast: 13100, lower: 11500, upper: 14700 },
      { week: 'Wk 4', forecast: 11400, lower: 10000, upper: 12800 },
      { week: 'Wk 5', forecast: 10500, lower: 9200, upper: 11800 },
      { week: 'Wk 6', forecast: 9800, lower: 8600, upper: 11000 },
      { week: 'Wk 7', forecast: 9600, lower: 8400, upper: 10800 },
      { week: 'Wk 8', forecast: 10200, lower: 8950, upper: 11450 },
      { week: 'Wk 9', forecast: 9200, lower: 8000, upper: 10400 },
      { week: 'Wk 10', forecast: 8900, lower: 7800, upper: 10000 },
      { week: 'Wk 11', forecast: 8500, lower: 7400, upper: 9600 },
      { week: 'Wk 12', forecast: 8100, lower: 7100, upper: 9100 },
    ],
    'Accessories & Connectors': [
      { week: 'Wk 1', forecast: 19100, lower: 16500, upper: 21700 },
      { week: 'Wk 2', forecast: 20800, lower: 18000, upper: 23600 },
      { week: 'Wk 3', forecast: 22500, lower: 19500, upper: 25500 },
      { week: 'Wk 4', forecast: 19300, lower: 16700, upper: 21900 },
      { week: 'Wk 5', forecast: 18600, lower: 16100, upper: 21100 },
      { week: 'Wk 6', forecast: 17900, lower: 15500, upper: 20300 },
      { week: 'Wk 7', forecast: 17800, lower: 15400, upper: 20200 },
      { week: 'Wk 8', forecast: 18500, lower: 16000, upper: 21000 },
      { week: 'Wk 9', forecast: 16900, lower: 14600, upper: 19200 },
      { week: 'Wk 10', forecast: 16100, lower: 13900, upper: 18300 },
      { week: 'Wk 11', forecast: 15400, lower: 13300, upper: 17500 },
      { week: 'Wk 12', forecast: 15100, lower: 13100, upper: 17100 },
    ],
    'Safety & Railings': [
      { week: 'Wk 1', forecast: 4300, lower: 3700, upper: 4900 },
      { week: 'Wk 2', forecast: 4700, lower: 4000, upper: 5400 },
      { week: 'Wk 3', forecast: 5100, lower: 4400, upper: 5800 },
      { week: 'Wk 4', forecast: 4400, lower: 3800, upper: 5000 },
      { week: 'Wk 5', forecast: 4200, lower: 3600, upper: 4800 },
      { week: 'Wk 6', forecast: 4000, lower: 3400, upper: 4600 },
      { week: 'Wk 7', forecast: 4000, lower: 3400, upper: 4600 },
      { week: 'Wk 8', forecast: 4100, lower: 3500, upper: 4700 },
      { week: 'Wk 9', forecast: 3800, lower: 3200, upper: 4400 },
      { week: 'Wk 10', forecast: 3600, lower: 3100, upper: 4100 },
      { week: 'Wk 11', forecast: 3400, lower: 2900, upper: 3900 },
      { week: 'Wk 12', forecast: 3400, lower: 2900, upper: 3900 },
    ],
    'Walers & Beams': [
      { week: 'Wk 1', forecast: 2000, lower: 1700, upper: 2300 },
      { week: 'Wk 2', forecast: 2100, lower: 1800, upper: 2400 },
      { week: 'Wk 3', forecast: 2300, lower: 2000, upper: 2600 },
      { week: 'Wk 4', forecast: 2100, lower: 1800, upper: 2400 },
      { week: 'Wk 5', forecast: 2000, lower: 1700, upper: 2300 },
      { week: 'Wk 6', forecast: 1900, lower: 1600, upper: 2200 },
      { week: 'Wk 7', forecast: 1900, lower: 1600, upper: 2200 },
      { week: 'Wk 8', forecast: 1900, lower: 1600, upper: 2200 },
      { week: 'Wk 9', forecast: 1800, lower: 1500, upper: 2100 },
      { week: 'Wk 10', forecast: 1700, lower: 1400, upper: 2000 },
      { week: 'Wk 11', forecast: 1600, lower: 1300, upper: 1900 },
      { week: 'Wk 12', forecast: 1600, lower: 1300, upper: 1900 },
    ],
    'Alignment & Struts': [
      { week: 'Wk 1', forecast: 1400, lower: 1200, upper: 1600 },
      { week: 'Wk 2', forecast: 1500, lower: 1300, upper: 1700 },
      { week: 'Wk 3', forecast: 1600, lower: 1400, upper: 1800 },
      { week: 'Wk 4', forecast: 1400, lower: 1200, upper: 1600 },
      { week: 'Wk 5', forecast: 1300, lower: 1100, upper: 1500 },
      { week: 'Wk 6', forecast: 1300, lower: 1100, upper: 1500 },
      { week: 'Wk 7', forecast: 1300, lower: 1100, upper: 1500 },
      { week: 'Wk 8', forecast: 1300, lower: 1100, upper: 1500 },
      { week: 'Wk 9', forecast: 1200, lower: 1000, upper: 1400 },
      { week: 'Wk 10', forecast: 1100, lower: 900, upper: 1300 },
      { week: 'Wk 11', forecast: 1100, lower: 900, upper: 1300 },
      { week: 'Wk 12', forecast: 1100, lower: 900, upper: 1300 },
    ],
    'Transport & Storage': [
      { week: 'Wk 1', forecast: 700, lower: 600, upper: 800 },
      { week: 'Wk 2', forecast: 750, lower: 650, upper: 850 },
      { week: 'Wk 3', forecast: 800, lower: 700, upper: 900 },
      { week: 'Wk 4', forecast: 750, lower: 650, upper: 850 },
      { week: 'Wk 5', forecast: 700, lower: 600, upper: 800 },
      { week: 'Wk 6', forecast: 700, lower: 600, upper: 800 },
      { week: 'Wk 7', forecast: 700, lower: 600, upper: 800 },
      { week: 'Wk 8', forecast: 700, lower: 600, upper: 800 },
      { week: 'Wk 9', forecast: 650, lower: 550, upper: 750 },
      { week: 'Wk 10', forecast: 650, lower: 550, upper: 750 },
      { week: 'Wk 11', forecast: 600, lower: 500, upper: 700 },
      { week: 'Wk 12', forecast: 600, lower: 500, upper: 700 },
    ],
    'Scaffolding Components': [
      { week: 'Wk 1', forecast: 400, lower: 300, upper: 500 },
      { week: 'Wk 2', forecast: 450, lower: 350, upper: 550 },
      { week: 'Wk 3', forecast: 400, lower: 300, upper: 500 },
      { week: 'Wk 4', forecast: 350, lower: 250, upper: 450 },
      { week: 'Wk 5', forecast: 300, lower: 200, upper: 400 },
      { week: 'Wk 6', forecast: 300, lower: 200, upper: 400 },
      { week: 'Wk 7', forecast: 300, lower: 200, upper: 400 },
      { week: 'Wk 8', forecast: 300, lower: 200, upper: 400 },
      { week: 'Wk 9', forecast: 250, lower: 150, upper: 350 },
      { week: 'Wk 10', forecast: 250, lower: 150, upper: 350 },
      { week: 'Wk 11', forecast: 200, lower: 100, upper: 300 },
      { week: 'Wk 12', forecast: 200, lower: 100, upper: 300 },
    ]
  },
  weekly_return_forecast: {
    all_categories: [
      { week: 'Wk 1', expected_returns: 32100, cumulative: 32100 },
      { week: 'Wk 2', expected_returns: 34500, cumulative: 66600 },
      { week: 'Wk 3', expected_returns: 33000, cumulative: 99600 },
      { week: 'Wk 4', expected_returns: 36500, cumulative: 136100 },
      { week: 'Wk 5', expected_returns: 38000, cumulative: 174100 },
      { week: 'Wk 6', expected_returns: 39200, cumulative: 213300 },
      { week: 'Wk 7', expected_returns: 40500, cumulative: 253800 },
      { week: 'Wk 8', expected_returns: 41200, cumulative: 295000 },
      { week: 'Wk 9', expected_returns: 45000, cumulative: 340000 },
      { week: 'Wk 10', expected_returns: 46800, cumulative: 386800 },
      { week: 'Wk 11', expected_returns: 47200, cumulative: 434000 },
      { week: 'Wk 12', expected_returns: 46000, cumulative: 480000 },
    ],
    'Formwork Panels': [
      { week: 'Wk 1', expected_returns: 7200, cumulative: 7200 },
      { week: 'Wk 2', expected_returns: 7800, cumulative: 15000 },
      { week: 'Wk 3', expected_returns: 8100, cumulative: 23100 },
      { week: 'Wk 4', expected_returns: 9000, cumulative: 32100 },
      { week: 'Wk 5', expected_returns: 9500, cumulative: 41600 },
      { week: 'Wk 6', expected_returns: 10200, cumulative: 51800 },
      { week: 'Wk 7', expected_returns: 11100, cumulative: 62900 },
      { week: 'Wk 8', expected_returns: 11600, cumulative: 74500 },
      { week: 'Wk 9', expected_returns: 12500, cumulative: 87000 },
      { week: 'Wk 10', expected_returns: 12900, cumulative: 99900 },
      { week: 'Wk 11', expected_returns: 13200, cumulative: 113100 },
      { week: 'Wk 12', expected_returns: 13000, cumulative: 126100 },
    ],
    'Accessories & Connectors': [
      { week: 'Wk 1', expected_returns: 17500, cumulative: 17500 },
      { week: 'Wk 2', expected_returns: 18900, cumulative: 36400 },
      { week: 'Wk 3', expected_returns: 18200, cumulative: 54600 },
      { week: 'Wk 4', expected_returns: 23400, cumulative: 78000 },
      { week: 'Wk 5', expected_returns: 24200, cumulative: 102200 },
      { week: 'Wk 6', expected_returns: 24800, cumulative: 127000 },
      { week: 'Wk 7', expected_returns: 25100, cumulative: 152100 },
      { week: 'Wk 8', expected_returns: 25900, cumulative: 178000 },
      { week: 'Wk 9', expected_returns: 27800, cumulative: 205800 },
      { week: 'Wk 10', expected_returns: 29100, cumulative: 234900 },
      { week: 'Wk 11', expected_returns: 29500, cumulative: 264400 },
      { week: 'Wk 12', expected_returns: 28600, cumulative: 293000 },
    ],
    'Safety & Railings': [
      { week: 'Wk 1', expected_returns: 1000, cumulative: 1000 },
      { week: 'Wk 2', expected_returns: 1100, cumulative: 2100 },
      { week: 'Wk 3', expected_returns: 1200, cumulative: 3300 },
      { week: 'Wk 4', expected_returns: 1500, cumulative: 4800 },
      { week: 'Wk 5', expected_returns: 1800, cumulative: 6600 },
      { week: 'Wk 6', expected_returns: 1900, cumulative: 8500 },
      { week: 'Wk 7', expected_returns: 2000, cumulative: 10500 },
      { week: 'Wk 8', expected_returns: 2100, cumulative: 12600 },
      { week: 'Wk 9', expected_returns: 2300, cumulative: 14900 },
      { week: 'Wk 10', expected_returns: 2400, cumulative: 17300 },
      { week: 'Wk 11', expected_returns: 2500, cumulative: 19800 },
      { week: 'Wk 12', expected_returns: 2500, cumulative: 22300 },
    ],
    'Walers & Beams': [
      { week: 'Wk 1', expected_returns: 300, cumulative: 300 },
      { week: 'Wk 2', expected_returns: 350, cumulative: 650 },
      { week: 'Wk 3', expected_returns: 380, cumulative: 1030 },
      { week: 'Wk 4', expected_returns: 470, cumulative: 1500 },
      { week: 'Wk 5', expected_returns: 500, cumulative: 2000 },
      { week: 'Wk 6', expected_returns: 550, cumulative: 2550 },
      { week: 'Wk 7', expected_returns: 580, cumulative: 3130 },
      { week: 'Wk 8', expected_returns: 620, cumulative: 3750 },
      { week: 'Wk 9', expected_returns: 700, cumulative: 4450 },
      { week: 'Wk 10', expected_returns: 750, cumulative: 5200 },
      { week: 'Wk 11', expected_returns: 780, cumulative: 5980 },
      { week: 'Wk 12', expected_returns: 820, cumulative: 6800 },
    ],
    'Alignment & Struts': [
      { week: 'Wk 1', expected_returns: 350, cumulative: 350 },
      { week: 'Wk 2', expected_returns: 380, cumulative: 730 },
      { week: 'Wk 3', expected_returns: 390, cumulative: 1120 },
      { week: 'Wk 4', expected_returns: 380, cumulative: 1500 },
      { week: 'Wk 5', expected_returns: 400, cumulative: 1900 },
      { week: 'Wk 6', expected_returns: 420, cumulative: 2320 },
      { week: 'Wk 7', expected_returns: 430, cumulative: 2750 },
      { week: 'Wk 8', expected_returns: 450, cumulative: 3200 },
      { week: 'Wk 9', expected_returns: 480, cumulative: 3680 },
      { week: 'Wk 10', expected_returns: 500, cumulative: 4180 },
      { week: 'Wk 11', expected_returns: 510, cumulative: 4690 },
      { week: 'Wk 12', expected_returns: 520, cumulative: 5210 },
    ],
    'Transport & Storage': [
      { week: 'Wk 1', expected_returns: 200, cumulative: 200 },
      { week: 'Wk 2', expected_returns: 210, cumulative: 410 },
      { week: 'Wk 3', expected_returns: 230, cumulative: 640 },
      { week: 'Wk 4', expected_returns: 260, cumulative: 900 },
      { week: 'Wk 5', expected_returns: 280, cumulative: 1180 },
      { week: 'Wk 6', expected_returns: 310, cumulative: 1490 },
      { week: 'Wk 7', expected_returns: 330, cumulative: 1820 },
      { week: 'Wk 8', expected_returns: 360, cumulative: 2180 },
      { week: 'Wk 9', expected_returns: 400, cumulative: 2580 },
      { week: 'Wk 10', expected_returns: 440, cumulative: 3020 },
      { week: 'Wk 11', expected_returns: 460, cumulative: 3480 },
      { week: 'Wk 12', expected_returns: 480, cumulative: 3960 },
    ],
    'Scaffolding Components': [
      { week: 'Wk 1', expected_returns: 300, cumulative: 300 },
      { week: 'Wk 2', expected_returns: 310, cumulative: 610 },
      { week: 'Wk 3', expected_returns: 330, cumulative: 940 },
      { week: 'Wk 4', expected_returns: 360, cumulative: 1300 },
      { week: 'Wk 5', expected_returns: 380, cumulative: 1680 },
      { week: 'Wk 6', expected_returns: 410, cumulative: 2090 },
      { week: 'Wk 7', expected_returns: 430, cumulative: 2520 },
      { week: 'Wk 8', expected_returns: 460, cumulative: 2980 },
      { week: 'Wk 9', expected_returns: 500, cumulative: 3480 },
      { week: 'Wk 10', expected_returns: 540, cumulative: 4020 },
      { week: 'Wk 11', expected_returns: 560, cumulative: 4580 },
      { week: 'Wk 12', expected_returns: 580, cumulative: 5160 },
    ]
  },
  market_breakdown: [
    { market: 'Residential (Multi-Family)', total_qty: 185000, pct: 41.1 },
    { market: 'Commercial Construction', total_qty: 145000, pct: 32.2 },
    { market: 'Industrial & Infrastructure', total_qty: 120000, pct: 26.7 }
  ],
  category_volume: [
    { category: 'Accessories & Connectors', total_qty: 82500, pct_of_total: 49.8 },
    { category: 'Formwork Panels', total_qty: 45200, pct_of_total: 27.3 },
    { category: 'Safety & Railings', total_qty: 18500, pct_of_total: 11.2 },
    { category: 'Walers & Beams', total_qty: 8500, pct_of_total: 5.1 },
    { category: 'Alignment & Struts', total_qty: 6200, pct_of_total: 3.7 },
    { category: 'Transport & Storage', total_qty: 3100, pct_of_total: 1.9 },
    { category: 'Scaffolding Components', total_qty: 1600, pct_of_total: 1.0 }
  ],
  monthly_demand_history: [],
  orderTypes: {
    summary: { hire: 1450200, sale: 45300, oea: 12400 },
    attritionBreakdown: [
      { name: 'Accessories & Connectors (Clamps, Tie Nuts)', sale: 25000, oea: 8000 },
      { name: 'Formwork Panels (MANTO/RASTO)', sale: 12000, oea: 2100 },
      { name: 'Scaffolding Components', sale: 5000, oea: 1200 },
      { name: 'Walers & Beams', sale: 1500, oea: 500 },
      { name: 'Safety & Railings', sale: 1200, oea: 400 },
      { name: 'Alignment & Struts', sale: 400, oea: 150 },
      { name: 'Transport & Storage', sale: 200, oea: 50 },
    ]
  }
};

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30' | '60' | '90'>('30');
  const [selectedCategory, setSelectedCategory] = useState<string>('all_categories');
  const [data, setData] = useState<LivePipelineData>(fallbackData);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load live JSON from public assets folder matching Python outputs
  useEffect(() => {
    fetch('/data/forecast_results.json')
      .then((res) => {
        if (!res.ok) throw new Error('Live JSON endpoint not found');
        return res.json();
      })
      .then((payload: LivePipelineData) => {
        if (payload && payload.kpi_summary) {
          setData(payload);
          setIsLive(true);
        }
      })
      .catch((err) => {
        console.warn('Next.js is using built-in high-fidelity analytics fallback payload.', err);
        setData(fallbackData);
        setIsLive(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#002f6c] font-sans">
        <RefreshCw className="w-10 h-10 animate-spin text-[#ff5a00] mb-4" />
        <p className="text-lg font-bold tracking-tight">Syncing SGB Machine Learning Pipeline...</p>
        <p className="text-xs text-slate-400 mt-1">Reading forecast_results.json</p>
      </div>
    );
  }

  // Determine timeframe length in weeks: 30 days = 4 weeks, 60 days = 8 weeks, 90 days = 12 weeks
  const weekLimit = selectedTimeframe === '30' ? 4 : selectedTimeframe === '60' ? 8 : 12;

  // Safe fetch of weekly series with robust fallbacks to make sure the app never crashes
  const weeklyDemandForecast = data?.weekly_demand_forecast || fallbackData.weekly_demand_forecast;
  const weeklyReturnForecast = data?.weekly_return_forecast || fallbackData.weekly_return_forecast;

  const rawDemandPoints = weeklyDemandForecast[selectedCategory] || weeklyDemandForecast['all_categories'] || [];
  const rawReturnPoints = weeklyReturnForecast[selectedCategory] || weeklyReturnForecast['all_categories'] || [];

  const demandPoints = rawDemandPoints.slice(0, weekLimit);
  const returnPoints = rawReturnPoints.slice(0, weekLimit);

  // Safe calculated KPI metrics
  const summaryKPI = data?.kpi_summary || fallbackData.kpi_summary;

  const totalDemand = selectedTimeframe === '30' 
    ? summaryKPI.total_qty_forecast_30d 
    : selectedTimeframe === '60' 
      ? summaryKPI.total_qty_forecast_60d 
      : summaryKPI.total_qty_forecast_90d;

  const totalReturns = selectedTimeframe === '30' 
    ? summaryKPI.total_returns_forecast_30d 
    : selectedTimeframe === '60' 
      ? summaryKPI.total_returns_forecast_60d 
      : summaryKPI.total_returns_forecast_90d;

  const netBalance = totalReturns - totalDemand;
  const isDeficit = netBalance < 0;

  // Calculate highest chart scale dynamically to avoid overflow cutoffs
  const maxChartValue = Math.max(
    ...demandPoints.map(p => p.forecast || 0),
    ...returnPoints.map(p => p.expected_returns || 0),
    100
  ) * 1.15;

  // Safe extraction of Order Types and Attrition values
  const orderTypesData = data?.orderTypes || fallbackData.orderTypes || {
    summary: { hire: 1450200, sale: 45300, oea: 12400 },
    attritionBreakdown: []
  };

  const maxAttritionValue = Math.max(
    ...orderTypesData.attritionBreakdown.map(d => (d.sale || 0) + (d.oea || 0)),
    1
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-16">
      
      {/* BRANDSAFWAY REGIONAL BANNER */}
      <div className="bg-[#001f48] text-blue-100 px-4 py-2 text-xs font-bold flex justify-between items-center border-b border-blue-900/40">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ff5a00] animate-pulse"></span>
          <span>SGB BrandSafway Regional Network Planning Node</span>
        </div>
        <div className="flex items-center space-x-3">
          {isLive ? (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase font-bold">
              Live Pipeline Sync Connected
            </span>
          ) : (
            <span className="bg-orange-500/20 text-[#ff5a00] border border-[#ff5a00]/30 px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase font-bold">
              Pre-compiled Portfolio Data View
            </span>
          )}
        </div>
      </div>

      {/* SGB CORPORATE NAVY HEADER */}
      <header className="bg-[#002f6c] text-white shadow-md sticky top-0 z-30 border-b border-[#001f48]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#ff5a00] p-2.5 rounded-lg shadow-md transition-transform hover:scale-105 duration-200">
              <HardHat className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight flex items-center">
                SGB BY BRANDSAFWAY
              </h1>
              <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">
                Frontline Hire Equipment Forecast Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* TIMEFRAME OUTLOOK BUTTONS */}
            <div className="bg-[#001f48] rounded-xl p-1 flex shadow-inner border border-blue-900/40">
              {(['30', '60', '90'] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedTimeframe(days)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                    selectedTimeframe === days 
                      ? 'bg-[#ff5a00] text-white shadow-md' 
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {days} Days Out
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* UPPER KPI CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* USER WELCOME CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[#002f6c] font-bold text-sm">
                <Info className="w-5 h-5 text-[#ff5a00]" />
                <h3>Frontline Quick Guide</h3>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                This ML dashboard shows how much scaffolding and formwork you need to keep on hand. It predicts customer demand (Going Out) against expected jobs finishing (Coming Back).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#002f6c]">
              <span>Need help? Contact Logistics</span>
              <ArrowRight className="w-4 h-4 text-[#ff5a00]" />
            </div>
          </div>

          {/* TOTAL DEMAND CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#002f6c]/5 text-[#002f6c] px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
              Customer Demand
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Outgoing</p>
            <h3 className="text-3xl font-black text-[#002f6c] mt-2">
              {totalDemand.toLocaleString()} <span className="text-sm font-semibold text-slate-500">units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-[#002f6c] mr-1.5" />
              Predicted total volume needed for dispatch
            </p>
          </div>

          {/* TOTAL RETURNS CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
              Expected Returns
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Back</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-2">
              {totalReturns.toLocaleString()} <span className="text-sm font-semibold text-slate-500">units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
              <TrendingDown className="w-4 h-4 text-emerald-500 mr-1.5" />
              Returned inventory to be cleaned & re-hired
            </p>
          </div>

          {/* NET INVENTORY HEALTH BALANCE */}
          <div className={`bg-white rounded-xl shadow-sm border-l-4 p-6 flex flex-col justify-between ${
            isDeficit ? 'border-[#ff5a00]' : 'border-emerald-500'
          }`}>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Stock Deficit/Surplus</p>
              <h3 className={`text-3xl font-black mt-2 ${isDeficit ? 'text-[#ff5a00]' : 'text-emerald-600'}`}>
                {isDeficit ? '-' : '+'}{Math.abs(netBalance).toLocaleString()} <span className="text-sm font-semibold text-slate-500">units</span>
              </h3>
            </div>
            <p className="text-xs font-semibold mt-3 flex items-start">
              {isDeficit ? (
                <span className="flex text-[#ff5a00] leading-snug">
                  <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" /> 
                  Action Required: Shortage risk. Transfer or purchase panels now.
                </span>
              ) : (
                <span className="flex text-emerald-600 leading-snug">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" /> 
                  Healthy: Expected returns will cover next {selectedTimeframe} days of dispatches.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* HISTORICAL MACHINE LEARNING ANALYSIS OVERVIEW */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-2 text-[#002f6c] font-black text-base mb-4">
            <Cpu className="w-5 h-5 text-[#ff5a00]" />
            <h2>Historical Machine Learning (XGBoost) Operational Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-[#002f6c] text-sm block mb-1">Peak Q3 Seasonality</strong>
                Our machine learning models show demand peaks strongly from July through September. This coincides with high commercial building activity.
              </div>
              <span className="text-[#ff5a00] font-bold mt-3 block">Strategy: Build buffer stock by early June.</span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-[#002f6c] text-sm block mb-1">Extended Capital Lock-Up</strong>
                Scaffolding and formwork stay on site for an average of 150 to 330 days. Equipment dispatched today is frozen for almost a year.
              </div>
              <span className="text-indigo-600 font-bold mt-3 block">Strategy: Ensure quick turnaround on returned stock.</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-[#002f6c] text-sm block mb-1">Concrete Formwork Priority</strong>
                MANTO panels and accessories comprise more than 75% of outgoing volume weight. They drive our branch profitability.
              </div>
              <span className="text-emerald-600 font-bold mt-3 block">Strategy: Monitor panel wear and clamp counts weekly.</span>
            </div>
          </div>
        </div>

        {/* WEEKLY DEMAND & RETURN BAR CHART */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-[#002f6c] flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-[#ff5a00]" /> 
                Weekly Outflow vs. Return Volume ({selectedTimeframe} Days Outlook)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualizes planned outbound hires side-by-side with incoming site returns on a weekly basis.
              </p>
            </div>
            
            {/* CATEGORY FILTER */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Focus Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002f6c]"
              >
                <option value="all_categories">All Equipment Combined</option>
                <option value="Formwork Panels">Formwork Panels (MANTO/RASTO)</option>
                <option value="Accessories & Connectors">Accessories & Connectors</option>
                <option value="Safety & Railings">Safety & Railings</option>
                <option value="Scaffolding Components">Scaffolding Components</option>
                <option value="Walers & Beams">Walers & Beams</option>
                <option value="Alignment & Struts">Alignment & Struts</option>
                <option value="Transport & Storage">Transport & Storage</option>
              </select>
            </div>
          </div>

          {/* CUSTOM CHARTS */}
          <div className="h-72 flex items-end space-x-2 sm:space-x-4 border-b border-slate-200 pb-2 relative">
            {/* Grid Line Guides */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-10">
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
            </div>

            {demandPoints.map((dp, idx) => {
              const rp = returnPoints[idx] || { expected_returns: 0 };
              const demandHeight = ((dp.forecast || 0) / maxChartValue) * 100;
              const returnHeight = ((rp.expected_returns || 0) / maxChartValue) * 100;
              const shortfall = (dp.forecast || 0) > (rp.expected_returns || 0);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  
                  {/* HOVER TOOLTIP */}
                  <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl z-40 w-44 pointer-events-none transition-all">
                    <p className="font-bold border-b border-slate-700 pb-1.5 mb-2 text-[#ff5a00]">{dp.week}</p>
                    <p className="flex justify-between mb-1">
                      <span>Demand:</span> 
                      <span className="font-black text-blue-200">{(dp.forecast || 0).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between mb-2">
                      <span>Returns:</span> 
                      <span className="font-black text-emerald-400">{(rp.expected_returns || 0).toLocaleString()}</span>
                    </p>
                    {shortfall ? (
                      <p className="text-center font-bold bg-[#ff5a00]/20 text-[#ff5a00] py-1 rounded">
                        Deficit: -{Math.abs((dp.forecast || 0) - (rp.expected_returns || 0)).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-center font-bold bg-emerald-500/20 text-emerald-400 py-1 rounded">
                        Surplus: +{Math.abs((rp.expected_returns || 0) - (dp.forecast || 0)).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* DOUBLE BARS */}
                  <div className="flex w-full justify-center items-end space-x-1 h-full z-10">
                    <div 
                      className="w-full sm:w-12 bg-[#002f6c] hover:bg-[#001f48] rounded-t transition-all duration-300 cursor-pointer" 
                      style={{ height: `${demandHeight}%` }}
                    ></div>
                    <div 
                      className="w-full sm:w-12 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all duration-300 cursor-pointer" 
                      style={{ height: `${returnHeight}%` }}
                    ></div>
                  </div>

                  {/* WEEK LABELS */}
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-3 truncate w-full text-center">
                    {dp.week}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CHART METRICS FOOTER */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <div className="w-3.5 h-3.5 bg-[#002f6c] rounded mr-2"></div> 
                Customer Demand (Required Outflow)
              </span>
              <span className="flex items-center">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded mr-2"></div> 
                Expected Returns (Re-entering Fleet)
              </span>
            </div>
            <p className="text-slate-400 italic">
              *Projections include confidence lower/upper limits derived from historical lag and seasonality features.
            </p>
          </div>
        </div>

        {/* TWO-COLUMN LOWER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1 & 2: CATEGORY HIRE FORECAST & REGIONAL BREAKDOWN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* CATEGORY BREAKDOWN TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-black text-[#002f6c] mb-5 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-[#ff5a00]" />
                Volume Capacity & Stockout Risk by Product Group
              </h3>
              
              <div className="space-y-5">
                {(data?.category_volume || fallbackData.category_volume).map((item, idx) => {
                  const riskStyle = 
                    item.pct_of_total > 35 
                      ? { text: 'HIGH RISK', bg: 'bg-red-100 text-red-800 border-red-200' }
                      : item.pct_of_total > 10 
                        ? { text: 'MODERATE RISK', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
                        : { text: 'STABLE', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

                  return (
                    <div key={idx} className="pb-5 last:pb-0 border-b border-slate-100 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{item.category}</h4>
                          <span className={`inline-block text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded border mt-1 ${riskStyle.bg}`}>
                            {riskStyle.text}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-700">{(item.total_qty).toLocaleString()} Units</p>
                          <p className="text-xs text-slate-400 font-semibold">{item.pct_of_total}% of Total Outflow</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#002f6c] rounded-full transition-all duration-500" 
                          style={{ width: `${item.pct_of_total}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REGIONAL MARKET TYPE BREAKDOWN */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-black text-[#002f6c] mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#ff5a00]" />
                Demand by Regional Market Sector
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(data?.market_breakdown || fallbackData.market_breakdown).map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sector</p>
                      <h4 className="font-bold text-slate-800 text-xs mt-1 min-h-[32px]">{item.market}</h4>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-black text-[#002f6c]">{item.pct}%</p>
                      <p className="text-xs font-semibold text-slate-500">{(item.total_qty).toLocaleString()} active units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: REAL-TIME ALERTS & ACTION DECISION PANEL */}
          <div className="space-y-8">
            
            {/* DYNAMIC ALERT NOTIFICATIONS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-black text-[#002f6c] mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-[#ff5a00]" />
                Action Required (Active Site Signals)
              </h3>
              <div className="space-y-4">
                {[
                  { id: 1, type: 'critical' as const, message: 'Severe shortage of MANTO Formwork Panels and Connectors predicted for Weeks 1-4 due to Q3 peak seasonality.' },
                  { id: 2, type: 'warning' as const, message: 'Average hire duration is currently tracking at 150-330 days. Equipment dispatched now will be locked out of the fleet until next year.' },
                  { id: 3, type: 'info' as const, message: 'Returns are expected to finally outpace demand around Week 9 as current major projects finish their concrete phases.' }
                ].map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-xl border-l-4 ${
                      alert.type === 'critical' 
                        ? 'bg-red-50 border-red-500 text-red-900' 
                        : alert.type === 'warning' 
                          ? 'bg-amber-50 border-[#ff5a00] text-amber-900' 
                          : 'bg-blue-50 border-blue-500 text-blue-900'
                    }`}
                  >
                    <p className="text-[10px] font-black tracking-wider uppercase mb-1">
                      {alert.type === 'critical' ? 'CRITICAL DEFICIT ALERT' : alert.type === 'warning' ? 'PLANNING WARNING' : 'INFO'}
                    </p>
                    <p className="text-xs font-medium leading-relaxed mb-2">{alert.message}</p>
                    {alert.type === 'critical' && (
                      <button className="text-[10px] font-black tracking-wide uppercase px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg inline-flex items-center gap-1 transition-colors">
                        Initiate Branch Transfer
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PROCUREMENT SUMMARY CARD */}
            <div className="bg-[#002f6c] text-white rounded-xl shadow-md p-6 border border-[#001f48] relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <HardHat className="w-40 h-40 text-white" />
              </div>
              <h3 className="text-lg font-black flex items-center mb-2">
                <Lightbulb className="w-5 h-5 mr-2 text-[#ff5a00]" />
                Executive Logistics Summary
              </h3>
              <div className="space-y-4 text-xs text-blue-100 leading-relaxed mt-4">
                <p>
                  Our XGBoost models confirm we have a **critical shortage of Concrete Formwork Panels and accessories** starting in Week 2. 
                </p>
                <p>
                  Because scaffolding remains locked up on active customer projects for an average of 150+ days, we cannot count on scaffolding returns to satisfy incoming commercial orders in the next 30 days.
                </p>
                <div className="bg-[#001f48] p-3.5 rounded-lg border border-blue-900/60 mt-2">
                  <span className="font-bold text-white block mb-1">Logistics Recommendation:</span>
                  Purchase at least **12,000 panel connectors** or coordinate fleet balancing with adjacent branch depots immediately.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- DYNAMIC SECTION: FLEET ATTRITION & ORDER TYPES (HIRE vs SALE vs OEA) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-[#002f6c] flex items-center">
              <Package className="w-5 h-5 mr-2" /> 
              Fleet Attrition & Order Types (YTD Model Metrics)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comparing general rental deployments against permanent fleet reductions (equipment sold or scrapped as loss).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
               <div className="flex items-center text-[#002f6c] mb-2">
                 <Briefcase className="w-5 h-5 mr-2" />
                 <h4 className="font-bold text-xs uppercase tracking-wider">Standard HIRE</h4>
               </div>
               <p className="text-3xl font-black text-[#002f6c]">{orderTypesData.summary.hire.toLocaleString()}</p>
               <p className="text-xs text-slate-500 mt-1">Total items actively earning on current hiring invoices.</p>
            </div>
            
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100">
               <div className="flex items-center text-purple-700 mb-2">
                 <DollarSign className="w-5 h-5 mr-2" />
                 <h4 className="font-bold text-xs uppercase tracking-wider">Lost to SALE</h4>
               </div>
               <p className="text-3xl font-black text-purple-700">{orderTypesData.summary.sale.toLocaleString()}</p>
               <p className="text-xs text-slate-500 mt-1">Total inventory permanently sold off to clients.</p>
            </div>

            <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
               <div className="flex items-center text-red-600 mb-2">
                 <MinusCircle className="w-5 h-5 mr-2" />
                 <h4 className="font-bold text-xs uppercase tracking-wider">Lost to OEA (Scrap)</h4>
               </div>
               <p className="text-3xl font-black text-red-600">{orderTypesData.summary.oea.toLocaleString()}</p>
               <p className="text-xs text-slate-500 mt-1">Equipment scrapped, severely damaged, or unrecovered.</p>
            </div>
          </div>

          <h3 className="font-bold text-sm text-slate-700 mb-4 uppercase tracking-wider">Highest Attrition Categories (SALE + OEA)</h3>
          <div className="space-y-4">
             {orderTypesData.attritionBreakdown.map((item, idx) => {
               const salePct = ((item.sale || 0) / maxAttritionValue) * 100;
               const oeaPct = ((item.oea || 0) / maxAttritionValue) * 100;
               const totalLost = (item.sale || 0) + (item.oea || 0);

               return (
                 <div key={idx} className="flex flex-col sm:flex-row sm:items-center text-xs">
                   <div className="w-full sm:w-64 font-semibold text-slate-700 mb-1.5 sm:mb-0 truncate pr-4">
                     {item.name}
                   </div>
                   
                   <div className="flex-1 flex items-center min-h-[24px]">
                     {/* Sale Bar segment */}
                     {(item.sale || 0) > 0 && (
                       <div 
                         className="h-6 bg-purple-500 rounded-l flex items-center px-2 text-white text-[10px] font-black" 
                         style={{ width: `${salePct}%`, minWidth: 'fit-content' }}
                         title={`${item.sale.toLocaleString()} items sold`}
                       >
                         {item.sale.toLocaleString()}
                       </div>
                     )}
                     {/* OEA Bar segment */}
                     {(item.oea || 0) > 0 && (
                       <div 
                         className={`h-6 bg-red-500 flex items-center px-2 text-white text-[10px] font-black ${!item.sale ? 'rounded-l' : ''} rounded-r`}
                         style={{ width: `${oeaPct}%`, minWidth: 'fit-content' }}
                         title={`${item.oea.toLocaleString()} items scrapped`}
                       >
                         {item.oea.toLocaleString()}
                       </div>
                     )}
                   </div>
                   
                   <div className="w-full sm:w-36 text-left sm:text-right font-black text-slate-700 mt-1 sm:mt-0">
                     {totalLost.toLocaleString()} total lost
                   </div>
                 </div>
               );
             })}
          </div>
          
          {/* ACTION RECOMMENDER FOOTER */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5">
             <h4 className="font-bold text-orange-900 flex items-center text-sm mb-2">
               <Lightbulb className="w-5 h-5 mr-2 text-[#ff5a00]"/> 
               Procurement Risk Advisory
             </h4>
             <p className="text-xs text-orange-900 leading-relaxed">
               Please cross-reference this attrition list with the active hire projections above. If a high-volume category is experiencing elevated permanent attrition (such as <strong>Accessories & Connectors</strong> or <strong>Formwork Panels</strong>) and is simultaneously experiencing a customer demand peak, the depot is at severe risk of immediate stockouts. Replacement purchases must be placed prior to the peak.
             </p>
          </div>

          <div className="flex items-center space-x-6 mt-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-4">
             <span className="flex items-center"><div className="w-3.5 h-3.5 bg-purple-500 rounded-md mr-1.5"></div> Sold (SALE)</span>
             <span className="flex items-center"><div className="w-3.5 h-3.5 bg-red-500 rounded-md mr-1.5"></div> Scrapped/Lost (OEA)</span>
          </div>
        </div>

      </main>
    </div>
  );
}