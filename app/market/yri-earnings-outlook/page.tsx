'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LayoutGrid, List, X, ChevronLeft, ChevronRight, ArrowLeftRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────────────────────── */

interface Figure1Row {
  period: string;
  ae: string;
  yri_level: number;
  yri_yoy: number;
  consensus_level: number;
  consensus_yoy: number;
}

interface Figure2Row {
  period: string;
  ae: string;
  revenue_growth: number | null;
  revenue: number;
  earnings: number;
  profit_margin: number;
}

/* ─── Chart Config ───────────────────────────────────────────────────── */

const chartsData = [
  { id: 1, title: "S&P 500 EARNINGS FORECASTS: YRI VS ANALYSTS' CONSENSUS" },
  { id: 2, title: "YRI FORECASTS: S&P 500 REVENUES, EARNINGS & PROFIT MARGIN" },
  { id: 3, title: "S&P 500 FORWARD EARNINGS & REVENUES" },
  { id: 4, title: "S&P 500 EARNINGS YIELD VS TREASURY YIELD" },
  { id: 5, title: "S&P 500 PROFIT MARGIN ESTIMATES" },
  { id: 6, title: "S&P 500 OPERATING EARNINGS PER SHARE" },
  { id: 7, title: "S&P 500 REPORTED VS OPERATING EARNINGS" },
  { id: 8, title: "S&P 500 SECTOR EARNINGS GROWTH" },
  { id: 9, title: "GLOBAL EARNINGS ESTIMATES" },
  { id: 10, title: "U.S. VS REST OF WORLD EARNINGS" },
  { id: 11, title: "S&P 500 P/E VALUATION METRICS" },
  { id: 12, title: "S&P 500 EARNINGS SURPRISE HISTORY" },
  { id: 13, title: "S&P 500 REVENUE SURPRISE HISTORY" },
];

/* ─── Sortable Table for Figure 1 ────────────────────────────────────── */

