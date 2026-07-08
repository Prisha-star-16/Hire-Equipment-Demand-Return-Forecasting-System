'use client'

import React from 'react'
import { Github, ExternalLink, Activity } from 'lucide-react'

interface NavbarProps {
  generatedAt: string
  model: string
}

export default function Navbar({ generatedAt, model }: NavbarProps) {
  return (
    <nav
      id="navbar"
      className="sticky top-0 z-50 w-full border-b border-brand-border bg-white/90 backdrop-blur-md"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-steel to-brand-navy rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">SGB</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-orange border border-brand-surface" />
            </div>
            <div>
              <p className="text-brand-text font-semibold text-sm leading-none">
                Hire Forecasting
              </p>
              <p className="text-brand-muted text-xs leading-none mt-0.5">
                SGB Safway Case Study
              </p>
            </div>
          </div>

          {/* Centre: Live status indicator */}
          <div className="hidden md:flex items-center gap-2 glass-card px-3 py-1.5">
            <Activity size={12} className="text-brand-green animate-pulse" />
            <span className="text-brand-muted text-xs">
              Model: <span className="text-brand-orange font-semibold">{model}</span>
            </span>
            <span className="text-brand-border mx-2">•</span>
            <span className="text-brand-muted text-xs">
              Updated: <span className="text-brand-text font-medium">{generatedAt}</span>
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-1">
              {['Forecast', 'Returns', 'Markets', 'Insights'].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="nav-link px-3 py-1.5 text-brand-muted hover:text-brand-text text-sm font-medium transition-colors rounded-md hover:bg-brand-card"
                >
                  {item}
                </a>
              ))}
            </nav>
            <div className="w-px h-5 bg-brand-border hidden sm:block" />
            <a
              id="github-link"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-orange transition-all text-sm font-medium"
            >
              <Github size={14} />
              <span className="hidden sm:inline">GitHub</span>
              <ExternalLink size={10} className="opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
