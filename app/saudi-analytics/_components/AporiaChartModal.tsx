'use client';

import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { authFetch } from '@/lib/api/authFetch';
import { API_BASE_URL } from '@/lib/api/config';
import { X } from 'lucide-react';

// To evaluate string functions in highcharts config (like formatters and events)
function reviveFunctions(obj: any): any {
    if (typeof obj === 'string') {
        if (obj.trim().startsWith('function')) {
            try {
                // Safely patch chart.yAxis and chart.xAxis to prevent undefined crashes
                let safeObj = obj.replace(/chart\.yAxis\[/g, '(chart.yAxis || [])[');
                safeObj = safeObj.replace(/chart\.xAxis\[/g, '(chart.xAxis || [])[');

                // React Strict Mode unmounts the chart before the 200ms timeout fires, destroying chart properties.
                // Inject a check to safely abort if the chart was destroyed.
                safeObj = safeObj.replace(/setTimeout\(function\s*\(\)\s*\{/g, 'setTimeout(function() { if (!chart || !chart.renderer) return;');

                const fn = new Function('return ' + safeObj)();
                // Wrap the function to prevent crashes in React
                return function (this: any, ...args: any[]) {
                    try {
                        // In some wrappers, 'this' is the event, so use this.target for the chart instance
                        const chartCtx = (this && this.target) ? this.target : this;
                        return fn.apply(chartCtx, args);
                    } catch (err) {
                        console.warn("Highcharts function error:", err);
                        return undefined;
                    }
                };
            } catch (e) {
                console.error("Failed to parse function string", e);
                return obj;
            }
        }
    }
    if (obj !== null && typeof obj === 'object') {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = reviveFunctions(obj[i]);
            }
        } else {
            for (let key in obj) {
                obj[key] = reviveFunctions(obj[key]);
            }
        }
    }
    return obj;
}

interface ModalProps {
    ticker: string;
    name: string;
    onClose: () => void;
}

const CHART_TYPES = [
    { value: 'trend', label: '250-Day Highs/Lows' },
    { value: 'breakout', label: 'Breakouts' },
    { value: 'longest_consolidation_window', label: 'Consolidations' },
    { value: 'volume', label: 'Volume' },
    { value: 'price_extreme', label: 'Price Extremes' }
];

export default function AporiaChartModal({ ticker, name, onClose }: ModalProps) {
    const [chartType, setChartType] = useState('trend');
    const [options, setOptions] = useState<Highcharts.Options | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Expose Highcharts to window for formatters that use it (e.g., Highcharts.dateFormat)
        if (typeof window !== 'undefined') {
            (window as any).Highcharts = Highcharts;
        }
        fetchChartData();
    }, [ticker, chartType]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const fetchChartData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/aporia/chart/${ticker}?chart_type=${chartType}`);
            if (!res.ok) {
                throw new Error('Failed to fetch chart data. Ensure Scrape_aporia_charts.py was run for this ticker.');
            }
            const data = await res.json();

            // Revive functions inside the json
            const config = reviveFunctions(data);

            setOptions(config);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-[760px] max-w-[95vw] rounded shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
                {/* Header matching Aporia design */}
                <div className="bg-[#B71C1C] text-white flex justify-between items-center px-4 py-2">
                    <h2 className="text-[13px] font-semibold">{name} ({ticker})</h2>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-white hover:text-gray-200 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Body — sized by the chart itself, not stretched into a fixed box */}
                <div className="bg-white flex flex-col">
                    {/* Dropdown sits in its own row, centered, with breathing room above/below — not overlapping the chart */}
                    <div className="flex justify-center pt-4 pb-3">
                        <select
                            className="bg-white border border-gray-300 text-xs px-3 py-1.5 rounded shadow-sm outline-none w-56 focus:ring-1 focus:ring-gray-300 cursor-pointer"
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                        >
                            <option value="trend">250-Day Highs/Lows</option>
                            <option value="breakout">Price Breakouts</option>
                            <option value="longest_consolidation_window">Consolidations</option>
                            <option value="volume">Volume (20-Day Avg)</option>
                            <option value="price_extreme">Price Extremes</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[400px] items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
                        </div>
                    ) : error ? (
                        <div className="flex min-h-[400px] items-center justify-center text-red-500 text-sm">
                            {error}
                        </div>
                    ) : options ? (
                        <div className="pb-3 px-1">
                            <HighchartsReact
                                highcharts={Highcharts}
                                constructorType={'stockChart'}
                                options={options}
                                containerProps={{ style: { width: '100%' } }}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}