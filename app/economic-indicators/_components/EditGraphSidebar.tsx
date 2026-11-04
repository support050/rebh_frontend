'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export interface GraphFormatSettings {
    graphType: 'Line' | 'Area' | 'Bar' | 'Scatter';
    showTitle: boolean;
    showAxisTitles: boolean;
    showTooltip: boolean;
    showRecessionShading: boolean;
    logScaleLeft: boolean;
    height: number;
    width: number;
    lineStyle: 'Solid' | 'Dashed' | 'Dotted';
    lineWidth: number;
    lineColor: string;
    markType: 'None' | 'Circle' | 'Square' | 'Diamond';
    markWidth: number;
    yAxisPosition: 'Left' | 'Right';
}

export interface LineInfo {
    seriesId: string;
    label: string;
    units: string;
    frequency: string;
    seasonalAdjustment?: string;
}

/* ─────────────────────────────────────────────
   User-defined (trend) line type
───────────────────────────────────────────── */
export interface UserDefinedLine {
    id: string;
    dateStart: string;
    dateEnd: string;
    valueStart: number;
    valueEnd: number;
    color: string;
    lineStyle: 'Solid' | 'Dashed' | 'Dotted';
    lineWidth: number;
    label: string;
}

interface EditGraphSidebarProps {
    lineInfo: LineInfo;
    formatSettings: GraphFormatSettings;
    onFormatChange: (settings: GraphFormatSettings) => void;
    onSizeApply?: (height: number, width: number) => void;
    onUnitsChange?: (units: string) => void;
    onFrequencyChange?: (frequency: string) => void;
    onFormulaApply?: (formula: string) => void;
    onOutputUnitsChange?: (outputUnits: string) => void;
    onAddSeries?: (seriesId: string) => void;
    /** Remove a previously added data series from the graph. */
    onRemoveSeries?: (seriesId: string) => void;
    /** Last failure loading a series (shown next to the add controls). */
    addSeriesError?: string | null;
    // New: user-defined lines
    userDefinedLines?: UserDefinedLine[];
    onUserDefinedLinesChange?: (lines: UserDefinedLine[]) => void;
    // Additional data series loaded (for "Edit Lines" select)
    additionalSeriesLabels?: Record<string, string>; // { seriesId: label }
    /** Currently visible date range — new trend lines default to it so they are on-screen. */
    visibleRange?: { start: string; end: string };
    /** Value span of the visible primary series — new trend lines default to it. */
    visibleValueRange?: { min: number; max: number };
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const UNITS_OPTIONS = [
    'Thousands of Persons',
    'Change, Thousands of Persons',
    'Change from Year Ago, Thousands of Persons',
    'Percent Change',
    'Percent Change from Year Ago',
    'Compounded Annual Rate of Change',
    'Continuously Compounded Rate of Change',
    'Continuously Compounded Annual Rate of Change',
    'Index (Scale value to 100 for chosen date)',
];

const UNITS_OPTIONS_PERCENT = [
    'Percent',
    'Change',
    'Change from Year Ago',
    'Percent Change',
    'Percent Change from Year Ago',
    'Compounded Annual Rate of Change',
    'Continuously Compounded Rate of Change',
    'Continuously Compounded Annual Rate of Change',
    'Index (Scale value to 100 for chosen date)',
];

const UNITS_OPTIONS_NUMBER = [
    'Number',
    'Change',
    'Change from Year Ago',
    'Percent Change',
    'Percent Change from Year Ago',
    'Compounded Annual Rate of Change',
    'Continuously Compounded Rate of Change',
    'Continuously Compounded Annual Rate of Change',
    'Index (Scale value to 100 for chosen date)',
];

const FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Semiannual', 'Annual'];

/* FRED's "Modify frequency" only offers aggregations — a series can never be
   up-sampled — so the list starts at the series' own base frequency. */
const FINER_FREQUENCY_PREFIX: Record<string, string[]> = {
    Daily: ['Daily', 'Weekly'],
    Weekly: ['Weekly'],
};

function getFrequencyOptions(baseFrequency: string): string[] {
    const prefix = FINER_FREQUENCY_PREFIX[baseFrequency];
    return prefix ? [...prefix, ...FREQUENCY_OPTIONS] : FREQUENCY_OPTIONS;
}

const OUTPUT_UNITS_OPTIONS = [
    'Select',
    'Change',
    'Change from Year Ago',
    'Percent Change',
    'Percent Change from Year Ago',
    'Compounded Annual Rate of Change',
    'Continuously Compounded Rate of Change',
    'Continuously Compounded Annual Rate of Change',
    'Natural Log',
    'Index (Scale value to 100 for chosen date)',
];

const GRAPH_TYPES = ['Line', 'Area', 'Bar', 'Scatter'] as const;
const LINE_STYLE_OPTIONS = ['Solid', 'Dashed', 'Dotted'] as const;
const MARK_TYPE_OPTIONS = ['None', 'Circle', 'Square', 'Diamond'] as const;
const LINE_WIDTH_OPTIONS = [1, 2, 3, 4, 5] as const;

const TREND_LINE_COLORS = [
    '#e74c3c', '#27ae60', '#f39c12', '#8e44ad', '#16a085',
    '#2980b9', '#d35400', '#7f8c8d', '#c0392b', '#1abc9c',
];

/* ─────────────────────────────────────────────
   Helper: pick units list based on current units
───────────────────────────────────────────── */
function getUnitsOptions(currentUnits: string): string[] {
    if (currentUnits.toLowerCase().includes('percent') || currentUnits === 'Percent') {
        return UNITS_OPTIONS_PERCENT;
    }
    if (currentUnits === 'Number') {
        return UNITS_OPTIONS_NUMBER;
    }
    return UNITS_OPTIONS;
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/** Round to 4 decimals (trend-line default values). */
function round4(n: number): number {
    return Math.round(n * 10000) / 10000;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function EditGraphSidebar({
    lineInfo,
    formatSettings,
    onFormatChange,
    onSizeApply,
    onUnitsChange,
    onFrequencyChange,
    onFormulaApply,
    onOutputUnitsChange,
    onAddSeries,
    onRemoveSeries,
    addSeriesError,
    userDefinedLines = [],
    onUserDefinedLinesChange,
    additionalSeriesLabels = {},
    visibleRange,
    visibleValueRange,
}: EditGraphSidebarProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'EDIT LINES' | 'ADD LINE' | 'FORMAT'>('EDIT LINES');

    // Which line is selected in EDIT LINES tab
    // 'primary' = Line 1 (main series), or a UDL id
    const [selectedLineId, setSelectedLineId] = useState<string>('primary');

    // EDIT LINE local state – stays in sync with parent via useEffect
    const [selectedUnits, setSelectedUnits] = useState(lineInfo.units);
    const [selectedFrequency, setSelectedFrequency] = useState(lineInfo.frequency);

    // FORMAT tab – local until Apply is clicked
    const [localHeight, setLocalHeight] = useState(formatSettings.height);
    const [localWidth, setLocalWidth] = useState(formatSettings.width);

    // Customize data
    const [searchKeyword, setSearchKeyword] = useState('');
    const [formula, setFormula] = useState('a');
    const [formulaError, setFormulaError] = useState('');

    const [localOutputUnits, setLocalOutputUnits] = useState('Select');
    const [showNeedHelp, setShowNeedHelp] = useState(false);

    // ADD LINE
    const [addLineSearch, setAddLineSearch] = useState('');
    const [showCreateLine, setShowCreateLine] = useState(false);

    // Format per-line customize accordion
    const [expandedFormatLine, setExpandedFormatLine] = useState<string | null>(null);

    const sidebarRef = useRef<HTMLDivElement>(null);

    /* ── Close panel on outside click ── */
    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    /* ── Sync local size when parent updates ── */
    useEffect(() => {
        setLocalHeight(formatSettings.height);
        setLocalWidth(formatSettings.width);
    }, [formatSettings.height, formatSettings.width]);

    /* ── Sync units/frequency when lineInfo changes ── */
    useEffect(() => { setSelectedUnits(lineInfo.units); }, [lineInfo.units]);
    useEffect(() => { setSelectedFrequency(lineInfo.frequency); }, [lineInfo.frequency]);

    /* ── When a UDL is deleted and was selected, fall back to primary ── */
    useEffect(() => {
        if (selectedLineId !== 'primary' && !userDefinedLines.find(l => l.id === selectedLineId)) {
            setSelectedLineId('primary');
        }
    }, [userDefinedLines, selectedLineId]);

    /* ────────────────────────
       Handlers
    ──────────────────────── */
    const toggle = (key: keyof GraphFormatSettings) => {
        if (typeof formatSettings[key] === 'boolean') {
            onFormatChange({ ...formatSettings, [key]: !formatSettings[key] });
        }
    };

    const handleUnitsChange = (val: string) => {
        setSelectedUnits(val);
        onUnitsChange?.(val);
    };

    const handleFrequencyChange = (val: string) => {
        setSelectedFrequency(val);
        onFrequencyChange?.(val);
    };

    const handleFormulaApply = () => {
        const trimmed = formula.trim();
        if (!trimmed) {
            setFormulaError('Formula cannot be empty.');
            return;
        }
        const safePattern = /^[a-zA-Z0-9\s+\-*/.()\^]+$/;
        if (!safePattern.test(trimmed)) {
            setFormulaError('Only letters, numbers, and +  -  *  /  ( ) are allowed.');
            return;
        }
        setFormulaError('');
        onFormulaApply?.(trimmed);
    };

    const handleOutputUnitsChange = (val: string) => {
        setLocalOutputUnits(val);
        onOutputUnitsChange?.(val);
    };

    const handleAddSeries = () => {
        if (searchKeyword.trim()) {
            onAddSeries?.(searchKeyword.trim());
            setSearchKeyword('');
        }
    };

    const handleAddLineSearch = () => {
        const code = addLineSearch.trim().toUpperCase();
        if (code) {
            onAddSeries?.(code);
            setAddLineSearch('');
        }
    };

    /* ── User-defined line handlers ── */
    const handleCreateLine = () => {
        // Create a default line immediately, just like FRED — spanning the
        // currently visible range so the new line is always on screen.
        const lineNo = userDefinedLines.length + 1;
        // Default the endpoints onto the visible part of the primary series, so the
        // line is always inside the plot regardless of the indicator's magnitude.
        const vStart = visibleValueRange ? round4(visibleValueRange.min) : 3.4;
        const vEnd = visibleValueRange ? round4(visibleValueRange.max) : 4.4;
        const newLine: UserDefinedLine = {
            id: generateId(),
            dateStart: visibleRange?.start || '1948-01-01',
            dateEnd: visibleRange?.end || new Date().toISOString().split('T')[0],
            valueStart: vStart,
            valueEnd: vEnd,
            color: TREND_LINE_COLORS[(lineNo - 1) % TREND_LINE_COLORS.length],
            lineStyle: 'Solid',
            lineWidth: 2,
            label: `Trend Line ${lineNo}`,
        };
        const updated = [...userDefinedLines, newLine];
        onUserDefinedLinesChange?.(updated);
        setShowCreateLine(false);
        // Switch to EDIT LINES and select the new line
        setActiveTab('EDIT LINES');
        setSelectedLineId(newLine.id);
    };

    const handleDeleteLine = (id: string) => {
        const updated = userDefinedLines.filter(l => l.id !== id);
        onUserDefinedLinesChange?.(updated);
    };

    const handleUpdateLine = (id: string, patch: Partial<UserDefinedLine>) => {
        const updated = userDefinedLines.map(l => l.id === id ? { ...l, ...patch } : l);
        onUserDefinedLinesChange?.(updated);
    };

    /* ── Build select options ──
       Keep the current selection visible even when it's a transform that the
       base-units list doesn't contain (otherwise the select renders blank). */
    const baseUnitsOptions = getUnitsOptions(lineInfo.units);
    const unitsOptions = baseUnitsOptions.includes(selectedUnits)
        ? baseUnitsOptions
        : [selectedUnits, ...baseUnitsOptions];

    /* Frequency list adapts to the series' own frequency (daily spreads, etc.). */
    const frequencyOptions = getFrequencyOptions(lineInfo.frequency);

    /* ── Reset all filters ── */
    const handleReset = () => {
        onFormatChange({ ...defaultFormatSettings, graphType: formatSettings.graphType });
        setSelectedUnits(lineInfo.units);
        onUnitsChange?.(lineInfo.units);
        setSelectedFrequency(lineInfo.frequency);
        onFrequencyChange?.(lineInfo.frequency);
        setFormula('a');
        setFormulaError('');
        onFormulaApply?.('a');
        setLocalOutputUnits('Select');
        onOutputUnitsChange?.('Select');
        onUserDefinedLinesChange?.([]);
        // Drop any added data series too, so the graph returns to Line 1 only.
        Object.keys(additionalSeriesLabels).forEach((sid) => onRemoveSeries?.(sid));
        setSelectedLineId('primary');
        setLocalHeight(defaultFormatSettings.height);
        setLocalWidth(defaultFormatSettings.width);
        onSizeApply?.(defaultFormatSettings.height, defaultFormatSettings.width);
    };

    // All lines for the "Select Line" dropdown
    const allLines = [
        { id: 'primary', label: `Line 1 – ${lineInfo.label}` },
        ...Object.entries(additionalSeriesLabels).map(([sid, lbl], i) => ({
            id: sid,
            label: `Line ${i + 2} – ${lbl}`,
        })),
        ...userDefinedLines.map((l, i) => ({
            id: l.id,
            label: `Line ${Object.keys(additionalSeriesLabels).length + 2 + i} – Trend Line`,
        })),
    ];

    const selectedUDL = userDefinedLines.find(l => l.id === selectedLineId);
    // An added data series (Line 2+) is selected rather than the primary line / a UDL.
    const selectedSeriesId = selectedLineId !== 'primary' && !selectedUDL
        ? Object.keys(additionalSeriesLabels).find((sid) => sid === selectedLineId)
        : undefined;
    const selectedLineIdx = allLines.findIndex(l => l.id === selectedLineId);

    const TABS = ['EDIT LINES', 'ADD LINE', 'FORMAT'] as const;

    /* ────────────────────────
       Render
    ──────────────────────── */
    return (
        <div className="relative inline-block" ref={sidebarRef}>

            {/* ── Trigger Button ── */}
            <button
                onClick={() => setOpen((p) => !p)}
                className={[
                    'inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded px-3 py-1.5 transition-colors select-none',
                    open
                        ? 'bg-[#0052a3] text-white border-[#0052a3]'
                        : 'bg-[#0066cc] text-white border-[#0066cc] hover:bg-[#0052a3]',
                ].join(' ')}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Graph
            </button>

            {/* ── Sidebar Panel ── */}
            {open && (
                <div
                    className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#ccc] shadow-[0_4px_16px_rgba(0,0,0,0.15)] w-[380px] text-[13px] text-[#333]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {/* ── Tab Bar ── */}
                    <div className="flex border-b border-[#ccc]">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={[
                                    'flex-1 py-2.5 text-[11px] font-bold tracking-wide transition-colors',
                                    activeTab === tab
                                        ? 'bg-white border-b-2 border-b-[#333] text-[#333]'
                                        : 'bg-[#f5f5f5] text-[#555] hover:bg-[#ebebeb]',
                                ].join(' ')}
                            >
                                {tab}
                            </button>
                        ))}
                        <button
                            onClick={handleReset}
                            className="px-3 bg-[#f5f5f5] text-[#c0392b] hover:text-white hover:bg-[#c0392b] text-[10px] font-bold border-l border-[#ccc] transition-colors"
                            title="Reset all filters to defaults"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="px-3 bg-[#f5f5f5] text-[#777] hover:text-[#333] hover:bg-[#e0e0e0] text-[16px] font-light border-l border-[#ccc]"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    {/* ════════════════════════════════
              TAB: EDIT LINES
          ════════════════════════════════ */}
                    {activeTab === 'EDIT LINES' && (
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">

                            {/* Select Line dropdown – only shown when >1 line exists */}
                            {allLines.length > 1 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-[#333] mb-1">Select Line</label>
                                    <select
                                        value={selectedLineId}
                                        onChange={(e) => setSelectedLineId(e.target.value)}
                                        className="w-full border border-[#4d7eb2] rounded px-2 py-2 text-[12px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                    >
                                        {allLines.map((l) => (
                                            <option key={l.id} value={l.id}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* ── Primary line editor ── */}
                            {selectedLineId === 'primary' && (
                                <>
                                    {/* Header */}
                                    <div>
                                        <div className="font-bold text-[13px] mb-0.5">Line 1</div>
                                        <div className="text-[11px] text-[#555] leading-snug">
                                            (a) {lineInfo.label}, {lineInfo.units},{' '}
                                            {lineInfo.seasonalAdjustment ?? 'Seasonally Adjusted'} ({lineInfo.seriesId})
                                        </div>
                                    </div>

                                    {/* Units */}
                                    <div>
                                        <label className="block text-[12px] font-bold text-[#333] mb-1">Units</label>
                                        <select
                                            value={selectedUnits}
                                            onChange={(e) => handleUnitsChange(e.target.value)}
                                            className="w-full border border-[#4d7eb2] rounded px-2 py-2 text-[12px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                        >
                                            {unitsOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                        <label className="block text-[12px] font-bold text-[#333] mb-1">Modify frequency</label>
                                        <select
                                            value={selectedFrequency}
                                            onChange={(e) => handleFrequencyChange(e.target.value)}
                                            className="w-full border border-[#4d7eb2] rounded px-2 py-2 text-[12px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                        >
                                            {frequencyOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Customize data */}
                                    <div className="border-t border-[#e5e5e5] pt-3">
                                        <div className="font-bold text-[12px] mb-1">Customize data</div>
                                        <div className="text-[11px] text-[#555] leading-snug mb-2">
                                            Write a custom formula to transform one or more series or combine two or more series.
                                        </div>
                                        <div className="text-[11px] text-[#555] leading-snug mb-2">
                                            You can begin by adding a series to combine with your existing series.
                                        </div>

                                        {/* Series search + Add button */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <select
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                                className="flex-1 border border-[#4d7eb2] rounded px-2 py-2 text-[11px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                            >
                                                <option value="">Type keywords to search for data</option>
                                                <option value="GDP">GDP – Gross Domestic Product</option>
                                                <option value="CPIAUCSL">CPI – Consumer Price Index</option>
                                                <option value="UNRATE">UNRATE – Unemployment Rate</option>
                                                <option value="PAYEMS">PAYEMS – Total Nonfarm</option>
                                                <option value="IC4WSA">IC4WSA – Initial Claims</option>
                                                <option value="DFF">DFF – Federal Funds Rate</option>
                                                <option value="T10Y2Y">T10Y2Y – 10Y-2Y Spread</option>
                                            </select>
                                            <button
                                                onClick={handleAddSeries}
                                                disabled={!searchKeyword}
                                                className="inline-flex items-center gap-1 text-[#2874a6] border border-[#2874a6] rounded px-2.5 py-1.5 text-[11px] font-bold hover:bg-[#2874a6] hover:text-white transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Add
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {addSeriesError && (
                                            <p className="text-[10px] text-red-500 -mt-2 mb-2">{addSeriesError}</p>
                                        )}

                                        <div className="text-[11px] text-[#555] leading-snug mb-1">
                                            Now create a custom formula to combine or transform the series.
                                        </div>

                                        <button
                                            onClick={() => setShowNeedHelp(!showNeedHelp)}
                                            className="text-[#2874a6] text-[11px] font-medium hover:underline mb-2 flex items-center gap-0.5"
                                        >
                                            Need help?{' '}
                                            <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                                                <path d={showNeedHelp ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
                                            </svg>
                                        </button>

                                        {showNeedHelp && (
                                            <div className="bg-[#f8f9fa] border border-[#e0e0e0] rounded p-2 mb-2 text-[10px] text-[#555] leading-relaxed">
                                                <p className="mb-1"><strong>Variables:</strong> &apos;a&apos; = Line 1, &apos;b&apos; = Line 2, etc.</p>
                                                <p className="mb-1"><strong>Operators:</strong> +  -  *  /</p>
                                                <p className="mb-1"><strong>Examples:</strong></p>
                                                <p className="ml-2">a → Line 1 unchanged</p>
                                                <p className="ml-2">a * 2 → multiply Line 1 by 2</p>
                                                <p className="ml-2">a + b → sum of Line 1 and Line 2</p>
                                                <p className="ml-2">a / b * 100 → ratio as percent</p>
                                                <p className="ml-2">a - b → difference</p>
                                            </div>
                                        )}

                                        {/* Formula input */}
                                        <div className="mb-1">
                                            <label className="block text-[12px] font-bold text-[#333] mb-1">Formula</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={formula}
                                                    onChange={(e) => { setFormula(e.target.value); setFormulaError(''); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleFormulaApply(); }}
                                                    className={`flex-1 border rounded px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 ${formulaError
                                                        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                                                        : 'border-[#4d7eb2] focus:border-[#2874a6] focus:ring-[#2874a6]'
                                                        }`}
                                                    placeholder="a"
                                                />
                                                <button
                                                    onClick={handleFormulaApply}
                                                    className="inline-flex items-center gap-1 bg-white text-[#2874a6] border border-[#2874a6] rounded px-3 py-1.5 text-[11px] font-bold hover:bg-[#2874a6] hover:text-white transition-colors whitespace-nowrap"
                                                >
                                                    Apply Formula
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {formulaError && (
                                                <p className="text-[10px] text-red-500 mt-1">{formulaError}</p>
                                            )}
                                        </div>

                                        {/* Output Units */}
                                        <div className="mt-3">
                                            <div className="text-[11px] text-[#555] leading-snug mb-1">
                                                Finally, you can change the units of your new series.
                                            </div>
                                            <label className="block text-[12px] font-bold text-[#333] mb-1">Units</label>
                                            <select
                                                value={localOutputUnits}
                                                onChange={(e) => handleOutputUnitsChange(e.target.value)}
                                                className="w-full border border-[#4d7eb2] rounded px-2 py-2 text-[12px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                            >
                                                {OUTPUT_UNITS_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Added data series editor (Line 2+) ── */}
                            {selectedSeriesId && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-[13px]">Line {selectedLineIdx + 1}</div>
                                            <div className="text-[11px] text-[#555]">
                                                ({selectedSeriesId}) — plotted on the right axis
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { onRemoveSeries?.(selectedSeriesId); setSelectedLineId('primary'); }}
                                            className="w-8 h-8 flex items-center justify-center border border-[#e74c3c] rounded text-[#e74c3c] hover:bg-[#e74c3c] hover:text-white transition-colors"
                                            title="Remove this series"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-[11px] text-[#555] leading-snug">
                                        To combine this series with Line 1, write a formula below
                                        ('{String.fromCharCode(98 + Object.keys(additionalSeriesLabels).indexOf(selectedSeriesId))}' = {additionalSeriesLabels[selectedSeriesId]}).
                                    </div>
                                </div>
                            )}

                            {/* ── User-defined line editor ── */}
                            {selectedUDL && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-[13px]">
                                                Line {selectedLineIdx + 1}
                                            </div>
                                            <div className="text-[11px] text-[#555]">User-defined Line</div>
                                        </div>
                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleDeleteLine(selectedUDL.id)}
                                            className="w-8 h-8 flex items-center justify-center border border-[#e74c3c] rounded text-[#e74c3c] hover:bg-[#e74c3c] hover:text-white transition-colors"
                                            title="Delete this line"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Date range */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#333] mb-1">Date start/end</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={selectedUDL.dateStart}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { dateStart: e.target.value })}
                                                className="flex-1 border border-[#bbb] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#4d7eb2]"
                                            />
                                            <span className="text-[11px] text-[#555]">to</span>
                                            <input
                                                type="date"
                                                value={selectedUDL.dateEnd}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { dateEnd: e.target.value })}
                                                className="flex-1 border border-[#bbb] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#4d7eb2]"
                                            />
                                        </div>
                                    </div>

                                    {/* Value range */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#333] mb-1">Value start/end</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={selectedUDL.valueStart}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { valueStart: parseFloat(e.target.value) || 0 })}
                                                className="flex-1 border border-[#bbb] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#4d7eb2]"
                                            />
                                            <span className="text-[11px] text-[#555]">to</span>
                                            <input
                                                type="number"
                                                step="any"
                                                value={selectedUDL.valueEnd}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { valueEnd: parseFloat(e.target.value) || 0 })}
                                                className="flex-1 border border-[#bbb] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#4d7eb2]"
                                            />
                                        </div>
                                    </div>

                                    {/* Color */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-[11px] font-bold text-[#333]">Color</label>
                                        <input
                                            type="color"
                                            value={selectedUDL.color}
                                            onChange={(e) => handleUpdateLine(selectedUDL.id, { color: e.target.value })}
                                            className="w-9 h-7 border border-[#bbb] rounded cursor-pointer p-0.5 bg-white"
                                        />
                                        <div className="flex gap-1 flex-wrap">
                                            {TREND_LINE_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => handleUpdateLine(selectedUDL.id, { color: c })}
                                                    className="w-5 h-5 rounded-sm border-2 transition-transform hover:scale-110"
                                                    style={{
                                                        backgroundColor: c,
                                                        borderColor: selectedUDL.color === c ? '#333' : 'transparent',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Line style + width */}
                                    <div className="flex items-end gap-3">
                                        <div>
                                            <label className="block text-[10px] text-[#555] mb-0.5">Line style</label>
                                            <select
                                                value={selectedUDL.lineStyle}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { lineStyle: e.target.value as UserDefinedLine['lineStyle'] })}
                                                className="border border-[#bbb] rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[80px]"
                                            >
                                                {LINE_STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[#555] mb-0.5">Width</label>
                                            <select
                                                value={selectedUDL.lineWidth}
                                                onChange={(e) => handleUpdateLine(selectedUDL.id, { lineWidth: Number(e.target.value) })}
                                                className="border border-[#bbb] rounded px-1 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[50px]"
                                            >
                                                {LINE_WIDTH_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════
              TAB: ADD LINE
          ════════════════════════════════ */}
                    {activeTab === 'ADD LINE' && (
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                            <div className="font-bold text-[12px]">Add data series to graph</div>

                            {/* Free-text search */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={addLineSearch}
                                        onChange={(e) => setAddLineSearch(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddLineSearch(); }}
                                        className="flex-1 border border-[#4d7eb2] rounded px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-[#2874a6] focus:ring-1 focus:ring-[#2874a6]"
                                        placeholder="Type keywords to search for data"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddLineSearch}
                                disabled={!addLineSearch.trim()}
                                className="inline-flex items-center gap-1 bg-[#2874a6] text-white border border-[#2874a6] rounded px-3 py-1.5 text-[11px] font-bold hover:bg-[#1a5276] transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Add data series
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                            </button>

                            {addSeriesError && (
                                <p className="text-[11px] text-red-500">{addSeriesError}</p>
                            )}

                            {/* Series currently on the graph */}
                            {Object.keys(additionalSeriesLabels).length > 0 && (
                                <div className="border-t border-[#e5e5e5] pt-2">
                                    <div className="text-[11px] font-bold text-[#333] mb-1">On the graph</div>
                                    {Object.entries(additionalSeriesLabels).map(([sid, lbl]) => (
                                        <div key={sid} className="flex items-center justify-between py-1 border-b border-[#f0f0f0] last:border-0">
                                            <span className="text-[11px] text-[#555]">({sid}) {lbl}</span>
                                            <button
                                                onClick={() => onRemoveSeries?.(sid)}
                                                className="text-[10px] text-[#c0392b] hover:underline"
                                                title={`Remove ${sid}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Create user-defined line ── */}
                            <div className="border-t border-[#e5e5e5] pt-3">
                                <button
                                    onClick={() => setShowCreateLine(!showCreateLine)}
                                    className="text-[#2874a6] text-[11px] font-medium hover:underline flex items-center gap-0.5 mb-1"
                                >
                                    Create user-defined line{' '}
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                                        <path d={showCreateLine ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
                                    </svg>
                                </button>
                                <div className="text-[10px] text-[#666] mb-2">
                                    You can customize a graph by adding a straight line between two data points.
                                </div>

                                {showCreateLine && (
                                    <div className="mt-2">
                                        <button
                                            onClick={handleCreateLine}
                                            className="inline-flex items-center gap-1 bg-white text-[#2874a6] border border-[#2874a6] rounded px-3 py-1.5 text-[12px] font-medium hover:bg-[#f0f5fa] transition-colors"
                                        >
                                            Create line
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>


                        </div>
                    )}

                    {/* ════════════════════════════════
              TAB: FORMAT
          ════════════════════════════════ */}
                    {activeTab === 'FORMAT' && (
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">

                            {/* Graph type */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#333] mb-1">Graph type</label>
                                <select
                                    value={formatSettings.graphType}
                                    onChange={(e) =>
                                        onFormatChange({ ...formatSettings, graphType: e.target.value as GraphFormatSettings['graphType'] })
                                    }
                                    className="w-[120px] border border-[#bbb] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#4d7eb2]"
                                >
                                    {GRAPH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Details */}
                            <div className="border-t border-[#e5e5e5] pt-3">
                                <div className="font-bold text-[12px] mb-2">Details</div>
                                <div className="text-[11px] font-bold text-[#555] mb-1.5">Display</div>
                                {(
                                    [
                                        { key: 'showTitle', label: 'Title' },
                                        { key: 'showAxisTitles', label: 'Axis titles' },
                                        { key: 'showTooltip', label: 'Tooltip' },
                                        { key: 'showRecessionShading', label: 'Recession shading' },
                                        { key: 'logScaleLeft', label: 'Log scale left' },
                                    ] as { key: keyof GraphFormatSettings; label: string }[]
                                ).map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-1.5 mb-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!formatSettings[key]}
                                            onChange={() => toggle(key)}
                                            className="w-3 h-3 accent-[#2874a6]"
                                        />
                                        <span className="text-[11px] text-[#333]">{label}</span>
                                    </label>
                                ))}

                                {/* Height + Width + Apply */}
                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-[11px] font-bold text-[#333]">Height</label>
                                        <input
                                            type="number" min={100} max={2000}
                                            value={localHeight}
                                            onChange={(e) => setLocalHeight(Number(e.target.value))}
                                            className="w-16 border border-[#bbb] rounded px-1.5 py-1 text-[11px] text-center focus:outline-none focus:border-[#4d7eb2]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-[11px] font-bold text-[#333]">Width</label>
                                        <input
                                            type="number" min={200} max={4000}
                                            value={localWidth}
                                            onChange={(e) => setLocalWidth(Number(e.target.value))}
                                            className="w-16 border border-[#bbb] rounded px-1.5 py-1 text-[11px] text-center focus:outline-none focus:border-[#4d7eb2]"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onSizeApply?.(localHeight, localWidth)}
                                        className="bg-[#2874a6] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#1a5276] transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* Line 1 details & color */}
                            <div className="border-t border-[#e5e5e5] pt-3">
                                <div className="text-[11px] font-bold text-[#333] mb-0.5">Line 1</div>
                                <div className="text-[11px] text-[#555] mb-1">{lineInfo.label}</div>
                                <div className="text-[11px] font-bold text-[#555] mb-1">Line details &amp; color</div>
                                <div className="text-[10px] text-[#888] mb-2">Line style, thickness, color and position</div>

                                <button
                                    onClick={() => setExpandedFormatLine(expandedFormatLine === 'primary' ? null : 'primary')}
                                    className="w-full flex items-center justify-between border border-[#4d7eb2] rounded px-3 py-2 text-[11px] text-[#2874a6] font-bold bg-white hover:bg-[#f0f5fa] transition-colors"
                                >
                                    Customize
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                        <path d={expandedFormatLine === 'primary' ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
                                    </svg>
                                </button>

                                {expandedFormatLine === 'primary' && (
                                    <div className="border border-[#4d7eb2] rounded p-3 bg-[#fafcff] space-y-3 mt-1">
                                        <div className="text-[11px] font-bold text-[#333]">Customize</div>

                                        <div className="flex items-end gap-2 flex-wrap">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-[#555]">Line style</span>
                                                <select
                                                    value={formatSettings.lineStyle}
                                                    onChange={(e) => onFormatChange({ ...formatSettings, lineStyle: e.target.value as GraphFormatSettings['lineStyle'] })}
                                                    className="border border-[#bbb] rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[75px]"
                                                >
                                                    {LINE_STYLE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-[#555]">Width</span>
                                                <select
                                                    value={formatSettings.lineWidth}
                                                    onChange={(e) => onFormatChange({ ...formatSettings, lineWidth: Number(e.target.value) })}
                                                    className="border border-[#bbb] rounded px-1 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[46px]"
                                                >
                                                    {LINE_WIDTH_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-[#555]">Color</span>
                                                <input
                                                    type="color"
                                                    value={formatSettings.lineColor}
                                                    onChange={(e) => onFormatChange({ ...formatSettings, lineColor: e.target.value })}
                                                    className="w-8 h-[26px] border border-[#bbb] rounded cursor-pointer p-0.5 bg-white"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-[#555]">Mark type</span>
                                                <select
                                                    value={formatSettings.markType}
                                                    onChange={(e) => onFormatChange({ ...formatSettings, markType: e.target.value as GraphFormatSettings['markType'] })}
                                                    className="border border-[#bbb] rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[70px]"
                                                >
                                                    {MARK_TYPE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-[#555]">Width</span>
                                                <select
                                                    value={formatSettings.markWidth}
                                                    onChange={(e) => onFormatChange({ ...formatSettings, markWidth: Number(e.target.value) })}
                                                    className="border border-[#bbb] rounded px-1 py-1 text-[11px] bg-white focus:outline-none focus:border-[#4d7eb2] w-[46px]"
                                                >
                                                    {LINE_WIDTH_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-[#555] font-bold">Y-Axis position</span>
                                            {(['Left', 'Right'] as const).map((pos) => (
                                                <label key={pos} className="flex items-center gap-1 cursor-pointer select-none">
                                                    <input
                                                        type="radio"
                                                        name="yAxisPosition"
                                                        value={pos}
                                                        checked={formatSettings.yAxisPosition === pos}
                                                        onChange={() => onFormatChange({ ...formatSettings, yAxisPosition: pos })}
                                                        className="accent-[#2874a6]"
                                                    />
                                                    <span className="text-[11px] text-[#333]">{pos}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User-defined lines in FORMAT tab */}
                            {userDefinedLines.map((udl, i) => (
                                <div key={udl.id} className="border-t border-[#e5e5e5] pt-3">
                                    <div className="text-[11px] font-bold text-[#333] mb-0.5">
                                        Line {Object.keys(additionalSeriesLabels).length + 2 + i}
                                    </div>
                                    <div className="text-[11px] text-[#555] mb-1">User-defined Line</div>
                                    <div className="text-[11px] font-bold text-[#555] mb-1">Line details &amp; color</div>
                                    <div className="text-[10px] text-[#888] mb-2">Line style, thickness, color and position</div>

                                    <button
                                        onClick={() => setExpandedFormatLine(expandedFormatLine === udl.id ? null : udl.id)}
                                        className="w-full flex items-center justify-between border border-[#4d7eb2] rounded px-3 py-2 text-[11px] text-[#2874a6] font-bold bg-white hover:bg-[#f0f5fa] transition-colors"
                                    >
                                        Customize
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <path d={expandedFormatLine === udl.id ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} />
                                        </svg>
                                    </button>

                                    {expandedFormatLine === udl.id && (
                                        <div className="border border-[#4d7eb2] rounded p-3 bg-[#fafcff] space-y-3 mt-1">
                                            <div className="flex items-end gap-2 flex-wrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-[#555]">Line style</span>
                                                    <select
                                                        value={udl.lineStyle}
                                                        onChange={(e) => handleUpdateLine(udl.id, { lineStyle: e.target.value as UserDefinedLine['lineStyle'] })}
                                                        className="border border-[#bbb] rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none w-[75px]"
                                                    >
                                                        {LINE_STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-[#555]">Width</span>
                                                    <select
                                                        value={udl.lineWidth}
                                                        onChange={(e) => handleUpdateLine(udl.id, { lineWidth: Number(e.target.value) })}
                                                        className="border border-[#bbb] rounded px-1 py-1 text-[11px] bg-white focus:outline-none w-[46px]"
                                                    >
                                                        {LINE_WIDTH_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-[#555]">Color</span>
                                                    <input
                                                        type="color"
                                                        value={udl.color}
                                                        onChange={(e) => handleUpdateLine(udl.id, { color: e.target.value })}
                                                        className="w-8 h-[26px] border border-[#bbb] rounded cursor-pointer p-0.5 bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Default format settings export
───────────────────────────────────────────── */
export const defaultFormatSettings: GraphFormatSettings = {
    graphType: 'Line',
    // FRED's default graph shows no centered title (only the legend overlay).
    showTitle: false,
    showAxisTitles: true,
    showTooltip: true,
    showRecessionShading: true,
    logScaleLeft: false,
    // Matches the measured .highcharts-container box (1320 x 465).
    height: 465,
    width: 1320,
    lineStyle: 'Solid',
    lineWidth: 3,
    lineColor: '#0066cc',
    markType: 'None',
    markWidth: 3,
    yAxisPosition: 'Left',
};