function Figure1Table({ data }: { data: Figure1Row[] }) {
  const [sortKey, setSortKey] = useState<keyof Figure1Row | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Figure1Row) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const SortIcon = ({ col }: { col: keyof Figure1Row }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const cols: { key: keyof Figure1Row; label: string; align?: string }[] = [
    { key: 'period', label: 'Year / Quarter' },
    { key: 'ae', label: 'a / e' },
    { key: 'yri_level', label: 'Yardeni Research - Level', align: 'right' },
    { key: 'yri_yoy', label: 'y/y%', align: 'right' },
    { key: 'consensus_level', label: 'Analysts\' Consensus - Level', align: 'right' },
    { key: 'consensus_yoy', label: 'y/y%', align: 'right' },
  ];

  return (
    <div className="w-full aspect-[794/1042] p-4 md:p-5 bg-white flex flex-col items-center">
      <div className="w-full h-full border-[3px] border-[#333] bg-white shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full text-[12px] border-collapse bg-white">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#2d6a54] text-white">
            {cols.map(c => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`px-2 py-1.5 font-bold cursor-pointer hover:bg-[#245845] transition-colors select-none whitespace-nowrap border-b border-[#333] border-r last:border-r-0 border-white/20 ${c.align === 'right' ? 'text-right' : 'text-center'}`}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label} <SortIcon col={c.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isYear = !row.period.includes('Q');
            return (
              <tr
                key={i}
                className={`border-b border-gray-100 transition-colors hover:bg-[#e8f5ee] ${isYear ? 'bg-[#f0f7f4] font-semibold' : 'bg-white'}`}
              >
                <td className="px-2 py-0.5 text-center font-semibold text-gray-800 border-r border-gray-300">{row.period}</td>
                <td className="px-2 py-0.5 text-center border-r border-gray-300">
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${row.ae === 'e' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {row.ae}
                  </span>
                </td>
                <td className="px-2 py-1 text-center font-mono font-semibold text-gray-800 border-r border-gray-300">{row.yri_level.toFixed(1)}</td>
                <td className={`px-2 py-1 text-center font-mono font-semibold border-r border-gray-300 ${row.yri_yoy >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{row.yri_yoy.toFixed(1)}</td>
                <td className="px-2 py-1 text-center font-mono font-semibold text-gray-800 border-r border-gray-300">{row.consensus_level.toFixed(1)}</td>
                <td className={`px-2 py-1 text-center font-mono font-semibold ${row.consensus_yoy >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{row.consensus_yoy.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable Table for Figure 2 ────────────────────────────────────── */

function Figure2Table({ data }: { data: Figure2Row[] }) {
  const [sortKey, setSortKey] = useState<keyof Figure2Row | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Figure2Row) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const SortIcon = ({ col }: { col: keyof Figure2Row }) => {
    if (sortKey !== col) return <ArrowUpDown size={11} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const cols: { key: keyof Figure2Row; label: string; align?: string }[] = [
    { key: 'period', label: 'Year / Quarter' },
    { key: 'ae', label: 'a/e' },
    { key: 'revenue_growth', label: 'Rev Growth y/y%', align: 'right' },
    { key: 'revenue', label: 'Revenue ($)', align: 'right' },
    { key: 'earnings', label: 'Earnings ($)', align: 'right' },
    { key: 'profit_margin', label: 'Profit Margin %', align: 'right' },
  ];

  return (
    <div className="w-full aspect-[794/1042] p-4 md:p-5 bg-white flex flex-col items-center">
      <div className="w-full h-full border-[3px] border-[#333] bg-white shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full text-[12px] border-collapse bg-white">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#2d6a54] text-white">
            {cols.map(c => (
              <th
                key={c.key}
                onClick={() => handleSort(c.key)}
                className={`px-2 py-1.5 font-bold cursor-pointer hover:bg-[#245845] transition-colors select-none whitespace-nowrap border-b border-[#333] border-r last:border-r-0 border-white/20 ${c.align === 'right' ? 'text-right' : 'text-center'}`}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label} <SortIcon col={c.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isYear = !row.period.includes('Q');
            return (
              <tr
                key={i}
                className={`border-b border-gray-100 transition-colors hover:bg-[#e8f5ee] ${isYear ? 'bg-[#f0f7f4] font-semibold' : 'bg-white'}`}
              >
                <td className="px-2 py-0.5 text-center font-semibold text-gray-800 border-r border-gray-300">{row.period}</td>
                <td className="px-2 py-0.5 text-center border-r border-gray-300">
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${row.ae === 'e' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {row.ae}
                  </span>
                </td>
                <td className={`px-2 py-1 text-center font-mono font-semibold border-r border-gray-300 ${row.revenue_growth == null ? 'text-gray-400' : row.revenue_growth >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  {row.revenue_growth != null ? `${row.revenue_growth.toFixed(1)}` : 'na'}
                </td>
                <td className="px-2 py-1 text-center font-mono font-semibold text-gray-800 border-r border-gray-300">{row.revenue.toFixed(1)}</td>
                <td className="px-2 py-1 text-center font-mono font-semibold text-gray-800 border-r border-gray-300">{row.earnings.toFixed(1)}</td>
                <td className="px-2 py-1 text-center font-mono font-semibold text-gray-800">{row.profit_margin.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function YRIEarningsOutlookPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Toggle state: which figures are showing table vs image
  const [tableMode, setTableMode] = useState<Record<number, boolean>>({});

  // Data for figures 1 & 2
  const [fig1Data, setFig1Data] = useState<Figure1Row[] | null>(null);
  const [fig2Data, setFig2Data] = useState<Figure2Row[] | null>(null);

  // Load data on demand
  const loadFigureData = async (figId: number) => {
    try {
      const res = await fetch(`/yri-earnings/figure${figId}_data.json`);
      if (!res.ok) return;
      const json = await res.json();
      if (figId === 1) setFig1Data(json);
      if (figId === 2) setFig2Data(json);
    } catch (e) {
      console.error(`Failed to load figure${figId} data:`, e);
    }
  };

  const toggleTableMode = async (figId: number) => {
    const isCurrentlyTable = tableMode[figId];
    if (!isCurrentlyTable) {
      // Switching to table — load data if not loaded
      if (figId === 1 && !fig1Data) await loadFigureData(1);
      if (figId === 2 && !fig2Data) await loadFigureData(2);
    }
    setTableMode(prev => ({ ...prev, [figId]: !prev[figId] }));
  };

  const hasTableData = (figId: number) => figId === 1 || figId === 2;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-6 md:px-12 w-full">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a2332] tracking-tight mb-4">
                YRI Earnings Outlook
              </h1>
              <div className="inline-block bg-[#e2f0ea] border border-[#d2e6de] text-[#2c7a62] px-4 py-1.5 rounded-md font-semibold text-sm shadow-sm">
                13 Charts
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded text-sm shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 transition-colors font-medium border-r border-gray-200 ${
                  viewMode === 'grid' 
                    ? 'bg-[#317d69] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid size={16} />
                Grid
              </button>
              <button 
                onClick={() => setViewMode('detail')}
                className={`flex items-center gap-2 px-4 py-2 transition-colors font-medium ${
                  viewMode === 'detail' 
                    ? 'bg-[#317d69] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
                Detail
              </button>
            </div>
          </div>

          {/* Source disclosure (financial-concept audit, 2026-10-20): these figures are
              NOT computed by the REBH engine and NOT Saudi Exchange data. Labels such as
              "Yardeni Research" and "Analysts' Consensus" belong to the US-market
              publication these static figures/tables were taken from, and rows flagged
              "e" are that publication's forward estimates, not reported results. */}
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <p className="font-bold">Third-party US-market research — reproduced, not computed here.</p>
            <p className="mt-1">
              Every figure on this page (and its table) comes from a published U.S. equity
              earnings-outlook report covering the <strong>S&amp;P 500</strong>; the images and JSON
              under <code>/yri-earnings/</code> are served as received. Column labels
              &ldquo;Yardeni Research&rdquo; and &ldquo;Analysts&apos; Consensus&rdquo; are that
              source&apos;s own terms for its forward estimates and the consensus it cites. Rows
              marked <span className="font-mono">a</span> are actuals; rows marked
              <span className="font-mono"> e</span> are estimates belonging to the source, not
              reported results. Nothing here is Tadawul / Saudi Exchange data, nothing is produced by
              the REBH engine, and no buy/sell/hold recommendation is implied.
            </p>
            <p dir="rtl" className="mt-1">
              هذه الرسوم منشور خارجي عن سوق الأسهم الأمريكية (S&amp;P 500) ويُعرض كما ورد؛ وهو ليس
              بيانات «تداول» ولا من حسابات محرك رابح، والصفوف المعلَمة (e) تقديرية لدى المصدر وليست
              نتائج معلنة، ولا تُعدّ هذه الصفحة توصية بالشراء أو البيع.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Space */}
      <div className="p-6 md:px-12 py-10">
        <div className="max-w-[1400px] mx-auto">
          
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 xl:grid-cols-2' 
              : 'grid-cols-1 max-w-5xl mx-auto'
          }`}>
            {chartsData.map((chart) => {
              const isTable = tableMode[chart.id];
              const canToggle = hasTableData(chart.id);

              return (
                <div 
                  key={chart.id} 
                  className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300"
                >
                  {/* Card Header */}
                  <div className="p-5 md:p-6 pb-4 flex items-start gap-4 border-b border-gray-50">
                    <div className="bg-[#eaf4ef] border border-[#cae4d8] text-[#2c7a62] px-3 py-1 rounded text-sm font-semibold shrink-0">
                      Figure {chart.id}
                    </div>
                    <h2 className="text-[#1a2332] font-bold text-lg leading-tight pt-0.5 uppercase flex-1">
                      {chart.title}
                    </h2>

                    {/* Toggle Button — only for figures with table data */}
                    {canToggle && (
                      <button
                        onClick={() => toggleTableMode(chart.id)}
                        title={isTable ? 'Show image' : 'Show interactive table'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
                          isTable
                            ? 'bg-[#2d6a54] text-white border-[#2d6a54] hover:bg-[#245845]'
                            : 'bg-white text-[#2d6a54] border-[#2d6a54] hover:bg-[#eaf4ef]'
                        }`}
                      >
                        <ArrowLeftRight size={13} />
                        <span>{isTable ? 'Image' : 'Table'}</span>
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 flex flex-col bg-white">
                    {isTable && chart.id === 1 && fig1Data ? (
                      <Figure1Table data={fig1Data} />
                    ) : isTable && chart.id === 2 && fig2Data ? (
                      <Figure2Table data={fig2Data} />
                    ) : (
                      <div 
                        className="cursor-zoom-in"
                        onClick={() => setLightboxIndex(chart.id - 1)}
                      >
                        <div className="relative w-full overflow-hidden">
                          <img 
                            src={`/yri-earnings/figure${chart.id}.png`}
                            alt={chart.title}
                            className="w-full h-auto"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="p-12 text-center text-gray-500 font-medium w-full min-h-[300px] flex flex-col items-center justify-center border-t border-gray-100 bg-[#fcfcfc]"><p>Image Not Found</p><p class="text-xs text-gray-400 mt-2 font-mono">public/yri-earnings/figure${chart.id}.png</p></div>`;
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[40] bg-[#0a0a0a]/95 flex flex-col pt-24 pb-6 px-4 md:px-8 md:pt-32 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar (Title & Close Button) */}
          <div className="w-full flex items-start justify-between z-[101] shrink-0 mb-4 gap-4">
            {/* Title on the Left */}
            <div 
              className="bg-[#1f1f1f] px-4 py-2.5 md:px-6 md:py-3 text-white font-bold text-xs md:text-sm rounded border border-white/10 uppercase tracking-widest shadow-2xl shrink max-w-[85%]"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-gray-500 mr-2 border-r border-gray-600 pr-2">Figure {chartsData[lightboxIndex].id}</span>
              {chartsData[lightboxIndex].title}
            </div>
            
            {/* Close Button on the Right */}
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              className="bg-[#1f1f1f] hover:bg-[#333] text-gray-300 hover:text-white p-2.5 rounded border border-white/10 transition-colors shadow-2xl shrink-0"
              title="Close"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Image Container (Takes available space) */}
          <div 
            className="flex-1 relative w-full min-h-0 flex items-center justify-center z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
             <Image 
               src={`/yri-earnings/figure${chartsData[lightboxIndex].id}.png`}
               alt={chartsData[lightboxIndex].title}
               fill
               className="object-contain"
               priority
             />
          </div>

          {/* Bottom Bar: Prev / Next / Counter */}
          <div 
            className="w-full flex items-center justify-center z-[101] shrink-0 mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-6 bg-[#1f1f1f] border border-white/10 px-4 py-2 rounded shadow-2xl text-white">
              <button 
                 className={`p-2 hover:bg-white/10 rounded transition-colors ${lightboxIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                 onClick={() => lightboxIndex > 0 && setLightboxIndex(lightboxIndex - 1)}
                 disabled={lightboxIndex === 0}
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              
              <span className="font-semibold text-sm tracking-widest min-w-[80px] text-center">
                 {lightboxIndex + 1} <span className="text-gray-500/50 mx-1">/</span> {chartsData.length}
              </span>
              
              <button 
                 className={`p-2 hover:bg-white/10 rounded transition-colors ${lightboxIndex === chartsData.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                 onClick={() => lightboxIndex < chartsData.length - 1 && setLightboxIndex(lightboxIndex + 1)}
                 disabled={lightboxIndex === chartsData.length - 1}
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
