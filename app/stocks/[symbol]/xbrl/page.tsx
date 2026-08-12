import { use } from 'react'

import { XbrlCompanyDashboard } from '@/app/stocks/_components/xbrl/XbrlCompanyDashboard'

export default function XbrlPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  return <XbrlCompanyDashboard symbol={symbol} />
}