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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">


      <div className="h-6 w-px bg-[#E5E7EB]" />

      {meta ? (
        <div className="flex items-center gap-3 rounded-[4px] border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1.5">
          <span className="truncate max-w-[150px] md:max-w-[240px] font-sans text-[14px] font-bold text-[#1A1A1A]">
            {meta.company_name}
          </span>
          <div className="hidden items-center gap-2 lg:flex">
            {meta.symbol && (
              <span className="text-[12px] text-[#6B7280]">
                <span className="text-[#6B7280]">Symbol&nbsp;</span>
                <span className="font-sans font-semibold text-[#1A1A1A]">{meta.symbol}</span>
              </span>
            )}
            {meta.sector && <span className="text-[11px] italic text-[#6B7280]">{meta.sector}</span>}
            {meta.currency && <Badge variant="blue">{meta.currency}</Badge>}
            {meta.rounding && <Badge variant="amber">{meta.rounding}</Badge>}
            {meta.status && <Badge variant="green">{meta.status}</Badge>}
          </div>
        </div>
      ) : (
        <span className="font-sans text-[13px] italic text-[#6B7280]">No company selected</span>
      )}

      {/* Stock Search Input */}
      <div ref={dropdownRef} className="relative ml-auto mr-4 w-48 sm:w-64">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stocks"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-[4px] border border-[#E5E7EB] bg-white px-4 py-1.5 pl-9 font-sans text-[12px] text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-all focus:border-[#8C3B32] focus:shadow-[0_0_0_2px_rgba(140,59,50,0.12)]"
          />
          <svg
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
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
          <div className="absolute right-0 top-full mt-1.5 w-72 rounded-[4px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className="flex w-full items-center justify-between rounded-[4px] px-3 py-2 text-left transition-colors hover:bg-[#F3F4F6]"
                >
                  <div className="flex flex-col">
                    <span className="font-sans text-[12px] font-semibold text-[#1A1A1A] line-clamp-1">
                      {stock.company_name}
                    </span>
                    <span className="text-[10px] italic text-[#6B7280]">{stock.sector}</span>
                  </div>
                  <span className="rounded-[4px] border border-[#E5E7EB] bg-[#F3F4F6] px-1.5 py-0.5 font-sans text-[10px] font-bold text-[#1A1A1A]">
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
          className="rounded-[4px] border border-[#E5E7EB] bg-white px-4 py-1.5 font-sans text-[12px] font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F3F4F6]"
        >
          ← Back to Stocks
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
    blue: 'border-[#93C5FD] bg-[#EFF6FF] text-[#2563EB]',
    green: 'border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]',
    amber: 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]',
  }[variant]

  return (
    <span className={`rounded-[4px] border px-2 py-0.5 font-sans text-[10px] font-bold ${cls}`}>
      {children}
    </span>
  )
}