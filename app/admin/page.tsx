"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { triggerScraperAction } from './actions';
import { PipelineService, SystemMapService, PipelineStatus, PipelineMapEntry } from '@/lib/services/admin';

type Status = 'idle' | 'running' | 'success' | 'error';

const SCHEDULE = {
    daily: [
        { id: 'sp500', title: 'S&P 500 History', source: 'Yahoo Finance', url: '/api/economic-indicators/scrape/SP500', msg: '✅ S&P 500 started!', when: 'Every business day', file: 'sp500_scraper.py' },
        { id: 'treasury-gov', title: 'Treasury.gov Rates', source: 'Treasury.gov', url: '/api/economic-indicators/scrape/treasury-gov?mode=incremental', msg: '✅ Treasury.gov started!', when: 'Every business day', file: 'treasury_gov_scraper.py', note: 'Faster than FRED — same table' },
        { id: 'treasury-fred', title: 'Treasury Yield Curve', source: 'Treasury.gov', url: '/api/economic-indicators/scrape/yield-curve', msg: '✅ Treasury Yield Curve started!', when: 'Every business day', file: 'treasury_gov_scraper.py', note: 'Endpoint /scrape/yield-curve calls treasury_gov_scraper (verified in app/api/routes/economic_indicators.py) — there is no treasury_scraper.py' },
        { id: 'fred-all', title: 'All FRED Indicators', source: 'FRED API', url: '/api/economic-indicators/scrape', msg: '✅ All FRED indicators started!', when: 'Every business day', file: 'fred_scraper.py', note: 'Fetches all configured codes automatically' },
        { id: 'eurodollar', title: 'Eurodollar Futures', source: 'Investing.com', url: '/api/economic-indicators/scrape/eurodollar-futures', msg: '✅ Eurodollar started!', when: 'Every business day', file: 'eurodollar_scraper.py', snapshot: true },
        { id: 'cme', title: 'CME FedWatch', source: 'CME Group', url: '/api/economic-indicators/scrape/cme-fedwatch', msg: '✅ CME FedWatch started!', when: 'Every business day', file: 'cmefedwatch_scraper.py', snapshot: true, note: 'Selenium' },
    ],
    weekly: [
        // FRED weekly indicators are now handled by the 'All FRED Indicators' button
    ],
    monthly: [
        { id: 'sp500-pe', title: 'S&P 500 PE (Multpl)', source: 'Multpl.com', url: '/api/economic-indicators/scrape/sp500-pe', msg: '✅ Multpl PE started (updates History table)!', when: 'Once a month', file: 'sp500_pe_scraper.py' },
        { id: 'sp500-ey', title: 'S&P 500 Earnings Yield', source: 'GuruFocus', url: '/api/economic-indicators/scrape/SP500_EY', msg: '✅ SP500 EY started!', when: 'Once a month', file: 'gurufocus_scraper.py', note: 'Selenium' },
        { id: 'sp500-pe-guru', title: 'S&P 500 PE Ratio', source: 'GuruFocus', url: '/api/economic-indicators/scrape/SP500_PE', msg: '✅ SP500 PE Ratio started!', when: 'Once a month', file: 'gurufocus_scraper.py', note: 'Selenium' },
    ],
    marketReports: [
        { id: 'market-reports-all', title: 'Saudi Market Reports (All)', source: 'Saudi Exchange', url: '/api/market-reports/scrape', msg: '✅ Saudi Market Reports started in background!', when: 'Sun-Thu (After Close)', file: 'update_market_reports.py', note: 'Runs Substantial Shareholders, Net Short, Headroom, Buybacks, SBL' },
        { id: 'daily-financial-indicators', title: 'Daily Financial Indicators', source: 'Saudi Exchange', url: '/api/market-reports/scrape/daily-financial-indicators', msg: '✅ Daily Financial Indicators started!', when: 'Sun-Thu (After Close)', file: 'daily_financial_indicators_scraper.py', note: 'Selenium — Updates TASI weights, EPS, prices' },
    ],
};

