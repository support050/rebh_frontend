import { useMemo } from 'react';
import { StockData, getCatText } from './types';

interface EventGroupDef {
    title: string;
    filterFn: (s: StockData) => boolean;
    color: string;
    bgColor: string;
    borderColor: string;
}

/** Event groups — same order & rules as REBH-RS-Rating-MOBILE.html renderEvents() */
const EVENT_GROUPS_DEF: EventGroupDef[] = [
    {
        title: '🚀 Crossed above 90',
        filterFn: (s) => s.rs >= 90 && s.rs1w != null && s.rs1w < 90,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
    },
    {
        title: '⤴ Crossed above 80',
        // HTML: cross80 && !cross90
        filterFn: (s) => s.rs >= 80 && s.rs < 90 && s.rs1w != null && s.rs1w < 80,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200'
    },
    {
        title: '🏔 RS at 1-year high',
        filterFn: (s) => !!(s.rsnh ?? s.sig?.includes('rsnh')),
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
    },
    {
        title: '🔵 RS line led price',
        filterFn: (s) => s.sig?.includes('blue') ?? false,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
    },
    {
        title: '🎯 Focus list',
        filterFn: (s) => !!(s.focus ?? s.sig?.includes('focus')),
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
    },
    {
        title: '🛡 Resilient in down tape',
        filterFn: (s) => !!(s.res ?? s.sig?.includes('res')),
        color: 'text-sky-700',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200'
    },
    {
        title: '⬆ Upgraded category',
        filterFn: (s) => s.sig?.includes('up') ?? false,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    },
    {
        title: '⬇ Downgraded category',
        filterFn: (s) => s.sig?.includes('dn') ?? false,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
    },
    {
        title: '🔻 Leaders under distribution',
        filterFn: (s) => !!(s.dist ?? s.sig?.includes('dist')),
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200'
    }
];

export function EventsTab({ stocks }: { stocks: StockData[] }) {
    const eventData = useMemo(() => {
        return EVENT_GROUPS_DEF.map(g => ({
            title: g.title,
            color: g.color,
            bgColor: g.bgColor,
            borderColor: g.borderColor,
            items: stocks.filter(g.filterFn).sort((a, b) => b.rs - a.rs),
        })).filter(g => g.items.length > 0); // HTML hides empty groups
    }, [stocks]);

    const totalEvents = eventData.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <span className="font-extrabold text-sm">RS Events</span>
                <span className="text-xs text-gray-500">Everything that changed this week</span>
                <div className="flex-1" />
                <span className="text-xs text-gray-400">{totalEvents} events</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {eventData.map(group => (
                    <div key={group.title} className={`border ${group.borderColor} rounded-xl overflow-hidden shadow-xs`}>
                        <div className={`${group.bgColor} px-3 py-2.5 border-b ${group.borderColor}`}>
                            <div className="flex items-baseline justify-between">
                                <span className={`font-bold text-xs tracking-wide ${group.color}`}>{group.title}</span>
                                <span className={`font-extrabold text-sm ${group.color}`}>{group.items.length}</span>
                            </div>
                        </div>
                        <div className="max-h-[260px] overflow-y-auto bg-white min-h-[60px] flex flex-col justify-center">
                            {group.items.map(st => (
                                <div key={st.s} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors text-xs">
                                    <span className="font-bold font-mono text-gray-900 w-12">{st.s}</span>
                                    <span className="truncate flex-1 text-gray-600">{st.c}</span>
                                    <span className={`font-extrabold font-mono ${getCatText(st.cat)}`}>{st.rs}</span>
                                    <span className={`text-[10px] font-semibold ${st.mom >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {st.mom >= 0 ? '+' : ''}{st.mom}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {eventData.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 text-sm">
                        No significant RS events this week.
                    </div>
                )}
            </div>
        </div>
    );
}
