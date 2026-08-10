'use client'

import type { ReactNode } from 'react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CompanyMeta } from '@/types/xbrl-financials'
import { API_BASE_URL } from '@/lib/api/config'
import { authFetch } from '@/lib/api/authFetch'

interface Props {
  meta?: CompanyMeta
}

interface SimpleStock {
  symbol: string
  company_name: string
  sector?: string
}

export function XbrlTopBar({ meta }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [stocks, setStocks] = useState<SimpleStock[]>([])
  const [filtered, setFiltered] = useState<SimpleStock[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch stocks list on mount
  useEffect(() => {
    async function loadStocks() {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/prices/latest?limit=1000`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            setStocks(json.data)
          }
        }
      } catch (err) {
        console.error('Failed to load stocks in topbar:', err)
      }
    }
    loadStocks()
  }, [])

  // Filter stocks based on query
  useEffect(() => {
    if (!query) {
      setFiltered([])
      return
    }
    const q = query.toLowerCase()
    const matches = stocks.filter(
      (s) =>
        s.symbol.includes(q) ||
        s.company_name.toLowerCase().includes(q)
    )
    setFiltered(matches.slice(0, 8))
  }, [query, stocks])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (symbol: string) => {
    setQuery('')
    setIsOpen(false)
    router.push(`/stocks/${symbol}/xbrl`)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/60 bg-white/70 px-6 backdrop-blur-md shadow-[0_1px_0_rgba(17,24,39,0.04)]">
      <Link
        href="/"
        className="whitespace-nowrap font-[Outfit,Inter,sans-serif] text-[16px] font-bold tracking-tight text-[#4338CA]"
      >
        XBRL Viewer
      </Link>
      
      <div className="h-5 w-px bg-gray-200" />
      
      {meta ? (
        <div className="flex items-center gap-3">
          <span className="truncate max-w-[150px] md:max-w-[240px] text-[14px] font-semibold text-[#111827]">
            {meta.company_name}
          </span>
          <div className="hidden items-center gap-2 lg:flex">
            {meta.symbol && (
              <span className="text-[12px] text-gray-500">
                <span className="text-gray-400">Symbol&nbsp;</span>
                <span className="font-mono font-semibold text-gray-700">{meta.symbol}</span>
              </span>
            )}
            {meta.sector && <span className="text-[11px] text-gray-400">{meta.sector}</span>}
            {meta.currency && <Badge>{meta.currency}</Badge>}
            {meta.rounding && <Badge variant="amber">{meta.rounding}</Badge>}
            {meta.status && <Badge variant="green">{meta.status}</Badge>}
          </div>
        </div>
      ) : (
        <span className="text-[13px] text-gray-400">No company selected</span>
      )}

      {/* Stock Search Input */}
      <div ref={dropdownRef} className="relative ml-auto mr-4 w-48 sm:w-64">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stocks / رمز الشركة..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-full border border-gray-200 bg-gray-50/50 px-4 py-1.5 pl-9 text-[12px] placeholder-gray-400 shadow-inner outline-none transition-all focus:border-[#4338CA] focus:bg-white focus:ring-1 focus:ring-[#4338CA]/20"
          />
          <svg
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && filtered.length > 0 && (
          <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-200/50">
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-gray-900 line-clamp-1">
                      {stock.company_name}
                    </span>
                    <span className="text-[10px] text-gray-400">{stock.sector}</span>
                  </div>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-600">
                    {stock.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={meta ? 'hidden md:block' : 'ml-0'}>
        <Link
          href="/stocks"
          className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-[12px] font-medium text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-[#111827]"
        >
          Back to Stocks
        </Link>
      </div>
    </header>
  )
}

function Badge({
  children,
  variant = 'blue',
}: {
  children: ReactNode
  variant?: 'blue' | 'green' | 'amber'
}) {
  const cls = {
    blue: 'border-indigo-200 bg-indigo-50 text-indigo-600',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
  }[variant]

  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>
}