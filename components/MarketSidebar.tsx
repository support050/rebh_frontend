'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarItem {
  en: string
  href: string
  items?: SidebarItem[]
}

const menuItems: SidebarItem[] = [
  {
    en: 'Bonds',
    href: '/bonds',
    items: [
      { en: 'Daily Treasury Yield Curve', href: '/bonds/daily-treasury-yield-curve' },
      { en: 'Treasury Yield Curve', href: '/bonds/treasury-yield-curve' },
      { en: 'Yield Curve', href: '/bonds/yield-curve' },
    ],
  },
  {
    en: 'Economic Indicators',
    href: '/economic-indicators',
    items: [
      { en: 'Unemployment Rate (UNRATE)', href: '/economic-indicators/unrate' },
      { en: 'Nonfarm Payroll (PAYEMS)', href: '/economic-indicators/payems' },
      { en: 'Initial Claims (IC4WSA)', href: '/economic-indicators/ic4wsa' },
      { en: 'NFP Change', href: '/economic-indicators/nfp-change' },
    ],
  },
  {
    en: 'Market',
    href: '/market',
    items: [
      { en: 'YRI Earnings Outlook', href: '/market/yri-earnings-outlook' },
      { en: 'S&P 500 Earnings Yield', href: '/market/sp500-earnings-yield' },
      { en: 'S&P 500 P/E Ratio', href: '/market/sp500-pe-ratio' },
      { en: 'A Effective Yield', href: '/market/a-effective-yield' },
    ],
  },
  {
    en: 'Market Reports',
    href: '/market-reports',
    items: [
      { en: 'Substantial Shareholders', href: '/market-reports/substantial-shareholders' },
      { en: 'Net Short Positions', href: '/market-reports/net-short-positions' },
      { en: 'Foreign Headroom', href: '/market-reports/foreign-headroom' },
      { en: 'Share Buybacks', href: '/market-reports/share-buybacks' },
      { en: 'SBL Positions', href: '/market-reports/sbl-positions' },
      { en: 'Historical Reports', href: '/market-reports/historical-reports' },
    ],
  },
  {
    en: 'Interest Rate',
    href: '/interest-rate',
    items: [
      { en: 'CME FedWatch', href: '/interest-rate/cme-fedwatch' },
      { en: 'Eurodollar Futures', href: '/interest-rate/eurodollar-futures' },
    ],
  },
  {
    en: 'Spread',
    href: '/spread',
    items: [
      { en: 'BBB Corporate Spread', href: '/spread/bbb-corporate' },
      { en: 'A Corporate Spread', href: '/spread/a-corporate' },
    ],
  },
]

export const SIDEBAR_PATHS = [
  '/bonds',
  '/economic-indicators',
  '/market',
  '/market-reports',
  '/interest-rate',
  '/spread',
]

export function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function MarketSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    menuItems.forEach((item, i) => {
      const key = `item-${i}`
      if (pathname.startsWith(item.href)) {
        initial[key] = true
      }
    })
    return initial
  })

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const isActive = (href: string) => {
    const normalize = (p: string) => p.replace(/\/$/, '')
    return normalize(pathname) === normalize(href)
  }

  const isParentActive = (item: SidebarItem) => {
    if (pathname === item.href) return true
    return item.items?.some(sub => pathname === sub.href) ?? false
  }

  return (
    <aside
      className={`${collapsed ? 'w-12' : 'w-60'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 h-[calc(100vh-56px)] sticky top-14`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Market Data
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600 ml-auto"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Menu */}
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {menuItems.map((item, index) => {
            const key = `item-${index}`
            const isExp = expandedItems[key]
            const parentActive = isParentActive(item)

            return (
              <div key={key}>
                <button
                  onClick={() => toggleExpanded(key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 text-left text-[13px] font-medium ${parentActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <span>{item.en}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isExp ? 'rotate-180' : ''
                      } ${parentActive ? 'text-blue-400' : 'text-gray-400'}`}
                  />
                </button>

                {isExp && item.items && (
                  <div className="mt-0.5 ml-2 pl-2 border-l border-gray-100 space-y-0.5">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={`block px-3 py-1.5 rounded-md transition-all duration-200 text-[12px] ${isActive(subItem.href)
                          ? 'bg-blue-100 text-blue-700 font-semibold border-l-2 border-blue-500 -ml-[9px] pl-[11px]'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium'
                          }`}
                      >
                        {subItem.en}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}
    </aside>
  )
}