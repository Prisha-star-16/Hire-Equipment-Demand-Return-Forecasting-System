'use client'

import React from 'react'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface FilterPanelProps {
  categories: string[]
  selectedCategory: string
  selectedHorizon: 30 | 60 | 90
  onCategoryChange: (category: string) => void
  onHorizonChange: (horizon: 30 | 60 | 90) => void
}

const HORIZONS: { value: 30 | 60 | 90; label: string; desc: string }[] = [
  { value: 30,  label: '30 Day',  desc: '4 weeks ahead'  },
  { value: 60,  label: '60 Day',  desc: '8 weeks ahead'  },
  { value: 90,  label: '90 Day',  desc: '13 weeks ahead' },
]

export default function FilterPanel({
  categories,
  selectedCategory,
  selectedHorizon,
  onCategoryChange,
  onHorizonChange
}: FilterPanelProps) {
  return (
    <section id="filters" className="glass-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SlidersHorizontal size={14} className="text-brand-orange" />
          <span className="text-brand-text text-sm font-semibold">Filters</span>
          <span className="text-brand-border">|</span>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-brand-muted text-xs font-medium uppercase tracking-wider">
            Horizon:
          </span>
          <div className="flex gap-1.5" id="horizon-selector">
            {HORIZONS.map(h => (
              <button
                key={h.value}
                id={`horizon-${h.value}`}
                onClick={() => onHorizonChange(h.value)}
                title={h.desc}
                className={clsx(
                  'horizon-badge',
                  selectedHorizon === h.value ? 'active' : ''
                )}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-brand-border" />

        {/* Category Selector */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-brand-muted text-xs font-medium uppercase tracking-wider flex-shrink-0">
            Category:
          </span>
          <div className="relative flex-1 max-w-xs">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
              className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] text-brand-text text-sm rounded-lg focus:ring-brand-orange focus:border-brand-orange block w-full pl-10 pr-8 py-2.5 transition-colors cursor-pointer outline-none hover:bg-white"
            >
              <option value="all_categories">All Categories</option>
              {(categories.length > 0
                ? categories
                : [
                    'Formwork Panels',
                    'Accessories & Connectors',
                    'Alignment & Struts',
                    'Safety & Railings',
                    'Transport & Storage',
                    'Scaffolding Components',
                    'Walers & Beams',
                    'Other'
                  ]
              ).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Active filters summary */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-brand-muted flex-shrink-0">
          <span>Showing:</span>
          <span className="text-brand-orange font-medium">
            {selectedHorizon}-day
          </span>
          <span>/</span>
          <span className="text-brand-steel-light font-medium">
            {selectedCategory === 'all_categories' ? 'All Equipment' : selectedCategory}
          </span>
        </div>
      </div>
    </section>
  )
}
