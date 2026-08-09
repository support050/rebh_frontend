import { useState, useMemo } from 'react';
import { StockData } from './types';

type Theme = 'green' | 'blue' | 'amber' | 'red';

/** Category meta — exact ranges from REBH-RS-Rating-MOBILE.html CATMETA */
const CATMETA: { cat: string; range: string; theme: Theme }[] = [
    { cat: 'STRONG', range: '≥90', theme: 'green' },
    { cat: 'IMPROVE', range: '80–89', theme: 'blue' },
    { cat: 'NEUTRAL', range: '70–79', theme: 'amber' },
    { cat: 'WEAK', range: '<70', theme: 'red' },
];

export function MatrixTab({ stocks }: { stocks: StockData[] }) {
    const [viewMode, setViewMode] = useState<'cards' | 'quad'>('cards');

    const groups = useMemo(() => ({
        STRONG: stocks.filter(s => s.cat === 'STRONG').sort((a, b) => b.rs - a.rs),
        IMPROVE: stocks.filter(s => s.cat === 'IMPROVE').sort((a, b) => b.rs - a.rs),
        NEUTRAL: stocks.filter(s => s.cat === 'NEUTRAL').sort((a, b) => b.rs - a.rs),
        WEAK: stocks.filter(s => s.cat === 'WEAK').sort((a, b) => b.rs - a.rs),
    }), [stocks]);

    const topGroup = (cat: string) => {
        const m: Record<string, number> = {};
        (groups[cat as keyof typeof groups] || []).forEach(x => {
            m[x.grp] = (m[x.grp] || 0) + 1;
        });
        const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
        return e ? `${e[0]} (${e[1]})` : '—';
    };

    const stats = useMemo(() => {
        const total = stocks.length || 1;
        return {
            STRONG: { count: groups.STRONG.length, pct: ((groups.STRONG.length / total) * 100).toFixed(1) },
            IMPROVE: { count: groups.IMPROVE.length, pct: ((groups.IMPROVE.length / total) * 100).toFixed(1) },
            NEUTRAL: { count: groups.NEUTRAL.length, pct: ((groups.NEUTRAL.length / total) * 100).toFixed(1) },
            WEAK: { count: groups.WEAK.length, pct: ((groups.WEAK.length / total) * 100).toFixed(1) },
        };
    }, [stocks, groups]);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-4 border-b border-gray-200">
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'cards' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >Cards</button>
                    <button
                        onClick={() => setViewMode('quad')}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'quad' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >Quadrant</button>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-gray-500">Category vs last week (RS 1W ago)</span>
            </div>

            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                    {CATMETA.map(({ cat, range, theme }) => (
                        <MatrixCard
                            key={cat}
                            title={cat}
                            subtitle={`Top group: ${topGroup(cat)}`}
                            range={range}
                            list={groups[cat as keyof typeof groups]}
                            stats={stats[cat as keyof typeof stats]}
                            theme={theme}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-0.5 p-4 min-h-[500px]">
                    {/* Same layout as HTML: NEUTRAL | STRONG / WEAK | IMPROVE */}
                    <QuadCell title={`NEUTRAL · ${stats.NEUTRAL.count} · ${stats.NEUTRAL.pct}%`} list={groups.NEUTRAL} theme="amber" />
                    <QuadCell title={`STRONG · ${stats.STRONG.count} · ${stats.STRONG.pct}%`} list={groups.STRONG} theme="green" />
                    <QuadCell title={`WEAK · ${stats.WEAK.count} · ${stats.WEAK.pct}%`} list={groups.WEAK.slice(0, 60)} theme="red" />
                    <QuadCell title={`IMPROVE · ${stats.IMPROVE.count} · ${stats.IMPROVE.pct}%`} list={groups.IMPROVE} theme="blue" />
                </div>
            )}
        </div>
    );
}

function MatrixCard({ title, subtitle, range, list, stats, theme }: {
    title: string; subtitle: string; range: string;
    list: StockData[]; stats: { count: number; pct: string }; theme: Theme;
}) {
    const styles: Record<Theme, { bg: string; text: string; dot: string; bar: string }> = {
        green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', bar: 'bg-green-600' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', bar: 'bg-blue-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', bar: 'bg-amber-500' },
        red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', bar: 'bg-red-600' },
    };
    const s = styles[theme];

    return (
        <div className="border border-gray-200 rounded-xl flex flex-col overflow-hidden">
            <div className={`${s.bg} p-3 border-b border-gray-200 relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.bar}`} />
                <div className="flex items-baseline justify-between">
                    <span className={`font-extrabold text-sm tracking-wide ${s.text}`}>{title}</span>
                    <span className={`font-extrabold text-lg ${s.text}`}>{stats.count}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{range} · {stats.pct}%</div>
            </div>
            <div className="px-3 py-2 border-b border-gray-100 text-[10.5px] text-gray-500">
                🏆 {subtitle}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[330px]">
                {list.map(st => (
                    <div key={st.s} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer text-xs font-semibold">
                        <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${s.dot}`} />
                        <span className="truncate flex-1 text-gray-700">{st.c}</span>
                        {st.sig?.includes('up') && <span className="text-[9px] font-bold text-green-600">⬆</span>}
                        {st.sig?.includes('dn') && <span className="text-[9px] font-bold text-red-600">⬇</span>}
                        {st.sig?.includes('blue') && <span className="text-[9px]">🔵</span>}
                        <span className="font-mono font-bold text-gray-800">{st.rs}</span>
                    </div>
                ))}
                {list.length === 0 && <div className="p-4 text-xs text-gray-400 text-center">No stocks</div>}
            </div>
        </div>
    );
}

function QuadCell({ title, list, theme }: { title: string; list: StockData[]; theme: Theme }) {
    const styles: Record<Theme, { bg: string; text: string }> = {
        green: { bg: 'bg-green-50', text: 'text-green-700' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
        red: { bg: 'bg-red-50', text: 'text-red-700' },
    };
    const s = styles[theme];

    return (
        <div className={`${s.bg} rounded-xl p-4 min-h-[230px] flex flex-col`}>
            <h3 className={`font-extrabold text-xs tracking-wider mb-3 ${s.text}`}>{title}</h3>
            <div className="flex flex-wrap gap-1.5 overflow-y-auto content-start flex-1">
                {list.map(st => (
                    <div key={st.s} className="bg-white/80 border border-white/50 rounded-md px-2 py-1 text-[10.5px] font-mono font-bold text-gray-800 shadow-sm flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-shadow">
                        {st.c}
                    </div>
                ))}
            </div>
        </div>
    );
}