const PIPELINES = [
    {
        table: 'sp500_history', label: 'S&P 500 History',
        scrapers: ['sp500_scraper.py → OHLCV daily', 'sp500_pe_scraper.py → PE column (for yield curve calculation)'],
        pages: ['/bonds/yield-curve', '/valuation', '/valuation/sp500-scenarios', '/valuation/historical-pe', '/market/sp500-pe-ratio'],
    },
    {
        table: 'treasury_yield_curves', label: 'Treasury Yield Curves',
        scrapers: ['treasury_gov_scraper.py → Treasury.gov (the only real module; app/scrapers/ has no treasury_scraper.py)'],
        pages: ['/bonds/daily-treasury-yield-curve', '/bonds/treasury-yield-curve', '/bonds/yield-curve', '/valuation/treasury-curve', '/valuation/treasury-daily', '/valuation/bond'],
        warn: 'Two admin buttons hit this same scraper — Treasury.gov is the only source',
    },
    {
        table: 'economic_indicators', label: 'Economic Indicators',
        scrapers: ['fred_scraper.py → All FRED API data', 'gurufocus_scraper.py → SP500_EY, SP500_PE'],
        pages: ['/economic-indicators', '/economic-indicators/unrate', '/economic-indicators/payems', '/economic-indicators/nfp-change', '/economic-indicators/ic4wsa', '/spread/a-corporate', '/spread/bbb-corporate', '/market/a-effective-yield', '/market/sp500-earnings-yield', '/market/sp500-pe-ratio', '/market/yri-earnings-outlook', '/valuation/economy'],
    },
    {
        table: 'eurodollar_futures', label: 'Eurodollar Futures',
        scrapers: ['eurodollar_scraper.py → Investing.com (snapshot)'],
        pages: ['/interest-rate/eurodollar-futures'],
    },
    {
        table: 'cme_fedwatch', label: 'CME FedWatch',
        scrapers: ['cmefedwatch_scraper.py → CME Group (snapshot)'],
        pages: ['/interest-rate/cme-fedwatch'],
    },
    {
        table: 'tasi_components', label: 'TASI Components (Market Weight)',
        scrapers: ['daily_financial_indicators_scraper.py → Saudi Exchange (Selenium)'],
        pages: ['/valuation/market-weight', '/valuation/report'],
    },
];

// PIPELINES above is the historical, hand-maintained map. It stays as the
// render fallback; the authoritative version is derived from the backend
// registry (GET /api/admin/system-map/pipelines) inside AdminDashboard below.

