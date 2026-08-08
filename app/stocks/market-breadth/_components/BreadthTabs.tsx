'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart2, TrendingUp, Target } from 'lucide-react';

export default function BreadthTabs({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { id: '/stocks/market-breadth', label: 'Market Breadth', icon: <Activity className="w-4 h-4" /> },
        { id: '/Percent_of_Stocks_Above_MA', label: 'Percent Above MA', icon: <BarChart2 className="w-4 h-4" /> },
        { id: '/minervini-trend', label: 'Minervini Trend', icon: <TrendingUp className="w-4 h-4" /> },
        { id: '/screeners/Alrayan&Alhussain', label: 'Alrayan & Alhussain', icon: <Target className="w-4 h-4" /> },
    ];

    return (
        <div className="flex-shrink-0 z-50 overflow-visible" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ maxWidth: '1920px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flexShrink: 0 }}>
                    {tabs.map(tab => {
                        const active = pathname === tab.id || pathname.startsWith(tab.id + '/');
                        return (
                            <Link
                                key={tab.id}
                                href={tab.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                                    backgroundColor: active ? '#2563EB' : 'transparent',
                                    color: active ? '#FFFFFF' : '#6B7280',
                                    borderColor: active ? '#1D4ED8' : '#E5E7EB',
                                    boxShadow: active ? '0 2px 8px rgba(37,99,235,0.35)' : 'none',
                                    textDecoration: 'none'
                                }}
                            >
                                <span style={{ color: active ? '#BFDBFE' : '#9CA3AF' }}>{tab.icon}</span>
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
                {children && (
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'visible', flexShrink: 1 }}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}