import { MOCK_STOCK_DATA } from "../data/mockData";
import { StockHeader } from "../_components/StockHeader";
import { StockTabs } from "../_components/StockTabs";
import { StocksTopBar } from "../_components/StocksTopBar";
import { API_BASE_URL } from "@/lib/api/config";

async function getCompanyName(symbol: string): Promise<string> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scraper/companies/${symbol}`, {
            next: { revalidate: 604800 },
        });
        if (!res.ok) return symbol;
        const data = await res.json();
        return data.name_en || data.name_ar || symbol;
    } catch {
        return symbol;
    }
}

export default async function StockLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ symbol: string }>;
}) {
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol?.toUpperCase() || MOCK_STOCK_DATA.symbol;
    const name = await getCompanyName(symbol);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StocksTopBar />

            <StockHeader
                symbol={symbol}
                name={name}
                price={MOCK_STOCK_DATA.price}
                change={MOCK_STOCK_DATA.change}
                changePercent={MOCK_STOCK_DATA.changePercent}
                marketTime={MOCK_STOCK_DATA.marketTime}
                exchange={MOCK_STOCK_DATA.exchange}
                currency={MOCK_STOCK_DATA.currency}
            />

            <StockTabs />

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