export default function AdminDashboard() {
    const [statuses, setStatuses] = useState<Record<string, Status>>({});
    const [tab, setTab] = useState<'schedule' | 'pipeline' | 'market'>('schedule');

    // ── Pipeline map — registry-derived, hardcoded PIPELINES as fallback ──
    const [pipelineMap, setPipelineMap] = useState<PipelineMapEntry[]>(PIPELINES);

    useEffect(() => {
        if (tab !== 'pipeline') return;
        let cancelled = false;
        // Failure keeps the local map on purpose: the old page must still work
        // when the registry endpoint is unreachable.
        SystemMapService.getPipelines()
            .then(rows => { if (!cancelled && rows.length) setPipelineMap(rows); })
            .catch(() => { /* keep fallback */ });
        return () => { cancelled = true; };
    }, [tab]);

    // ── Daily Market Update (server-side trigger) ──
    const [pipe, setPipe] = useState<PipelineStatus | null>(null);
    const [pipeDate, setPipeDate] = useState('');
    const [pipeBusy, setPipeBusy] = useState(false);
    const [pipeMsg, setPipeMsg] = useState<{ kind: 'ok' | 'err', text: string } | null>(null);
    const logRef = useRef<HTMLPreElement>(null);

    const refreshPipe = async () => {
        try { setPipe(await PipelineService.status()); }
        catch (e: any) { /* keep last known state — backend may be restarting */ }
    };

    useEffect(() => {
        if (tab !== 'market') return;
        refreshPipe();
        // A live run polls fast, an idle dashboard stays quiet
        const iv = setInterval(refreshPipe, 15000);
        return () => clearInterval(iv);
    }, [tab]);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [pipe?.log_tail?.length]);

    const pipeRunning = !!(pipe?.db.is_updating || pipe?.process.running_this_worker);

    const startPipeline = async (force = false) => {
        setPipeBusy(true);
        setPipeMsg(null);
        try {
            const res = await PipelineService.run(pipeDate || undefined, force);
            setPipeMsg({ kind: 'ok', text: `✅ Run ${res.run_id} started on the server` });
            await refreshPipe();
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            setPipeMsg({
                kind: 'err',
                text: `❌ ${typeof detail === 'string' ? detail : detail?.message || e?.message || 'trigger failed'}`,
            });
        } finally {
            setPipeBusy(false);
        }
    };

    const clearPipeLock = async () => {
        if (!confirm('Force-clear the is_updating mutex? Only do this when no run is actually active.')) return;
        setPipeBusy(true);
        try {
            const res = await PipelineService.unlock();
            setPipeMsg({ kind: 'ok', text: res.cleared ? '🔓 Lock cleared' : 'Lock was already free' });
            await refreshPipe();
        } catch (e: any) {
            setPipeMsg({ kind: 'err', text: `❌ ${e?.response?.data?.detail || e?.message}` });
        } finally {
            setPipeBusy(false);
        }
    };

    const run = async (id: string, url: string, msg: string) => {
        setStatuses(s => ({ ...s, [id]: 'running' }));
        try {
            const res = await triggerScraperAction(url);
            if (!res.success) { setStatuses(s => ({ ...s, [id]: 'error' })); alert(`Error: ${res.error}`); return; }
            setStatuses(s => ({ ...s, [id]: 'success' }));
            alert(msg);
        } catch (e) { setStatuses(s => ({ ...s, [id]: 'error' })); alert(`Error: ${e}`); }
    };

    const dot = (id: string) => {
        const s = statuses[id];
        const cls = s === 'running'
            ? 'bg-amber-400 animate-pulse shadow-sm shadow-amber-300'
            : s === 'success'
                ? 'bg-emerald-500 shadow-sm shadow-emerald-300'
                : s === 'error'
                    ? 'bg-red-400 shadow-sm shadow-red-300'
                    : 'bg-slate-300';
        return <span className={`inline-block w-2 h-2 rounded-full ${cls} shrink-0 mt-0.5`} />;
    };

    const sections = [
        {
            key: 'daily' as const,
            label: 'Daily',
            icon: '📅',
            accent: 'emerald',
            desc: 'Run every business day',
            headerBg: 'bg-emerald-50',
            headerBorder: 'border-emerald-100',
            headerText: 'text-emerald-700',
            btnCls: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
            tagCls: 'bg-emerald-100 text-emerald-700',
        },
        {
            key: 'weekly' as const,
            label: 'Weekly',
            icon: '📆',
            accent: 'amber',
            desc: 'Run on specific day each week',
            headerBg: 'bg-amber-50',
            headerBorder: 'border-amber-100',
            headerText: 'text-amber-700',
            btnCls: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
            tagCls: 'bg-amber-100 text-amber-700',
        },
        {
            key: 'monthly' as const,
            label: 'Monthly',
            icon: '🗓️',
            accent: 'blue',
            desc: 'Run once a month on release day',
            headerBg: 'bg-blue-50',
            headerBorder: 'border-blue-100',
            headerText: 'text-blue-700',
            btnCls: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
            tagCls: 'bg-blue-100 text-blue-700',
        },
        {
            key: 'marketReports' as const,
            label: 'Market Reports (Saudi)',
            icon: '📊',
            accent: 'purple',
            desc: 'Run after market close (Saudi)',
            headerBg: 'bg-purple-50',
            headerBorder: 'border-purple-100',
            headerText: 'text-purple-700',
            btnCls: 'bg-purple-600 hover:bg-purple-700 shadow-purple-100',
            tagCls: 'bg-purple-100 text-purple-700',
        },
    ];

    return (
        <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

                {/* Header */}
                <div className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold shadow">A</div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                                <p className="text-xs text-slate-400 mt-0.5">Scraper management &amp; data pipeline</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/admin/system-map"
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
                            >
                                🗺️ System Map
                            </Link>
                            <Link
                                href="/admin/reports"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
                            >
                                📁 Manage Reports
                            </Link>
                            <Link
                                href="/admin/users"
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition shadow-sm"
                            >
                                👤 Manage Users
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-7">

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-8 shadow-sm">
                        {[
                            { key: 'schedule', label: '📋 Schedule — What to Run & When' },
                            { key: 'market', label: '📈 Daily Market Update' },
                            { key: 'pipeline', label: '🔄 Data Pipeline — Who Feeds Who' },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key as any)}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.key
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Schedule Tab ── */}
                    {tab === 'schedule' && (
                        <div className="space-y-6">
                            {sections.map(sec => (
                                <div key={sec.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Section header */}
                                    <div className={`px-6 py-4 border-b ${sec.headerBorder} ${sec.headerBg} flex items-center gap-3`}>
                                        <span className="text-xl">{sec.icon}</span>
                                        <div>
                                            <h2 className={`text-base font-bold ${sec.headerText}`}>{sec.label}</h2>
                                            <p className="text-xs text-slate-400">{sec.desc}</p>
                                        </div>
                                        <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${sec.tagCls}`}>
                                            {SCHEDULE[sec.key].length} scraper{SCHEDULE[sec.key].length > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Cards grid */}
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {SCHEDULE[sec.key].map((s: any) => {
                                            const st = statuses[s.id];
                                            return (
                                                <div
                                                    key={s.id}
                                                    className="bg-slate-50 border border-slate-100 hover:border-slate-300 hover:shadow-md rounded-xl p-4 flex flex-col transition-all duration-200"
                                                >
                                                    {/* Title row */}
                                                    <div className="flex items-start gap-2 mb-1.5">
                                                        {dot(s.id)}
                                                        <h3 className="font-semibold text-sm text-slate-800 leading-tight">{s.title}</h3>
                                                        {s.snapshot && (
                                                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 font-semibold uppercase tracking-wide shrink-0">
                                                                Snapshot
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Meta */}
                                                    <p className="text-[11px] text-slate-400 mb-0.5">
                                                        <span className="font-medium text-slate-500">{s.source}</span>
                                                        {' · '}
                                                        <code className="font-mono text-slate-400">{s.file}</code>
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mb-3">
                                                        🕒 {s.when}
                                                        {s.note && (
                                                            <span className="ml-1.5 text-amber-600 font-medium">· {s.note}</span>
                                                        )}
                                                    </p>

                                                    {/* Status bar */}
                                                    {st && st !== 'idle' && (
                                                        <div className={`text-[10px] font-semibold rounded-md px-2 py-1 mb-2 text-center ${st === 'running' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                            st === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                                'bg-red-50 text-red-500 border border-red-200'
                                                            }`}>
                                                            {st === 'running' ? '⏳ Running…' : st === 'success' ? '✅ Completed' : '❌ Failed'}
                                                        </div>
                                                    )}

                                                    {/* Run button */}
                                                    <div className="mt-auto">
                                                        <button
                                                            onClick={() => run(s.id, s.url, s.msg)}
                                                            disabled={st === 'running'}
                                                            className={`w-full ${sec.btnCls} text-white py-1.5 rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed`}
                                                        >
                                                            {st === 'running' ? '⏳ Running…' : '▶ Run Now'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Daily Market Update Tab ── */}
                    {tab === 'market' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                                    <span className="text-xl">📈</span>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Daily Market Update Pipeline</h2>
                                        <p className="text-xs text-slate-400">
                                            runs on the backend (next to the DB) · scrape prices → RS → technicals → indicators → breadth → cache flush
                                        </p>
                                    </div>
                                    <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${pipeRunning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {pipeRunning ? '⏳ RUNNING' : '✅ IDLE'}
                                    </span>
                                </div>

                                {/* Live status */}
                                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Latest Ready Date</p>
                                        <p className="text-sm font-mono font-semibold text-slate-800">{pipe?.db.latest_ready_date ?? '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Lock Age</p>
                                        <p className="text-sm font-mono font-semibold text-slate-800">
                                            {pipe?.db.lock_age_minutes != null ? `${pipe.db.lock_age_minutes} min` : '—'}
                                            <span className="text-[10px] text-slate-400"> / stale @{pipe?.db.stale_after_minutes ?? '?'}m</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Started</p>
                                        <p className="text-sm font-mono text-slate-700">{pipe?.process.started_at?.slice(11, 19) ?? pipe?.db.started_at?.slice(11, 19) ?? '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Last Result</p>
                                        <p className={`text-sm font-semibold ${(pipe?.process.error || (pipe?.run_report?.stage_failures?.length ?? 0) > 0) ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {pipe?.process.error
                                                ? '❌ crashed'
                                                : (pipe?.run_report?.stage_failures?.length ?? 0) > 0
                                                    ? `⚠ ${pipe?.run_report?.stage_failures?.length} stage(s)`
                                                    : pipe?.process.finished_at ? '✅ ok' : '—'}
                                        </p>
                                    </div>
                                </div>

                                {pipe && pipe.process.error && (
                                    <div className="mx-5 mb-4 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 font-mono break-all">
                                        {pipe.process.error}
                                    </div>
                                )}

                                {/* ── Guards alert (B1 + B2): failed stages / unpublished day ── */}
                                {((pipe?.run_report?.stage_failures?.length ?? 0) > 0 ||
                                    (pipe?.db.unpublished_days ?? 0) > 0) && (
                                    <div className="mx-5 mb-4 text-xs bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 space-y-1">
                                        <p className="font-bold text-red-700">
                                            🛑 Pipeline alert — هذا اليوم غير مكتمل بالكامل
                                        </p>
                                        {(pipe?.db.unpublished_days ?? 0) > 0 && (
                                            <p className="text-red-700">
                                                {pipe?.db.unpublished_days} يوم بالأسعار في قاعدة
                                                البيانات لكن لم يُنشر (latest_ready_date مُوقيف خلف
                                                مرحلة حرجة فشلت).
                                            </p>
                                        )}
                                        {pipe?.run_report?.ready_date_advanced === false && (
                                            <p className="text-red-700">
                                                ⛔ آخر تشغيل لم يُقدّم تاريخ الجاهزية — المراحل الحرجة:
                                                {' '}{(pipe?.run_report?.critical_stages ?? []).join('، ')}
                                            </p>
                                        )}
                                        {(pipe?.run_report?.stage_failures ?? []).map((f) => (
                                            <p key={`${f.stage}-${f.error}`} className={`font-mono ${f.critical ? 'text-red-700' : 'text-amber-700'}`}>
                                                {f.critical ? '⛔' : '⚠'} [{f.stage}] {f.error}
                                            </p>
                                        ))}
                                        {pipe?.run_report?.quality?.market_cap_anomaly === true && (
                                            <p className="text-red-700">
                                                🛑 market_cap: {String(pipe?.run_report?.quality?.market_cap_missing)}/
                                                {String(pipe?.run_report?.quality?.rows)} صف جاء NULL/0 من السكرابر
                                                (القيم المحفوظة محمية من الحارس).
                                            </p>
                                        )}
                                        {!pipe?.run_report && (
                                            <p className="text-slate-500">
                                                تفاصيل المراحل تُحفظ فقط للتشغيل من هذه اللوحة؛ تشغيل
                                                الـ CLI يُطبع في اللوج فقط.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── Advisory notes: explained & non-blocking — the day is COMPLETE ── */}
                                {(pipe?.run_report?.stage_advisories?.length ?? 0) > 0 && (
                                    <div className="mx-5 mb-4 text-xs bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 space-y-1">
                                        <p className="font-bold text-amber-700">
                                            📋 ملاحظات إرشادية — التشغيل نجح واليوم مكتمل، وهذه حالات
                                            مبرَّرة لا تُعد فشلاً
                                        </p>
                                        {(pipe?.run_report?.stage_advisories ?? []).map((a) => (
                                            <p key={`${a.stage}-${a.error}`} className="font-mono text-amber-700">
                                                📋 [{a.stage}] {a.error}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="px-5 pb-5 flex flex-wrap items-end gap-3">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target date (optional)</span>
                                        <input
                                            type="date"
                                            value={pipeDate}
                                            onChange={e => setPipeDate(e.target.value)}
                                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        />
                                    </label>
                                    <button
                                        onClick={() => startPipeline(false)}
                                        disabled={pipeBusy || pipeRunning}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {pipeRunning ? '⏳ Running…' : '▶ Run Daily Market Update'}
                                    </button>
                                    {pipeRunning && (
                                        <button
                                            onClick={() => startPipeline(true)}
                                            disabled={pipeBusy}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-40"
                                            title="Start anyway (the DB mutex still blocks a second live run)"
                                        >
                                            ⚡ Force new run
                                        </button>
                                    )}
                                    {pipe?.db.is_updating && !pipe?.process.running_this_worker && (
                                        <button
                                            onClick={clearPipeLock}
                                            disabled={pipeBusy}
                                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition"
                                            title="Clear a stuck is_updating lock left by a run that died"
                                        >
                                            🔓 Clear stuck lock
                                        </button>
                                    )}
                                    <button
                                        onClick={refreshPipe}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                                    >
                                        🔄 Refresh
                                    </button>
                                    {pipeMsg && (
                                        <span className={`text-xs font-semibold ${pipeMsg.kind === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {pipeMsg.text}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Log tail */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Pipeline log</span>
                                    <span className="text-[10px] text-slate-500">(live tail from the worker that started the run)</span>
                                </div>
                                <pre
                                    ref={logRef}
                                    dir="ltr"
                                    className="max-h-[420px] overflow-auto p-4 text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap"
                                >
                                    {pipe?.log_tail?.length ? pipe.log_tail.join('\n') : 'No log captured yet — start a run or wait for the next poll.'}
                                </pre>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-500 space-y-1.5">
                                <p>• A second run is refused while the first one is live — from any machine — through the <code className="font-mono text-slate-600">update_status</code> mutex.</p>
                                <p>• A lock left behind by a killed run is taken over automatically after {pipe?.db.stale_after_minutes ?? 120} minutes (env <code className="font-mono text-slate-600">PIPELINE_LOCK_STALE_MINUTES</code>).</p>
                                <p>• The log tail lives in the worker process, so it can be empty if the request lands on a different worker; the status cards above come from the database and are always accurate.</p>
                                <p>• Every stage is guarded: a failure is logged with a traceback and listed in the alert above — it can no longer be swallowed silently, and it can no longer stop the finalize.</p>
                                <p>• If a <span className="font-semibold">critical</span> stage fails (prices / rs_daily_v2 / stock indicators), <code className="font-mono text-slate-600">latest_ready_date</code> is held back so the site keeps showing the last complete day (env <code className="font-mono text-slate-600">PIPELINE_STRICT_FINALIZE=0</code> to override).</p>
                                <p>• A NULL/0 <code className="font-mono text-slate-600">market_cap</code> from the scraper never overwrites a stored value — it is written as <code className="font-mono text-slate-600">COALESCE(NULLIF(incoming,0), prices.market_cap)</code> (thresholds: <code className="font-mono text-slate-600">MARKET_CAP_GUARD_RATIO</code>, <code className="font-mono text-slate-600">SCRAPER_MIN_ROWS_RATIO</code>).</p>
                            </div>
                        </div>
                    )}

                    {/* ── Pipeline Tab ── */}
                    {tab === 'pipeline' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 mb-4">
                                Each row shows:{' '}
                                <span className="text-emerald-600 font-semibold">Scrapers</span>
                                {' → '}
                                <span className="text-blue-600 font-semibold">DB Table</span>
                                {' → '}
                                <span className="text-violet-600 font-semibold">Frontend Pages</span>
                            </p>

                            {pipelineMap.map(p => (
                                <div key={p.table} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_32px_180px_32px_1fr] gap-4 items-start">

                                        {/* Scrapers */}
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Scrapers</p>
                                            <div className="space-y-1.5">
                                                {p.scrapers.map((s, i) => (
                                                    <div key={i} className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 font-mono">
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="hidden lg:flex items-center justify-center text-slate-300 text-xl pt-6">→</div>

                                        {/* DB Table */}
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">DB Table</p>
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center w-full">
                                                <p className="text-sm font-bold text-blue-700 font-mono">{p.table}</p>
                                                <p className="text-[10px] text-blue-400 mt-0.5">{p.label}</p>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="hidden lg:flex items-center justify-center text-slate-300 text-xl pt-6">→</div>

                                        {/* Pages */}
                                        <div>
                                            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-2">Frontend Pages</p>
                                            <div className="space-y-1">
                                                {p.pages.map((pg, i) => (
                                                    <div key={i} className="text-[11px] bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 text-violet-700 font-mono">
                                                        {pg}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {p.warn && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                                            <span className="text-amber-500 text-sm">⚠️</span>
                                            <p className="text-[11px] text-amber-600 font-medium">{p.warn}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-amber-700 mb-3">📌 Important Notes</h3>
                        <ul className="text-xs text-amber-700/80 space-y-1.5">
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>Snapshot</b> scrapers (Eurodollar, FedWatch) capture current data only — no historical backfill possible.</span></li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>Treasury</b> scrapers (FRED + Gov) both write to <b>treasury_yield_curves</b>. Treasury.gov is faster.</span></li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>Credit Spreads</b> (BAMLC0A3CA, BAMLC0A4CBBB, BAMLC0A3CAEY) are <b>daily</b> data from FRED.</span></li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>GuruFocus</b> scrapers use Selenium — may take 30–60s. Incremental mode scrapes last 3 pages (≈ 2 months).</span></li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>S&P 500 PE</b>: GuruFocus feeds the main chart page; Multpl updates the PE column in the History table (used for Yield Curve).</span></li>
                            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span><span><b>Daily Financial Indicators</b> uses Selenium to scrape Saudi Exchange. Updates <b>tasi_components</b> table (weights, EPS, prices) for Market Weight &amp; Report pages.</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}