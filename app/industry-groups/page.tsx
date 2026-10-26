'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatShariahApproval, formatPurgeAmount, formatMarginable } from '../stocks/utils/formatters';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { buildShariahMap } from '@/lib/watchlist/shariah';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface IndustryGroup {
    id: number;
    date: string;
    industry_group: string;
    sector: string;
    number_of_stocks: number;
    market_value: number;
    rs_score: number;
    rank: number;
    rank_1_week_ago?: number;
    rank_3_months_ago?: number;
    rank_6_months_ago?: number;
    ytd_change_percent: number;
    letter_grade?: string;
    change_vs_last_week?: number;
    percent_above_ma20?: number;
    percent_above_ma50?: number;
    percent_above_ma150?: number;
    percent_above_ma200?: number;
    count_above_ma20?: number;
    count_above_ma50?: number;
    count_above_ma150?: number;
    count_above_ma200?: number;
}

interface StockSummary {
    symbol: string;
    company_name: string;
    close: number;
    change_percent: number;
    market_cap: number;
    industry_group: string;
    sector: string;
    industry: string;
    sub_industry: string;
    date: string;
    rs_rating?: number;
    rs_rating_1_week_ago?: number;
    rs_rating_4_weeks_ago?: number;
    rs_rating_3_months_ago?: number;
    rs_rating_6_months_ago?: number;
    rs_rating_1_year_ago?: number;
    approval_with_controls?: string;
    purge_amount?: number | null;
    marginable_percent?: number | null;
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

interface FilterState {
    sector: string[];
    industry_group: string[];
    industry: string[];
    sub_industry: string[];
    number_of_stocks_min: string;
    number_of_stocks_max: string;
    rank_min: string;
    rank_max: string;
    rank_1_week_ago_min: string;
    rank_1_week_ago_max: string;
    rank_3_months_ago_min: string;
    rank_3_months_ago_max: string;
    rank_6_months_ago_min: string;
    rank_6_months_ago_max: string;
    ytd_change_percent_min: string;
    ytd_change_percent_max: string;
    market_value_min: string;
    market_value_max: string;
    change_vs_last_week_min: string;
    change_vs_last_week_max: string;
    letter_grade: string[];
}

interface StockFilterState {
    symbol: string;
    company_name: string;
    rs_rating_min: string;
    rs_rating_max: string;
    rs_rating_1_week_ago_min: string;
    rs_rating_1_week_ago_max: string;
    rs_rating_4_weeks_ago_min: string;
    rs_rating_4_weeks_ago_max: string;
    rs_rating_3_months_ago_min: string;
    rs_rating_3_months_ago_max: string;
    rs_rating_6_months_ago_min: string;
    rs_rating_6_months_ago_max: string;
    rs_rating_1_year_ago_min: string;
    rs_rating_1_year_ago_max: string;
    approval_with_controls: string[];
    purge_amount_min: string;
    purge_amount_max: string;
    marginable_percent_min: string;
    marginable_percent_max: string;
    sparkline_trend: 'all' | 'rising' | 'falling';
}

const DEFAULT_FILTERS: FilterState = {
    sector: [], industry_group: [], industry: [], sub_industry: [],
    number_of_stocks_min: '', number_of_stocks_max: '',
    rank_min: '', rank_max: '',
    rank_1_week_ago_min: '', rank_1_week_ago_max: '',
    rank_3_months_ago_min: '', rank_3_months_ago_max: '',
    rank_6_months_ago_min: '', rank_6_months_ago_max: '',
    ytd_change_percent_min: '', ytd_change_percent_max: '',
    market_value_min: '', market_value_max: '',
    change_vs_last_week_min: '', change_vs_last_week_max: '',
    letter_grade: [],
};

const DEFAULT_STOCK_FILTERS: StockFilterState = {
    symbol: '', company_name: '',
    rs_rating_min: '', rs_rating_max: '',
    rs_rating_1_week_ago_min: '', rs_rating_1_week_ago_max: '',
    rs_rating_4_weeks_ago_min: '', rs_rating_4_weeks_ago_max: '',
    rs_rating_3_months_ago_min: '', rs_rating_3_months_ago_max: '',
    rs_rating_6_months_ago_min: '', rs_rating_6_months_ago_max: '',
    rs_rating_1_year_ago_min: '', rs_rating_1_year_ago_max: '',
    approval_with_controls: [],
    purge_amount_min: '', purge_amount_max: '',
    marginable_percent_min: '', marginable_percent_max: '',
    sparkline_trend: 'all',
};

// Raw Shariah status value (as returned by buildShariahMap / approval_with_controls)
// that qualifies as "compliant" for the automated report. Keep this in sync with
// the raw Arabic values in lib/watchlist/shariah.ts — this is NOT the
// formatShariahApproval() display value.
const SHARIAH_COMPLIANT_RAW = 'متوافقة مع الضوابط';

const RS_MOMENTUM_OPTIONS = [
    { key: 'full_chain', label: 'RS > 1W > 4W > 3M > 6M > 1Y', check: (s: StockSummary) => (s.rs_rating ?? 0) > (s.rs_rating_1_week_ago ?? 0) && (s.rs_rating_1_week_ago ?? 0) > (s.rs_rating_4_weeks_ago ?? 0) && (s.rs_rating_4_weeks_ago ?? 0) > (s.rs_rating_3_months_ago ?? 0) && (s.rs_rating_3_months_ago ?? 0) > (s.rs_rating_6_months_ago ?? 0) && (s.rs_rating_6_months_ago ?? 0) > (s.rs_rating_1_year_ago ?? 0) },
    { key: 'rs_gt_1w', label: 'RS > 1W', check: (s: StockSummary) => (s.rs_rating ?? 0) > (s.rs_rating_1_week_ago ?? 0) },
    { key: '1w_gt_4w', label: 'RS 1W > 4W', check: (s: StockSummary) => (s.rs_rating_1_week_ago ?? 0) > (s.rs_rating_4_weeks_ago ?? 0) },
    { key: '3m_gt_6m', label: 'RS 3M > 6M', check: (s: StockSummary) => (s.rs_rating_3_months_ago ?? 0) > (s.rs_rating_6_months_ago ?? 0) },
    { key: '6m_gt_1y', label: 'RS 6M > 1Y', check: (s: StockSummary) => (s.rs_rating_6_months_ago ?? 0) > (s.rs_rating_1_year_ago ?? 0) },
];

const LETTER_GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D', 'F'];

const COLUMN_DEFINITIONS = [
    { key: 'display_order', label: 'Order', sortable: false },
    { key: 'industry_group', label: 'Industry Group', sortable: true },
    { key: 'number_of_stocks', label: 'Num Stocks', sortable: true },
    { key: 'rank', label: 'Ind Group Rank', sortable: true },
    { key: 'rank_1_week_ago', label: 'Last Week', sortable: true },
    { key: 'rank_3_months_ago', label: '3 Mo Ago', sortable: true },
    { key: 'rank_6_months_ago', label: '6 Mo Ago', sortable: true },
    { key: 'ytd_change_percent', label: '% Chg YTD', sortable: true },
    { key: 'market_value', label: 'Ind Mkt Val (Bil)', sortable: true },
    { key: 'change_vs_last_week', label: 'Change v last week', sortable: true },
    { key: 'count_above_ma20', label: '# of stocks > 20MA', sortable: true },
    { key: 'percent_above_ma20', label: '% of stocks > 20MA', sortable: true },
    { key: 'count_above_ma50', label: '# of stocks > 50MA', sortable: true },
    { key: 'percent_above_ma50', label: '% of stocks > 50MA', sortable: true },
    { key: 'count_above_ma150', label: '# of stocks > 150MA', sortable: true },
    { key: 'percent_above_ma150', label: '% of stocks > 150MA', sortable: true },
    { key: 'count_above_ma200', label: '# of stocks > 200MA', sortable: true },
    { key: 'percent_above_ma200', label: '% of stocks > 200MA', sortable: true },
];

const STOCK_COLUMN_DEFINITIONS = [
    { key: 'symbol', label: 'Symbol', sortable: true },
    { key: 'company_name', label: 'Name', sortable: true },
    { key: 'rs_rating', label: 'RS Rating', sortable: true },
    { key: 'rs_rating_1_week_ago', label: '1W Ago', sortable: true },
    { key: 'rs_rating_4_weeks_ago', label: '4W Ago', sortable: true },
    { key: 'rs_rating_3_months_ago', label: '3M Ago', sortable: true },
    { key: 'rs_rating_6_months_ago', label: '6M Ago', sortable: true },
    { key: 'rs_rating_1_year_ago', label: '1Y Ago', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'sub_industry', label: 'Sub Industry', sortable: true },
    { key: 'approval_with_controls', label: 'Shariah', sortable: true },
    { key: 'purge_amount', label: 'Purge Amt', sortable: true },
    { key: 'marginable_percent', label: 'Marginable%', sortable: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE TREND HELPER
// Returns the oldest available RS value to compare against the current one.
// ─────────────────────────────────────────────────────────────────────────────

function getSparklineFirstValue(stock: StockSummary): number {
    return (
        stock.rs_rating_1_year_ago ??
        stock.rs_rating_6_months_ago ??
        stock.rs_rating_3_months_ago ??
        stock.rs_rating_4_weeks_ago ??
        stock.rs_rating_1_week_ago ??
        0
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// URL STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function filtersToParams(filters: FilterState, stockFilters: StockFilterState, rsMomentum: string[]): URLSearchParams {
    const params = new URLSearchParams();
    const f = filters as Record<string, any>;
    const sf = stockFilters as Record<string, any>;
    Object.keys(f).forEach(k => {
        const v = f[k];
        if (Array.isArray(v) && v.length > 0) params.set(k, v.join(','));
        else if (!Array.isArray(v) && v !== '') params.set(k, v);
    });
    Object.keys(sf).forEach(k => {
        const v = sf[k];
        if (Array.isArray(v) && v.length > 0) params.set(`s_${k}`, v.join(','));
        else if (!Array.isArray(v) && v !== '' && v !== 'all') params.set(`s_${k}`, v);
    });
    if (rsMomentum.length > 0) params.set('rs_momentum', rsMomentum.join(','));
    return params;
}

function paramsToFilters(params: URLSearchParams): { filters: FilterState; stockFilters: StockFilterState; rsMomentum: string[] } {
    const arrayKeys: (keyof FilterState)[] = ['sector', 'industry_group', 'industry', 'sub_industry', 'letter_grade'];
    const f: any = { ...DEFAULT_FILTERS };
    const sf: any = { ...DEFAULT_STOCK_FILTERS };

    params.forEach((val, key) => {
        if (key === 'rs_momentum') return;
        if (key.startsWith('s_')) {
            const sfKey = key.slice(2);
            if (sfKey in sf) {
                sf[sfKey] = Array.isArray(DEFAULT_STOCK_FILTERS[sfKey as keyof StockFilterState])
                    ? val.split(',')
                    : val;
            }
        } else if (key in f) {
            f[key] = arrayKeys.includes(key as keyof FilterState) ? val.split(',') : val;
        }
    });
    const rsMomentum = params.get('rs_momentum')?.split(',').filter(Boolean) ?? [];
    return { filters: f, stockFilters: sf, rsMomentum };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COLOR INTERPOLATION HELPER (Fixes bug #5)
// ─────────────────────────────────────────────────────────────────────────────

function interpolateRSColor(value: number, rowMin: number, rowMax: number): [number, number, number] {
    const range = rowMax - rowMin;
    const pct = range === 0 ? 0.5 : (value - rowMin) / range;
    let r: number, g: number, b: number;
    if (pct <= 0.5) {
        const t = pct / 0.5;
        r = Math.round(220 + (251 - 220) * t);
        g = Math.round(38 + (191 - 38) * t);
        b = Math.round(38 + (36 - 38) * t);
    } else {
        const t = (pct - 0.5) / 0.5;
        r = Math.round(251 + (22 - 251) * t);
        g = Math.round(191 + (163 - 191) * t);
        b = Math.round(36 + (74 - 36) * t);
    }
    return [r, g, b];
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — useIndustryGroups
// ─────────────────────────────────────────────────────────────────────────────

function useIndustryGroups() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const initialState = useMemo(() => paramsToFilters(searchParams), []);

    const [data, setData] = useState<IndustryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<FilterState>(initialState.filters);
    const [stockFilters, setStockFiltersState] = useState<StockFilterState>(initialState.stockFilters);
    const [rsMomentumFilters, setRsMomentumFilters] = useState<string[]>(initialState.rsMomentum);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [stocksCache, setStocksCache] = useState<Record<string, StockSummary[]>>({});
    // FIX #1: Replace loadingStocks Set with useRef to avoid stale closures
    const loadingStocksRef = useRef<Set<string>>(new Set());
    // Expose derived state for UI (optional - can be used to show loading indicators)
    const [loadingStocksUI, setLoadingStocksUI] = useState<Set<string>>(new Set());
    const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
    const [stockSortConfigs, setStockSortConfigs] = useState<Record<string, SortConfig[]>>({});
    const [stats, setStats] = useState({ topPerformer: { group: '', change: 0 }, worstPerformer: { group: '', change: 0 } });
    const [shariahOptions, setShariahOptions] = useState<string[]>([]);
    // FIX #3: Add isMounted ref to prevent memory leaks
    const isMountedRef = useRef(true);

    // ── Report generation state ────────────────────────────────────────────
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const reportExpandTriggeredRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/prices/latest?limit=1000`, {
                    credentials: 'include',
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const json = await res.json();
                if (cancelled && !isMountedRef.current) return;
                setShariahOptions(buildShariahMap(json.data || []).options);
            } catch (err) {
                console.error('Failed to load Shariah options', err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const params = filtersToParams(filters, stockFilters, rsMomentumFilters);
        // 2026-10-25: the ?autoReport=true URL passthrough was removed together with
        // the deleted Puppeteer report route — this effect only syncs filters to the URL.
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }, [filters, stockFilters, rsMomentumFilters, router, pathname]);

    const setFilters = useCallback((updater: FilterState | ((prev: FilterState) => FilterState)) => {
        setFiltersState(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    const setStockFilters = useCallback((updater: StockFilterState | ((prev: StockFilterState) => StockFilterState)) => {
        setStockFiltersState(prev => typeof updater === 'function' ? updater(prev) : updater);
    }, []);

    const toggleRsMomentumFilter = useCallback((key: string) => {
        setRsMomentumFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/industry-groups/latest`, { cache: 'no-store', credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch data');
                const jsonData = await res.json();
                if (!isMountedRef.current) return;
                setData(jsonData);
                if (jsonData.length > 0) {
                    let top = jsonData[0], worst = jsonData[0];
                    jsonData.forEach((item: IndustryGroup) => {
                        if (item.ytd_change_percent > top.ytd_change_percent) top = item;
                        if (item.ytd_change_percent < worst.ytd_change_percent) worst = item;
                    });
                    setStats({ topPerformer: { group: top.industry_group, change: top.ytd_change_percent }, worstPerformer: { group: worst.industry_group, change: worst.ytd_change_percent } });
                }
            } catch (err) {
                if (isMountedRef.current) setError('Failed to load industry groups.');
            } finally {
                if (isMountedRef.current) setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // FIX #1 & #3: fetchGroupStocks now uses ref for loading state and checks mounted flag
    const fetchGroupStocks = useCallback(async (groupName: string) => {
        // Use ref to check loading state - always up to date
        if (loadingStocksRef.current.has(groupName)) return;

        loadingStocksRef.current.add(groupName);
        // Update UI state if needed
        setLoadingStocksUI(prev => new Set(prev).add(groupName));

        try {
            const res = await authFetch(`${API_BASE_URL}/api/industry-groups/stocks?industry_group=${encodeURIComponent(groupName)}`, { cache: 'no-store', credentials: 'include' });
            if (!isMountedRef.current) return; // FIX #3: Check if component still mounted

            if (res.ok) {
                const stocks = await res.json();
                if (!isMountedRef.current) return; // Check again after async operation
                setStocksCache(prev => ({ ...prev, [groupName]: stocks }));
            } else {
                setStocksCache(prev => ({ ...prev, [groupName]: [] }));
            }
        } catch (err) {
            if (isMountedRef.current) {
                console.error(`Failed to fetch stocks for ${groupName}`, err);
                setStocksCache(prev => ({ ...prev, [groupName]: [] }));
            }
        } finally {
            if (isMountedRef.current) {
                loadingStocksRef.current.delete(groupName);
                setLoadingStocksUI(prev => {
                    const n = new Set(prev);
                    n.delete(groupName);
                    return n;
                });
            }
        }
    }, []);

    const checkRange = useCallback((value: any, minKey: keyof FilterState, maxKey: keyof FilterState) => {
        const minV = filters[minKey] as string, maxV = filters[maxKey] as string;
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        if (minV && num < parseFloat(minV)) return false;
        if (maxV && num > parseFloat(maxV)) return false;
        return true;
    }, [filters]);

    const checkStockRange = useCallback((value: any, minKey: keyof StockFilterState, maxKey: keyof StockFilterState) => {
        const minV = stockFilters[minKey] as string, maxV = stockFilters[maxKey] as string;
        const num = typeof value === 'number' ? value : parseFloat(value) || 0;
        if (minV && num < parseFloat(minV)) return false;
        if (maxV && num > parseFloat(maxV)) return false;
        return true;
    }, [stockFilters]);

    // FIX #6: Split filtering and sorting into separate useMemo hooks
    const filteredDataOnly = useMemo(() => {
        return data.filter(item => {
            if (filters.sector.length > 0 && !filters.sector.includes(item.sector)) return false;
            if (filters.industry_group.length > 0 && !filters.industry_group.includes(item.industry_group)) return false;
            if (filters.letter_grade.length > 0 && !filters.letter_grade.includes(item.letter_grade || '')) return false;
            if (!checkRange(item.number_of_stocks, 'number_of_stocks_min', 'number_of_stocks_max')) return false;
            if (!checkRange(item.rank, 'rank_min', 'rank_max')) return false;
            if (!checkRange(item.rank_1_week_ago, 'rank_1_week_ago_min', 'rank_1_week_ago_max')) return false;
            if (!checkRange(item.rank_3_months_ago, 'rank_3_months_ago_min', 'rank_3_months_ago_max')) return false;
            if (!checkRange(item.rank_6_months_ago, 'rank_6_months_ago_min', 'rank_6_months_ago_max')) return false;
            if (!checkRange(item.ytd_change_percent, 'ytd_change_percent_min', 'ytd_change_percent_max')) return false;
            if (!checkRange(item.market_value, 'market_value_min', 'market_value_max')) return false;
            if (!checkRange(item.change_vs_last_week, 'change_vs_last_week_min', 'change_vs_last_week_max')) return false;
            return true;
        });
    }, [data, filters, checkRange]);

    // FIX #6: Sorting depends only on filteredDataOnly
    const filteredData = useMemo(() => {
        if (sortConfigs.length === 0) return filteredDataOnly;

        return [...filteredDataOnly].sort((a, b) => {
            for (const config of sortConfigs) {
                const getVal = (item: IndustryGroup): any => {
                    switch (config.key) {
                        case 'rank': return item.rank;
                        case 'industry_group': return item.industry_group.toLowerCase();
                        case 'number_of_stocks': return item.number_of_stocks;
                        case 'rank_1_week_ago': return item.rank_1_week_ago || 999;
                        case 'rank_3_months_ago': return item.rank_3_months_ago || 999;
                        case 'rank_6_months_ago': return item.rank_6_months_ago || 999;
                        case 'ytd_change_percent': return item.ytd_change_percent;
                        case 'market_value': return item.market_value || 0;
                        case 'change_vs_last_week': return item.change_vs_last_week || 0;
                        default: return 0;
                    }
                };
                const aV = getVal(a), bV = getVal(b);
                if (aV === bV) continue;
                if (typeof aV === 'string') {
                    const cmp = aV.localeCompare(bV);
                    if (cmp !== 0) return config.direction === 'asc' ? cmp : -cmp;
                } else {
                    const diff = Number(aV) - Number(bV);
                    if (diff !== 0) return config.direction === 'asc' ? diff : -diff;
                }
            }
            return 0;
        });
    }, [filteredDataOnly, sortConfigs]);

    // FIX #7: Memoize filtered stocks per group
    const filteredStocksCache = useMemo(() => {
        const cache: Record<string, StockSummary[]> = {};

        for (const groupName of Object.keys(stocksCache)) {
            const stocks = stocksCache[groupName] || [];
            const cur = stockSortConfigs[groupName] || [];
            const effectiveSorts = cur.length > 0 ? cur : [{ key: 'rs_rating', direction: 'desc' as const }];

            let filtered = stocks.filter(stock => {
                if (filters.industry.length > 0 && !filters.industry.includes(stock.industry)) return false;
                if (filters.sub_industry.length > 0 && !filters.sub_industry.includes(stock.sub_industry)) return false;
                if (stockFilters.symbol && !stock.symbol.toLowerCase().includes(stockFilters.symbol.toLowerCase())) return false;
                if (stockFilters.company_name && !stock.company_name.toLowerCase().includes(stockFilters.company_name.toLowerCase())) return false;
                if (!checkStockRange(stock.rs_rating, 'rs_rating_min', 'rs_rating_max')) return false;
                if (!checkStockRange(stock.rs_rating_1_week_ago, 'rs_rating_1_week_ago_min', 'rs_rating_1_week_ago_max')) return false;
                if (!checkStockRange(stock.rs_rating_4_weeks_ago, 'rs_rating_4_weeks_ago_min', 'rs_rating_4_weeks_ago_max')) return false;
                if (!checkStockRange(stock.rs_rating_3_months_ago, 'rs_rating_3_months_ago_min', 'rs_rating_3_months_ago_max')) return false;
                if (!checkStockRange(stock.rs_rating_6_months_ago, 'rs_rating_6_months_ago_min', 'rs_rating_6_months_ago_max')) return false;
                if (!checkStockRange(stock.rs_rating_1_year_ago, 'rs_rating_1_year_ago_min', 'rs_rating_1_year_ago_max')) return false;
                for (const key of rsMomentumFilters) {
                    const option = RS_MOMENTUM_OPTIONS.find(o => o.key === key);
                    if (option && !option.check(stock)) return false;
                }
                if (stockFilters.approval_with_controls.length > 0) {
                    const status = stock.approval_with_controls || '';
                    if (!stockFilters.approval_with_controls.includes(status)) return false;
                }
                if (!checkStockRange(stock.purge_amount, 'purge_amount_min', 'purge_amount_max')) return false;
                if (!checkStockRange(stock.marginable_percent, 'marginable_percent_min', 'marginable_percent_max')) return false;

                if (stockFilters.sparkline_trend !== 'all') {
                    const firstVal = getSparklineFirstValue(stock);
                    const lastVal = stock.rs_rating ?? 0;
                    if (stockFilters.sparkline_trend === 'rising' && lastVal <= firstVal) return false;
                    if (stockFilters.sparkline_trend === 'falling' && lastVal >= firstVal) return false;
                }

                return true;
            });

            filtered = [...filtered].sort((a, b) => {
                for (const config of effectiveSorts) {
                    const getVal = (item: StockSummary): any => {
                        switch (config.key) {
                            case 'symbol': return item.symbol.toLowerCase();
                            case 'company_name': return item.company_name.toLowerCase();
                            case 'rs_rating': return item.rs_rating ?? 0;
                            case 'rs_rating_1_week_ago': return item.rs_rating_1_week_ago ?? 0;
                            case 'rs_rating_4_weeks_ago': return item.rs_rating_4_weeks_ago ?? 0;
                            case 'rs_rating_3_months_ago': return item.rs_rating_3_months_ago ?? 0;
                            case 'rs_rating_6_months_ago': return item.rs_rating_6_months_ago ?? 0;
                            case 'rs_rating_1_year_ago': return item.rs_rating_1_year_ago ?? 0;
                            case 'industry': return item.industry.toLowerCase();
                            case 'sub_industry': return item.sub_industry.toLowerCase();
                            case 'approval_with_controls': return (item.approval_with_controls || '').toLowerCase();
                            case 'purge_amount': return item.purge_amount ?? 0;
                            case 'marginable_percent': return item.marginable_percent ?? 0;
                            default: return 0;
                        }
                    };
                    const aV = getVal(a), bV = getVal(b);
                    if (aV === bV) continue;
                    if (typeof aV === 'string') {
                        const cmp = aV.localeCompare(bV);
                        if (cmp !== 0) return config.direction === 'asc' ? cmp : -cmp;
                    } else {
                        const diff = Number(aV) - Number(bV);
                        if (diff !== 0) return config.direction === 'asc' ? diff : -diff;
                    }
                }
                return 0;
            });

            cache[groupName] = filtered;
        }

        return cache;
    }, [stocksCache, stockFilters, stockSortConfigs, filters.industry, filters.sub_industry, rsMomentumFilters, checkStockRange]);

    const getFilteredStocks = useCallback((groupName: string): StockSummary[] => {
        return filteredStocksCache[groupName] || [];
    }, [filteredStocksCache]);

    const filterOptions = useMemo(() => {
        const sectors = new Set<string>();
        const industryGroups = new Set<string>();
        const industries = new Set<string>();
        const subIndustries = new Set<string>();
        data.forEach(item => {
            if (item.sector) sectors.add(item.sector);
            if (item.industry_group) industryGroups.add(item.industry_group);
        });
        Object.values(stocksCache).forEach(stocks => stocks.forEach(stock => {
            if (stock.industry) industries.add(stock.industry);
            if (stock.sub_industry) subIndustries.add(stock.sub_industry);
        }));
        return {
            sectors: Array.from(sectors).sort(),
            industryGroups: Array.from(industryGroups).sort(),
            industries: Array.from(industries).sort(),
            subIndustries: Array.from(subIndustries).sort(),
        };
    }, [data, stocksCache]);

    const activeFilters = useMemo(() => {
        const active: Array<{ label: string; value: string; key: keyof FilterState }> = [];
        if (filters.sector.length > 0) active.push({ label: 'Sectors', value: filters.sector.join(', '), key: 'sector' });
        if (filters.industry_group.length > 0) active.push({ label: 'Industry Groups', value: filters.industry_group.join(', '), key: 'industry_group' });
        if (filters.industry.length > 0) active.push({ label: 'Industries', value: filters.industry.join(', '), key: 'industry' });
        if (filters.sub_industry.length > 0) active.push({ label: 'Sub Industries', value: filters.sub_industry.join(', '), key: 'sub_industry' });
        if (filters.letter_grade.length > 0) active.push({ label: 'Letter Grade', value: filters.letter_grade.join(', '), key: 'letter_grade' });
        if (filters.number_of_stocks_min || filters.number_of_stocks_max) active.push({ label: 'Num Stocks', value: `${filters.number_of_stocks_min || 'Min'} - ${filters.number_of_stocks_max || 'Max'}`, key: 'number_of_stocks_min' });
        if (filters.rank_min || filters.rank_max) active.push({ label: 'Rank', value: `${filters.rank_min || 'Min'} - ${filters.rank_max || 'Max'}`, key: 'rank_min' });
        if (filters.rank_1_week_ago_min || filters.rank_1_week_ago_max) active.push({ label: 'Rank 1W Ago', value: `${filters.rank_1_week_ago_min || 'Min'} - ${filters.rank_1_week_ago_max || 'Max'}`, key: 'rank_1_week_ago_min' });
        if (filters.rank_3_months_ago_min || filters.rank_3_months_ago_max) active.push({ label: 'Rank 3M Ago', value: `${filters.rank_3_months_ago_min || 'Min'} - ${filters.rank_3_months_ago_max || 'Max'}`, key: 'rank_3_months_ago_min' });
        if (filters.rank_6_months_ago_min || filters.rank_6_months_ago_max) active.push({ label: 'Rank 6M Ago', value: `${filters.rank_6_months_ago_min || 'Min'} - ${filters.rank_6_months_ago_max || 'Max'}`, key: 'rank_6_months_ago_min' });
        if (filters.ytd_change_percent_min || filters.ytd_change_percent_max) active.push({ label: '% Chg YTD', value: `${filters.ytd_change_percent_min || 'Min'} - ${filters.ytd_change_percent_max || 'Max'}`, key: 'ytd_change_percent_min' });
        if (filters.market_value_min || filters.market_value_max) active.push({ label: 'Market Value', value: `${filters.market_value_min || 'Min'} - ${filters.market_value_max || 'Max'}`, key: 'market_value_min' });
        if (filters.change_vs_last_week_min || filters.change_vs_last_week_max) active.push({ label: 'Change v last week', value: `${filters.change_vs_last_week_min || 'Min'} - ${filters.change_vs_last_week_max || 'Max'}`, key: 'change_vs_last_week_min' });
        return active;
    }, [filters]);

    const handleSort = useCallback((key: string) => {
        setSortConfigs(prev => {
            const idx = prev.findIndex(c => c.key === key);
            if (idx === -1) return [...prev, { key, direction: 'asc' }];
            if (prev[idx].direction === 'asc') { const n = [...prev]; n[idx] = { ...n[idx], direction: 'desc' }; return n; }
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    const handleStockSort = useCallback((groupName: string, key: string) => {
        setStockSortConfigs(prev => {
            const cur = prev[groupName] || [];
            const idx = cur.findIndex(c => c.key === key);
            if (idx === -1) return { ...prev, [groupName]: [...cur, { key, direction: 'asc' }] };
            if (cur[idx].direction === 'asc') { const n = [...cur]; n[idx] = { ...n[idx], direction: 'desc' }; return { ...prev, [groupName]: n }; }
            return { ...prev, [groupName]: cur.filter((_, i) => i !== idx) };
        });
    }, []);

    const toggleGroup = useCallback(async (groupName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) { next.delete(groupName); return next; }
            next.add(groupName);
            if (!stocksCache[groupName]) fetchGroupStocks(groupName);
            return next;
        });
    }, [stocksCache, fetchGroupStocks]);

    // FIX #2: Fixed race condition - now using ref which is always up to date
    const expandAllGroups = useCallback(async () => {
        const allGroups = filteredData.map(item => item.industry_group);
        setExpandedGroups(new Set(allGroups));
        // Now using loadingStocksRef.current which always has current state
        const toFetch = allGroups.filter(g => !stocksCache[g] && !loadingStocksRef.current.has(g));
        await Promise.all(toFetch.map(g => fetchGroupStocks(g)));
    }, [filteredData, stocksCache, fetchGroupStocks]);

    const collapseAllGroups = useCallback(() => setExpandedGroups(new Set()), []);

    const clearFilter = useCallback((key: keyof FilterState) => {
        if (Array.isArray(filters[key])) {
            setFilters(prev => ({ ...prev, [key]: [] }));
        } else {
            const base = (key as string).replace(/(_min|_max)$/, '');
            setFilters(prev => ({ ...prev, [`${base}_min`]: '', [`${base}_max`]: '' }));
        }
    }, [filters, setFilters]);

    const clearAllFilters = useCallback(() => {
        setFiltersState(DEFAULT_FILTERS);
        setStockFiltersState(DEFAULT_STOCK_FILTERS);
        setSortConfigs([]);
        setStockSortConfigs({});
        setRsMomentumFilters([]);
        router.replace(pathname, { scroll: false });
    }, [router, pathname]);

    // ── Automated "Install Report PDF" preset ────────────────────────────────
    // Applies, in one shot, the exact filter/sort combo requested for the report:
    //   1) Sort by Industry Group Rank ascending (priority 1)
    //   2) Sort by Change vs Last Week ascending (priority 2)
    //   3) Min RS Rating = 70
    //   4) Sparkline Trend = Rising
    //   5) Shariah Status = Compliant (متوافقة مع الضوابط) only
    // Then expands all groups so the PDF export (triggered separately, once
    // everything has finished loading) reflects exactly this view.
    const generateReport = useCallback(() => {
        setFiltersState(DEFAULT_FILTERS);
        setSortConfigs([
            { key: 'rank', direction: 'asc' },
            { key: 'change_vs_last_week', direction: 'asc' },
        ]);
        setStockSortConfigs({});
        setRsMomentumFilters([]);
        setStockFiltersState({
            ...DEFAULT_STOCK_FILTERS,
            rs_rating_min: '70',
            sparkline_trend: 'rising',
            approval_with_controls: shariahOptions.includes(SHARIAH_COMPLIANT_RAW)
                ? [SHARIAH_COMPLIANT_RAW]
                : [],
        });
        reportExpandTriggeredRef.current = false;
        setIsGeneratingReport(true);
    }, [shariahOptions]);

    // Once the report preset has produced filtered groups, auto-expand them all
    // (mirrors the manual "Expand All Groups" action).
    useEffect(() => {
        if (isGeneratingReport && !reportExpandTriggeredRef.current && filteredData.length > 0) {
            reportExpandTriggeredRef.current = true;
            expandAllGroups();
        }
    }, [isGeneratingReport, filteredData, expandAllGroups]);

    // 2026-10-25: the mount-once ?autoReport=true effect and its generateReportRef /
    // dataRef were deleted along with app/api/generate-weekly-report. Nothing else
    // read that URL param, so the page now exports only when the user asks.

    return {
        data, isLoading, error, stats,
        filters, setFilters,
        stockFilters, setStockFilters,
        rsMomentumFilters, toggleRsMomentumFilter,
        expandedGroups, toggleGroup, expandAllGroups, collapseAllGroups,
        stocksCache, loadingStocks: loadingStocksUI, // Expose UI state
        sortConfigs, handleSort,
        stockSortConfigs, handleStockSort,
        filteredData, getFilteredStocks,
        filterOptions, activeFilters,
        clearFilter, clearAllFilters,
        shariahOptions,
        isGeneratingReport, setIsGeneratingReport, generateReport,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getRSHeatmapStyle(value: number | null | undefined, rowMin: number, rowMax: number): React.CSSProperties {
    if (value == null) return {};
    const [r, g, b] = interpolateRSColor(value, rowMin, rowMax);
    const range = rowMax - rowMin;
    const pct = range === 0 ? 0.5 : (value - rowMin) / range;
    const textColor = pct < 0.25 || pct > 0.72 ? '#ffffff' : '#1a1a1a';
    return { backgroundColor: `rgb(${r},${g},${b})`, color: textColor };
}

function getRSRgb(value: number, rowMin: number, rowMax: number): [number, number, number] {
    return interpolateRSColor(value, rowMin, rowMax);
}

function getRSRowExtremes(stock: StockSummary): { rowMin: number; rowMax: number } {
    const vals = [
        stock.rs_rating, stock.rs_rating_1_week_ago, stock.rs_rating_4_weeks_ago,
        stock.rs_rating_3_months_ago, stock.rs_rating_6_months_ago, stock.rs_rating_1_year_ago,
    ].filter((v): v is number => v != null);
    if (vals.length === 0) return { rowMin: 0, rowMax: 100 };
    return { rowMin: Math.min(...vals), rowMax: Math.max(...vals) };
}

const formatNumber = (num: number, decimals = 2) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function RSSparkline({ stock }: { stock: StockSummary }) {
    const values = [
        stock.rs_rating_1_year_ago,
        stock.rs_rating_6_months_ago,
        stock.rs_rating_3_months_ago,
        stock.rs_rating_4_weeks_ago,
        stock.rs_rating_1_week_ago,
        stock.rs_rating,
    ].filter((v): v is number => v != null);

    if (values.length < 2) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const W = 54, H = 22, PAD = 3;
    const innerH = H - PAD * 2;
    const step = (W - PAD * 2) / (values.length - 1);

    const pts = values.map((v, i) => ({
        x: PAD + i * step,
        y: PAD + innerH - ((v - min) / range) * innerH,
    }));

    const linePath = pts.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
        const prev = pts[i - 1];
        const cpx = ((prev.x + pt.x) / 2).toFixed(2);
        return `${acc} C ${cpx} ${prev.y.toFixed(2)} ${cpx} ${pt.y.toFixed(2)} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, '');

    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${H} L ${pts[0].x.toFixed(2)} ${H} Z`;

    const isRising = values[values.length - 1] >= values[0];
    const stroke = isRising ? '#16a34a' : '#dc2626';
    const gradFill = isRising ? '#86efac' : '#fca5a5';
    const lastPt = pts[pts.length - 1];
    const gradId = `sg-${stock.symbol}`;

    return (
        <svg
            width={W} height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="inline-block ml-1.5 align-middle flex-shrink-0"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradFill} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={gradFill} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={lastPt.x} cy={lastPt.y} r="2.8" fill="white" />
            <circle cx={lastPt.x} cy={lastPt.y} r="2" fill={stroke} />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANK CHANGE INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function RankChangeIndicator({ value }: { value: number | undefined | null }) {
    if (value === undefined || value === null) return <span className="text-gray-400">-</span>;
    if (value === 0) return <span className="text-gray-500 font-medium">0</span>;
    const isUp = value > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-xs">{isUp ? '▲' : '▼'}</span>
            {isUp ? '+' : ''}{value}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CustomMultiSelect({ options, selected, onChange, placeholder, icon: Icon }: {
    options: string[]; selected: string[]; onChange: (values: string[]) => void; placeholder: string; icon?: any;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all hover:border-gray-300 text-left flex items-center justify-between min-h-[42px]">
                <div className="flex items-center w-full">
                    {Icon && <Icon className="absolute left-3 w-4 h-4 text-gray-400" />}
                    <div className="flex flex-col items-start truncate w-full">
                        <span className="font-medium text-gray-700 text-xs">{placeholder}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selected.length === 0 ? <span className="text-gray-400 text-xs">All</span> : (
                                <>
                                    {selected.slice(0, 2).map(item => <span key={item} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full">{item}</span>)}
                                    {selected.length > 2 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">+{selected.length - 2}</span>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-700">Selected: {selected.length}</span>
                            {selected.length > 0 && <button type="button" onClick={() => onChange([])} className="text-xs text-red-600 hover:text-red-800">Clear All</button>}
                        </div>
                        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus />
                    </div>
                    <div className="overflow-y-auto max-h-60 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(option => (
                            <button key={option} type="button"
                                onClick={() => onChange(selected.includes(option) ? selected.filter(i => i !== option) : [...selected, option])}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${selected.includes(option) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                                <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center flex-shrink-0 ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                    {selected.includes(option) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="truncate">{option}</span>
                            </button>
                        )) : <div className="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterAccordion({ title, children, defaultOpen = false, collapseSignal = 0 }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean; collapseSignal?: number;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    useEffect(() => { if (collapseSignal > 0) setIsOpen(false); }, [collapseSignal]);
    return (
        <div className="border-b border-gray-200 pb-3">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-2 text-xs font-semibold text-gray-700 hover:text-gray-900">
                <span>{title}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="mt-2 space-y-3">{children}</div>}
        </div>
    );
}

function RangeFilter({ label, minValue, maxValue, onMinChange, onMaxChange, minPlaceholder = "Min", maxPlaceholder = "Max" }: {
    label: string; minValue: string; maxValue: string;
    onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
    minPlaceholder?: string; maxPlaceholder?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-medium text-gray-600">{label}</label>
            <div className="flex space-x-2">
                <input type="number" placeholder={minPlaceholder} value={minValue} onChange={e => onMinChange(e.target.value)}
                    className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none" />
                <span className="self-center text-[10px] text-gray-400">-</span>
                <input type="number" placeholder={maxPlaceholder} value={maxValue} onChange={e => onMaxChange(e.target.value)}
                    className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none" />
            </div>
        </div>
    );
}

function ActiveFilterBadge({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
            {label}: {value}
            <button onClick={onRemove} className="ml-1 text-blue-500 hover:text-blue-700">×</button>
        </span>
    );
}

function SortIndicator({ sortConfigs, colKey }: { sortConfigs: SortConfig[]; colKey: string }) {
    const idx = sortConfigs.findIndex(c => c.key === colKey);
    if (idx === -1) return <span className="text-[10px] text-gray-400 opacity-50 block leading-[8px] ml-1">▲<br />▼</span>;
    return (
        <span className="flex items-center ml-1 gap-0.5">
            <span className="text-xs font-bold">{sortConfigs[idx].direction === 'asc' ? '▲' : '▼'}</span>
            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full">{idx + 1}</span>
        </span>
    );
}

function getLetterGradeClass(grade?: string) {
    switch (grade) {
        case 'A+': return 'bg-green-100 text-green-800 ring-1 ring-green-300';
        case 'A': return 'bg-green-50 text-green-700';
        case 'B': return 'bg-blue-50 text-blue-700';
        case 'C': return 'bg-yellow-50 text-yellow-700';
        case 'D': return 'bg-orange-50 text-orange-700';
        default: return 'bg-red-50 text-red-700';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE TREND FILTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function SparklineTrendFilter({
    value,
    onChange,
}: {
    value: 'all' | 'rising' | 'falling';
    onChange: (v: 'all' | 'rising' | 'falling') => void;
}) {
    const options: { val: 'all' | 'rising' | 'falling'; label: string }[] = [
        { val: 'all', label: 'All' },
        { val: 'rising', label: 'Rising' },
        { val: 'falling', label: 'Falling' },
    ];

    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                Sparkline Trend
            </label>
            <div className="flex gap-1.5">
                {options.map(opt => {
                    const isActive = value === opt.val;
                    const activeClass =
                        opt.val === 'rising'
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : opt.val === 'falling'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm';
                    return (
                        <button
                            key={opt.val}
                            type="button"
                            onClick={() => onChange(opt.val)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg border transition-all duration-150 ${isActive
                                ? activeClass
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <span>{opt.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

function buildExport(
    filteredData: IndustryGroup[],
    expandedGroups: Set<string>,
    stocksCache: Record<string, StockSummary[]>,
    getFilteredStocks: (g: string) => StockSummary[],
) {
    const groupHeaders = ['Order', 'Letter Grade', 'Industry Group', 'Sector', 'Num Stocks', 'Ind Group Rank', 'Last Week', '3 Mo Ago', '6 Mo Ago', '% Chg YTD', 'Ind Mkt Val (Bil)', 'Change v Last Week', '# of stocks > 20MA', '% of stocks > 20MA', '# of stocks > 50MA', '% of stocks > 50MA', '# of stocks > 150MA', '% of stocks > 150MA', '# of stocks > 200MA', '% of stocks > 200MA'];
    const groupRows = filteredData.map((item, i) => [
        i + 1, item.letter_grade || '', item.industry_group, item.sector, item.number_of_stocks,
        item.rank ?? '', item.rank_1_week_ago ?? '-', item.rank_3_months_ago ?? '-', item.rank_6_months_ago ?? '-',
        item.ytd_change_percent != null ? item.ytd_change_percent.toFixed(2) : '-',
        item.market_value ? item.market_value.toFixed(2) : '-', item.change_vs_last_week ?? '-',
        item.count_above_ma20 != null ? item.count_above_ma20 : '-',
        item.percent_above_ma20 != null ? `${item.percent_above_ma20}%` : '-',
        item.count_above_ma50 != null ? item.count_above_ma50 : '-',
        item.percent_above_ma50 != null ? `${item.percent_above_ma50}%` : '-',
        item.count_above_ma150 != null ? item.count_above_ma150 : '-',
        item.percent_above_ma150 != null ? `${item.percent_above_ma150}%` : '-',
        item.count_above_ma200 != null ? item.count_above_ma200 : '-',
        item.percent_above_ma200 != null ? `${item.percent_above_ma200}%` : '-',
    ]);
    const stockHeaders = ['Symbol', 'Name', 'RS Rating', '1W Ago', '4W Ago', '3M Ago', '6M Ago', '1Y Ago', 'Industry', 'Sub Industry', 'Shariah Status', 'Purge Amount', 'Marginable %'];
    const RS_KEYS: (keyof StockSummary)[] = ['rs_rating', 'rs_rating_1_week_ago', 'rs_rating_4_weeks_ago', 'rs_rating_3_months_ago', 'rs_rating_6_months_ago', 'rs_rating_1_year_ago'];

    return { groupHeaders, groupRows, stockHeaders, RS_KEYS };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function IndustryGroupsContent() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [collapseSignal, setCollapseSignal] = useState(0);


    const {
        data, isLoading, error, stats,
        filters, setFilters,
        stockFilters, setStockFilters,
        rsMomentumFilters, toggleRsMomentumFilter,
        expandedGroups, toggleGroup, expandAllGroups, collapseAllGroups,
        stocksCache, loadingStocks,
        sortConfigs, handleSort,
        stockSortConfigs, handleStockSort,
        filteredData, getFilteredStocks,
        filterOptions, activeFilters,
        clearFilter, clearAllFilters,
        shariahOptions,
        isGeneratingReport, setIsGeneratingReport, generateReport,
    } = useIndustryGroups();
    // (clearAllFilters and collapseAllGroups are already destructured above and
    // reused here to reset the view after the report PDF has been generated.)

    const handleRowKeyDown = useCallback((e: React.KeyboardEvent, groupName: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleGroup(groupName);
        }
    }, [toggleGroup]);

    // FIX #8: PDF export now only exports expanded groups, no main summary table
    const exportData = useCallback((format: 'csv' | 'xls' | 'xlsx' | 'txt' | 'pdf') => {
        if (filteredData.length === 0) return;
        const { groupHeaders, groupRows, stockHeaders, RS_KEYS } = buildExport(filteredData, expandedGroups, stocksCache, getFilteredStocks);

        if (format === 'pdf') {
            import('jspdf').then(jsPDF => {
                import('jspdf-autotable').then(autoTable => {
                    try {
                        const doc = new jsPDF.default({ orientation: 'landscape' });
                        const pageWidth = doc.internal.pageSize.getWidth();

                        let hasAnyExpandedGroup = false;
                        let currentY = 20; // تتبع الـ Y الحالية يدوياً

                        // FIX #8a & #8b: Iterate only over expanded groups that have stocks loaded
                        for (const group of filteredData) {
                            if (!expandedGroups.has(group.industry_group)) continue;
                            if (!stocksCache[group.industry_group]) continue;

                            const stocks = getFilteredStocks(group.industry_group);
                            if (stocks.length === 0) continue;

                            hasAnyExpandedGroup = true;

                            // التحقق من وجود مساحة كافية في الصفحة الحالية (للهيدر + رأس الجدول + صف واحد على الأقل)
                            const pageHeight = doc.internal.pageSize.getHeight();
                            if (currentY + 35 > pageHeight) {
                                doc.addPage();
                                currentY = 20;
                            }

                            // FIX #8c: Add styled group header
                            doc.setFillColor(52, 73, 94);
                            doc.setDrawColor(52, 73, 94);
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(255, 255, 255);
                            doc.rect(14, currentY, pageWidth - 28, 10, 'F');
                            doc.text(`${group.industry_group} (Rank: ${group.rank})`, 18, currentY + 7);

                            currentY += 12; // زيادة الـ Y بعد الهيدر

                            // Stock sub-table
                            const sRows = stocks.map(stock => [
                                stock.symbol, stock.company_name, stock.rs_rating ?? '-', stock.rs_rating_1_week_ago ?? '-',
                                stock.rs_rating_4_weeks_ago ?? '-', stock.rs_rating_3_months_ago ?? '-',
                                stock.rs_rating_6_months_ago ?? '-', stock.rs_rating_1_year_ago ?? '-',
                                stock.industry, stock.sub_industry,
                                formatShariahApproval(stock.approval_with_controls), formatPurgeAmount(stock.purge_amount), formatMarginable(stock.marginable_percent),
                            ]);

                            autoTable.default(doc, {
                                startY: currentY,
                                head: [stockHeaders],
                                body: sRows,
                                theme: 'striped',
                                styles: { fontSize: 8 },
                                headStyles: { fillColor: [41, 128, 185] },
                                didParseCell: (data) => {
                                    if (data.section !== 'body' || data.column.index < 2 || data.column.index > 7) return;
                                    const stock = stocks[data.row.index];
                                    if (!stock) return;
                                    const rsKey = RS_KEYS[data.column.index - 2];
                                    const value = stock[rsKey] as number | null | undefined;
                                    if (value == null) return;
                                    const { rowMin, rowMax } = getRSRowExtremes(stock);
                                    const [r, g, b] = getRSRgb(value, rowMin, rowMax);
                                    data.cell.styles.fillColor = [r, g, b];
                                    data.cell.styles.fontStyle = 'bold';
                                    data.cell.styles.halign = 'center';
                                    const range = rowMax - rowMin;
                                    const pct = range === 0 ? 0.5 : (value - rowMin) / range;
                                    data.cell.styles.textColor = pct < 0.25 || pct > 0.72 ? [255, 255, 255] : [26, 26, 26];
                                },
                            });

                            // تحديث الـ Y الحالية بعد الجدول
                            const lastAutoTable = (doc as any).lastAutoTable;
                            if (lastAutoTable) {
                                currentY = lastAutoTable.finalY + 10; // إضافة مسافة 10 وحدات بين المجموعات
                            } else {
                                currentY += 10;
                            }
                        }

                        // FIX #8d: Show message if no groups are expanded
                        if (!hasAnyExpandedGroup) {
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(0, 0, 0);
                            doc.text('No expanded groups to export. Please expand at least one industry group before exporting.', 14, 20);
                        }

                        doc.save(`industry_groups_stocks_${new Date().toISOString().split('T')[0]}.pdf`);
                    } catch (err) {
                        console.error('jsPDF execution error', err);
                    }
                }).catch(err => {
                    console.error('Failed to load jspdf-autotable', err);
                });
            }).catch(err => {
                console.error('Failed to load jspdf', err);
            });
            return;
        }

        const expandedStockTables: { title: string; rows: any[][] }[] = [];
        filteredData.forEach(item => {
            if (expandedGroups.has(item.industry_group) && stocksCache[item.industry_group]) {
                const stocks = getFilteredStocks(item.industry_group);
                if (stocks.length > 0) {
                    expandedStockTables.push({
                        title: `Stocks in ${item.industry_group}`,
                        rows: stocks.map(stock => [
                            stock.symbol, stock.company_name, stock.rs_rating ?? '-', stock.rs_rating_1_week_ago ?? '-',
                            stock.rs_rating_4_weeks_ago ?? '-', stock.rs_rating_3_months_ago ?? '-',
                            stock.rs_rating_6_months_ago ?? '-', stock.rs_rating_1_year_ago ?? '-',
                            stock.industry, stock.sub_industry,
                            formatShariahApproval(stock.approval_with_controls), formatPurgeAmount(stock.purge_amount), formatMarginable(stock.marginable_percent),
                        ]),
                    });
                }
            }
        });

        // For non-PDF exports, include group data plus expanded stock tables
        const allRows: any[][] = [groupHeaders, ...groupRows];
        expandedStockTables.forEach(t => { allRows.push([], [t.title], stockHeaders, ...t.rows); });

        if (format === 'csv' || format === 'txt') {
            const sep = format === 'csv' ? ',' : '\t';
            const esc = (v: any) => { if (v == null) return ''; const s = String(v); return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };
            const content = allRows.map(row => row.map(esc).join(sep)).join('\n');
            const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `industry_groups_${new Date().toISOString().split('T')[0]}.${format}`; link.style.visibility = 'hidden';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            return;
        }
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Industry Groups');
        XLSX.writeFile(wb, `industry_groups_${new Date().toISOString().split('T')[0]}.${format}`);
    }, [filteredData, expandedGroups, stocksCache, getFilteredStocks]);

    // ── Auto-trigger the PDF export once the report preset has fully expanded
    // and loaded every group's stocks. Runs only while isGeneratingReport is true.
    // Once the PDF is generated, reset every filter/sort back to default so the
    // report preset doesn't linger in the UI or the URL.
    useEffect(() => {
        if (!isGeneratingReport || filteredData.length === 0) return;

        const allExpanded = filteredData.every(g => expandedGroups.has(g.industry_group));
        const allLoaded = filteredData.every(
            g => stocksCache[g.industry_group] && !loadingStocks.has(g.industry_group)
        );

        if (allExpanded && allLoaded) {
            exportData('pdf');
            setIsGeneratingReport(false);

            // 2026-10-25: the ?autoReport=true escape hatch went with the deleted
            // Puppeteer route — the report preset now always resets after exporting.
            clearAllFilters();
            collapseAllGroups();
        }
    }, [isGeneratingReport, filteredData, expandedGroups, stocksCache, loadingStocks, exportData, setIsGeneratingReport, clearAllFilters, collapseAllGroups]);

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <h2 className="mt-4 text-lg font-semibold text-gray-700">Loading Industry Groups...</h2>
                <p className="text-gray-500">Please wait</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center text-red-600">
                <h2 className="text-lg font-semibold">Error fetching data</h2>
                <p>{error}</p>
            </div>
        </div>
    );

    if (data.length === 0) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center text-gray-500">
                <h2 className="text-lg font-semibold">No Data Available</h2>
                <p>No industry group data found</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <style jsx global>{`
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e0 #f7fafc; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f7fafc; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #a0aec0; }
                .sticky-col { position: sticky; left: 0; z-index: 10; }
                .sticky-col-2 { position: sticky; left: 32px; z-index: 10; }
            `}</style>

            <div className="flex relative">
                {/* ── Sidebar ───────────────────────────────────────────────── */}
                <div className={`bg-white border-r border-gray-200 h-[calc(100vh-64px)] flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 overflow-hidden opacity-0 pointer-events-none'}`}>

                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white relative">
                        <button onClick={() => setShowExportMenu(!showExportMenu)}
                            className="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-all">
                            <Download className="w-4 h-4" /><span>Export Data</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 py-1">
                                {[
                                    { fmt: 'pdf', color: 'bg-red-500', label: 'PDF Document (.pdf)' },
                                    { fmt: 'csv', color: 'bg-green-500', label: 'Comma delimited (.csv)' },
                                    { fmt: 'xls', color: 'bg-blue-500', label: 'Excel 97-2003 (.xls)' },
                                    { fmt: 'xlsx', color: 'bg-green-600', label: 'Excel (.xlsx)' },
                                    { fmt: 'txt', color: 'bg-gray-500', label: 'Text (.txt)' },
                                ].map(({ fmt, color, label }) => (
                                    <button key={fmt} onClick={() => { exportData(fmt as any); setShowExportMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                                        <span className={`w-2 h-2 ${color} rounded-full`} /><span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={generateReport}
                            disabled={isGeneratingReport}
                            className="w-full mt-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            <span>{isGeneratingReport ? 'Generating Report...' : 'Install Report PDF'}</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <FilterAccordion title="INDUSTRY FILTERS" defaultOpen={true} collapseSignal={collapseSignal}>
                            <div className="space-y-3">
                                <CustomMultiSelect options={filterOptions.sectors} selected={filters.sector} onChange={v => setFilters(p => ({ ...p, sector: v }))} placeholder="Sectors" icon={Filter} />
                                <CustomMultiSelect options={filterOptions.industryGroups} selected={filters.industry_group} onChange={v => setFilters(p => ({ ...p, industry_group: v }))} placeholder="Industry Groups" icon={Filter} />
                                <CustomMultiSelect options={filterOptions.industries} selected={filters.industry} onChange={v => setFilters(p => ({ ...p, industry: v }))} placeholder="Industries" icon={Filter} />
                                <CustomMultiSelect options={filterOptions.subIndustries} selected={filters.sub_industry} onChange={v => setFilters(p => ({ ...p, sub_industry: v }))} placeholder="Sub Industries" icon={Filter} />
                            </div>
                        </FilterAccordion>

                        <FilterAccordion title="MAIN TABLE FILTERS" defaultOpen={false} collapseSignal={collapseSignal}>
                            <div className="space-y-4">
                                <CustomMultiSelect options={LETTER_GRADE_OPTIONS} selected={filters.letter_grade} onChange={v => setFilters(p => ({ ...p, letter_grade: v }))} placeholder="Letter Grade" icon={Filter} />
                                <RangeFilter label="Number of Stocks" minValue={filters.number_of_stocks_min} maxValue={filters.number_of_stocks_max} onMinChange={v => setFilters(p => ({ ...p, number_of_stocks_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, number_of_stocks_max: v }))} />
                                <RangeFilter label="Rank" minValue={filters.rank_min} maxValue={filters.rank_max} onMinChange={v => setFilters(p => ({ ...p, rank_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, rank_max: v }))} />
                                <RangeFilter label="Rank 1 Week Ago" minValue={filters.rank_1_week_ago_min} maxValue={filters.rank_1_week_ago_max} onMinChange={v => setFilters(p => ({ ...p, rank_1_week_ago_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, rank_1_week_ago_max: v }))} />
                                <RangeFilter label="Rank 3 Months Ago" minValue={filters.rank_3_months_ago_min} maxValue={filters.rank_3_months_ago_max} onMinChange={v => setFilters(p => ({ ...p, rank_3_months_ago_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, rank_3_months_ago_max: v }))} />
                                <RangeFilter label="Rank 6 Months Ago" minValue={filters.rank_6_months_ago_min} maxValue={filters.rank_6_months_ago_max} onMinChange={v => setFilters(p => ({ ...p, rank_6_months_ago_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, rank_6_months_ago_max: v }))} />
                                <RangeFilter label="YTD Change %" minValue={filters.ytd_change_percent_min} maxValue={filters.ytd_change_percent_max} onMinChange={v => setFilters(p => ({ ...p, ytd_change_percent_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, ytd_change_percent_max: v }))} />
                                <RangeFilter label="Market Value (Bil)" minValue={filters.market_value_min} maxValue={filters.market_value_max} onMinChange={v => setFilters(p => ({ ...p, market_value_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, market_value_max: v }))} />
                                <RangeFilter label="Change vs Last Week" minValue={filters.change_vs_last_week_min} maxValue={filters.change_vs_last_week_max} onMinChange={v => setFilters(p => ({ ...p, change_vs_last_week_min: v }))} onMaxChange={v => setFilters(p => ({ ...p, change_vs_last_week_max: v }))} />
                            </div>
                        </FilterAccordion>

                        <FilterAccordion title="STOCKS TABLE FILTERS" defaultOpen={false} collapseSignal={collapseSignal}>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-medium text-gray-600">Symbol</label>
                                    <input type="text" placeholder="Search symbol..." value={stockFilters.symbol} onChange={e => setStockFilters(p => ({ ...p, symbol: e.target.value }))} className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-medium text-gray-600">Company Name</label>
                                    <input type="text" placeholder="Search company..." value={stockFilters.company_name} onChange={e => setStockFilters(p => ({ ...p, company_name: e.target.value }))} className="w-full px-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <RangeFilter label="RS Rating" minValue={stockFilters.rs_rating_min} maxValue={stockFilters.rs_rating_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_max: v }))} />
                                <RangeFilter label="RS Rating 1 Week Ago" minValue={stockFilters.rs_rating_1_week_ago_min} maxValue={stockFilters.rs_rating_1_week_ago_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_1_week_ago_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_1_week_ago_max: v }))} />
                                <RangeFilter label="RS Rating 4 Weeks Ago" minValue={stockFilters.rs_rating_4_weeks_ago_min} maxValue={stockFilters.rs_rating_4_weeks_ago_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_4_weeks_ago_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_4_weeks_ago_max: v }))} />
                                <RangeFilter label="RS Rating 3 Months Ago" minValue={stockFilters.rs_rating_3_months_ago_min} maxValue={stockFilters.rs_rating_3_months_ago_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_3_months_ago_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_3_months_ago_max: v }))} />
                                <RangeFilter label="RS Rating 6 Months Ago" minValue={stockFilters.rs_rating_6_months_ago_min} maxValue={stockFilters.rs_rating_6_months_ago_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_6_months_ago_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_6_months_ago_max: v }))} />
                                <RangeFilter label="RS Rating 1 Year Ago" minValue={stockFilters.rs_rating_1_year_ago_min} maxValue={stockFilters.rs_rating_1_year_ago_max} onMinChange={v => setStockFilters(p => ({ ...p, rs_rating_1_year_ago_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, rs_rating_1_year_ago_max: v }))} />

                                {/* RS Momentum */}
                                <div className="pt-2 border-t border-gray-100">
                                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 tracking-wider uppercase">RS Momentum Trend</h4>
                                    <div className="space-y-1.5">
                                        {RS_MOMENTUM_OPTIONS.map(option => {
                                            const isChecked = rsMomentumFilters.includes(option.key);
                                            return (
                                                <label key={option.key} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${isChecked ? 'bg-green-50 text-green-800 border border-green-200' : 'hover:bg-gray-50 text-gray-700 border border-transparent'}`}>
                                                    <input type="checkbox" checked={isChecked} onChange={() => toggleRsMomentumFilter(option.key)} className="w-3.5 h-3.5 accent-green-600 flex-shrink-0" />
                                                    <span className="font-medium">{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Sparkline Trend Filter ─────────────────────────────── */}
                                <div className="pt-2 border-t border-gray-100">
                                    <SparklineTrendFilter
                                        value={stockFilters.sparkline_trend}
                                        onChange={v => setStockFilters(p => ({ ...p, sparkline_trend: v }))}
                                    />
                                </div>

                                {/* Shariah & Margin */}
                                <div className="pt-2 border-t border-gray-100">
                                    <h4 className="text-[10px] font-bold text-gray-400 mb-3 tracking-wider uppercase">Shariah & Margin</h4>
                                    <div className="space-y-4">
                                        <CustomMultiSelect options={shariahOptions} selected={stockFilters.approval_with_controls} onChange={v => setStockFilters(p => ({ ...p, approval_with_controls: v }))} placeholder="Shariah Status" icon={Filter} />
                                        <RangeFilter label="Purge Amount" minValue={stockFilters.purge_amount_min} maxValue={stockFilters.purge_amount_max} onMinChange={v => setStockFilters(p => ({ ...p, purge_amount_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, purge_amount_max: v }))} />
                                        <RangeFilter label="Marginable %" minValue={stockFilters.marginable_percent_min} maxValue={stockFilters.marginable_percent_max} onMinChange={v => setStockFilters(p => ({ ...p, marginable_percent_min: v }))} onMaxChange={v => setStockFilters(p => ({ ...p, marginable_percent_max: v }))} />
                                    </div>
                                </div>
                            </div>
                        </FilterAccordion>
                    </div>

                    <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
                        <div className="flex flex-col space-y-2">
                            <button onClick={expandAllGroups} className="w-full px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                <span>Expand All Groups</span>
                            </button>
                            <button onClick={collapseAllGroups} className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <span>Collapse All Groups</span>
                            </button>
                            <button onClick={clearAllFilters} className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                <span>Reset All Filters</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar toggle */}
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-5 h-14 bg-white border border-gray-200 border-l-0 rounded-r-md shadow-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all duration-300 ease-in-out cursor-pointer outline-none focus:ring-0"
                    style={{ left: isSidebarOpen ? '320px' : '0px' }}
                    title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}>
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* ── Main content ───────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">

                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">
                                    Industry Groups: <span className="font-bold">{filteredData.length}</span> groups
                                    {activeFilters.length > 0 && <span className="text-blue-600 ml-2">• {activeFilters.length} filters active</span>}
                                </span>
                                <span className="text-sm text-gray-500">{data.length > 0 ? data[0].date : '-'}</span>
                            </div>
                        </div>
                        {(activeFilters.length > 0 || rsMomentumFilters.length > 0 || stockFilters.sparkline_trend !== 'all') && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {activeFilters.map((filter, i) => (
                                    <ActiveFilterBadge key={i} label={filter.label} value={filter.value} onRemove={() => clearFilter(filter.key)} />
                                ))}
                                {rsMomentumFilters.map(key => {
                                    const opt = RS_MOMENTUM_OPTIONS.find(o => o.key === key);
                                    if (!opt) return null;
                                    return (
                                        <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-300">
                                            {opt.label}
                                            <button onClick={() => toggleRsMomentumFilter(key)} className="ml-1 text-green-600 hover:text-green-900">×</button>
                                        </span>
                                    );
                                })}
                                {/* Sparkline trend active badge */}
                                {stockFilters.sparkline_trend !== 'all' && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border font-medium ${stockFilters.sparkline_trend === 'rising' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                                        {stockFilters.sparkline_trend === 'rising' ? '📈 Rising Trend' : '📉 Falling Trend'}
                                        <button onClick={() => setStockFilters(p => ({ ...p, sparkline_trend: 'all' }))} className="ml-1 hover:opacity-70">×</button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats cards */}
                    <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Top Performer</p>
                                        <p className="text-lg font-bold text-gray-900 truncate">{stats.topPerformer.group}</p>
                                        <p className="text-sm text-green-600 font-medium">+{formatNumber(stats.topPerformer.change)}%</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Worst Performer</p>
                                        <p className="text-lg font-bold text-gray-900 truncate">{stats.worstPerformer.group}</p>
                                        <p className="text-sm text-red-600 font-medium">{formatNumber(stats.worstPerformer.change)}%</p>
                                    </div>
                                    <TrendingDown className="w-8 h-8 text-red-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main table */}
                    <div className="flex-1 overflow-auto border-t border-gray-200 bg-white">
                        <table className="min-w-full bg-white text-sm border-separate border-spacing-0">
                            <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 w-8 bg-gray-50 sticky-col" />
                                    {COLUMN_DEFINITIONS.map(col => {
                                        const isSorted = sortConfigs.some(c => c.key === col.key);
                                        const isCenter = col.key.includes('rank') || col.key === 'number_of_stocks';
                                        const isRight = col.key === 'ytd_change_percent' || col.key === 'market_value';
                                        return (
                                            <th key={col.key}
                                                className={`px-4 py-3 font-medium text-gray-600 whitespace-nowrap transition-colors ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''} ${isCenter ? 'text-center' : isRight ? 'text-right' : ''} ${isSorted ? 'bg-blue-50 text-blue-900 border-b-2 border-b-blue-500' : ''}`}
                                                onClick={() => col.sortable && handleSort(col.key)}>
                                                <div className={`flex items-center ${isRight ? 'justify-end' : isCenter ? 'justify-center' : 'justify-start'}`}>
                                                    <span className="font-semibold">{col.label}</span>
                                                    {col.sortable && <SortIndicator sortConfigs={sortConfigs} colKey={col.key} />}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((item, index) => {
                                    const isExpanded = expandedGroups.has(item.industry_group);
                                    const filteredStocks = getFilteredStocks(item.industry_group);
                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr
                                                className={`hover:bg-blue-50/30 transition-colors cursor-pointer focus-within:bg-blue-50/30 outline-none ${isExpanded ? 'bg-blue-50/20' : ''}`}
                                                onClick={() => toggleGroup(item.industry_group)}
                                                onKeyDown={e => handleRowKeyDown(e, item.industry_group)}
                                                tabIndex={0}
                                                role="button"
                                                aria-expanded={isExpanded}
                                                aria-label={`${item.industry_group} — click to ${isExpanded ? 'collapse' : 'expand'}`}
                                            >
                                                <td className="px-4 py-3 text-center text-gray-400 bg-white sticky-col">
                                                    <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-700 text-center">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold min-w-[30px] text-center ${getLetterGradeClass(item.letter_grade)}`}>
                                                            {item.letter_grade || '-'}
                                                        </span>
                                                        <div>
                                                            <div className="font-medium text-blue-600 hover:underline">{item.industry_group}</div>
                                                            <div className="text-xs text-gray-400 mt-0.5">{item.sector}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">{item.number_of_stocks}</td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-800">{item.rank}</td>
                                                <td className="px-4 py-3 text-center">{item.rank_1_week_ago || '-'}</td>
                                                <td className="px-4 py-3 text-center">{item.rank_3_months_ago || '-'}</td>
                                                <td className="px-4 py-3 text-center">{item.rank_6_months_ago || '-'}</td>
                                                <td className={`px-4 py-3 text-right font-medium ${item.ytd_change_percent > 0 ? 'text-green-600' : item.ytd_change_percent < 0 ? 'text-red-600' : ''}`}>
                                                    {formatNumber(item.ytd_change_percent)}%
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {item.market_value > 0 ? formatNumber(item.market_value) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <RankChangeIndicator value={item.change_vs_last_week} />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.count_above_ma20 != null ? item.count_above_ma20 : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.percent_above_ma20 != null ? `${item.percent_above_ma20}%` : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.count_above_ma50 != null ? item.count_above_ma50 : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.percent_above_ma50 != null ? `${item.percent_above_ma50}%` : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.count_above_ma150 != null ? item.count_above_ma150 : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.percent_above_ma150 != null ? `${item.percent_above_ma150}%` : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.count_above_ma200 != null ? item.count_above_ma200 : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{item.percent_above_ma200 != null ? `${item.percent_above_ma200}%` : '-'}</td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-gray-50/70">
                                                    {/* FIX #4: Changed colSpan from 15 to 19 */}
                                                    <td colSpan={19} className="px-4 pb-4 pt-2">
                                                        <div className="bg-white rounded-lg border border-gray-200 p-4 ml-8 shadow-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h3 className="text-sm font-bold text-gray-700">Stocks in {item.industry_group}</h3>
                                                                <span className="text-xs text-gray-500">Showing {filteredStocks.length} of {stocksCache[item.industry_group]?.length || 0} stocks</span>
                                                            </div>

                                                            {loadingStocks.has(item.industry_group) ? (
                                                                <div className="text-center py-4 text-gray-500 text-sm">Loading stocks...</div>
                                                            ) : !stocksCache[item.industry_group] || stocksCache[item.industry_group].length === 0 ? (
                                                                <div className="text-center py-4 text-gray-500 text-sm">No stocks found in this group.</div>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="bg-gray-100 text-gray-500 font-medium border-b border-gray-200">
                                                                            <tr>
                                                                                {STOCK_COLUMN_DEFINITIONS.map(col => {
                                                                                    const cur = stockSortConfigs[item.industry_group] || [];
                                                                                    const isSorted = cur.some(c => c.key === col.key);
                                                                                    const isRatingCol = col.key.includes('rating');
                                                                                    return (
                                                                                        <th key={col.key}
                                                                                            className={`px-3 py-2 whitespace-nowrap transition-colors ${col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''} ${isRatingCol ? 'text-center' : 'text-left'} ${isSorted ? 'bg-blue-50 text-blue-900 border-b-2 border-b-blue-500' : ''}`}
                                                                                            onClick={() => col.sortable && handleStockSort(item.industry_group, col.key)}>
                                                                                            <div className={`flex items-center ${isRatingCol ? 'justify-center' : 'justify-start'}`}>
                                                                                                <span className="font-semibold">{col.label}</span>
                                                                                                {col.sortable && <SortIndicator sortConfigs={cur} colKey={col.key} />}
                                                                                            </div>
                                                                                        </th>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {filteredStocks.map(stock => {
                                                                                const { rowMin, rowMax } = getRSRowExtremes(stock);
                                                                                return (
                                                                                    <tr key={stock.symbol} className="hover:bg-blue-50/20 transition-colors">
                                                                                        <td className="px-2 py-1.5 font-medium text-blue-600 whitespace-nowrap">
                                                                                            <Link href={`/stocks/${stock.symbol}`} className="hover:underline">{stock.symbol}</Link>
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 max-w-[160px]" title={stock.company_name}>
                                                                                            <div className="flex items-center">
                                                                                                <span className="truncate">{stock.company_name}</span>
                                                                                                <RSSparkline stock={stock} />
                                                                                            </div>
                                                                                        </td>
                                                                                        {([
                                                                                            stock.rs_rating,
                                                                                            stock.rs_rating_1_week_ago,
                                                                                            stock.rs_rating_4_weeks_ago,
                                                                                            stock.rs_rating_3_months_ago,
                                                                                            stock.rs_rating_6_months_ago,
                                                                                            stock.rs_rating_1_year_ago,
                                                                                        ] as (number | undefined)[]).map((val, i) => (
                                                                                            <td key={i} className="px-2 py-1.5 text-center font-semibold rounded-sm" style={getRSHeatmapStyle(val, rowMin, rowMax)}>
                                                                                                {val ?? '-'}
                                                                                            </td>
                                                                                        ))}
                                                                                        <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{stock.industry}</td>
                                                                                        <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{stock.sub_industry}</td>
                                                                                        <td className="px-2 py-1.5 text-center text-gray-600 whitespace-nowrap">{formatShariahApproval(stock.approval_with_controls)}</td>
                                                                                        <td className="px-2 py-1.5 text-center text-gray-600">{formatPurgeAmount(stock.purge_amount)}</td>
                                                                                        <td className="px-2 py-1.5 text-center text-gray-600">{formatMarginable(stock.marginable_percent)}</td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function IndustryGroupsPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <IndustryGroupsContent />
        </React.Suspense>
    );
}