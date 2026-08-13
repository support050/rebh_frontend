import { API_BASE_URL } from "./config";
import { authFetch, getCsrfToken } from "./authFetch";
import type {
  RiskFinanceRequest, RiskFinanceResponse,
  RBAFRequest, RBAFResponse,
  PortfolioRequest, PortfolioSummary,
  PortfolioPositionCreate, WalletPositionDB,
  MonthlyTrackerResponse, WalletTradeCreate, WalletTradeResponse,
  WeeklyStudyRequest, WeeklyStudyResponse
} from "@/types/wallet";

async function handleRes(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = errorData.detail || "Request failed";
    if (Array.isArray(msg)) msg = msg.map((m: any) => `${m.loc?.[m.loc.length-1]}: ${m.msg}`).join(", ");
    throw new Error(msg);
  }
  return response.json();
}

export async function calcRiskFinance(data: RiskFinanceRequest): Promise<RiskFinanceResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/calculator/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function calcRBAF(data: RBAFRequest): Promise<RBAFResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/rbaf/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function getRbafSettings(): Promise<RBAFRequest> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/rbaf/settings`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function analyzePortfolio(data: PortfolioRequest): Promise<PortfolioSummary> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function fetchPortfolioPositions(): Promise<WalletPositionDB[]> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function createPortfolioPosition(data: PortfolioPositionCreate): Promise<WalletPositionDB> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function closePortfolioPosition(id: number, data: { sell_price: number; exit_date: string }): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions/${id}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function deletePortfolioPosition(id: number): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions/${id}`, {
    method: "DELETE",
    headers: { "x-csrf-token": getCsrfToken() },
    credentials: "include",
  });
  if (response.status === 204) return null;
  return handleRes(response);
}

export async function getMonthlyTracker(year: number): Promise<MonthlyTrackerResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/tracker/${year}`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function createMonthlyTrade(data: WalletTradeCreate): Promise<WalletTradeResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/tracker/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function calcMonthlyTracker(year: number, trades: any[]): Promise<MonthlyTrackerResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/tracker/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify({ year, trades }),
  });
  return handleRes(response);
}

export async function getEmptyTracker(year: number): Promise<MonthlyTrackerResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/tracker/${year}`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function getWeeklyStudy(): Promise<WeeklyStudyResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/weekly/latest`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function updateWeeklyStudy(data: WeeklyStudyRequest): Promise<WeeklyStudyResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/weekly/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function getLatestPrice(symbol: string): Promise<{ symbol: string; close: number; date: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/calculator/price/${symbol}`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function updatePortfolioPosition(id: number, data: any): Promise<WalletPositionDB> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function addSharesToPosition(id: number, data: { qty: number; buy_price: number; trade_date: string }): Promise<WalletPositionDB> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions/${id}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function partialSellPosition(id: number, data: { qty: number; sell_price: number; trade_date: string }): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/positions/${id}/sell`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleRes(response);
}

export async function getPortfolioTransactions(): Promise<any[]> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/transactions`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function getPortfolioEvents(): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/events`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function getPortfolioPerformance(): Promise<any[]> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/performance`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function getPortfolioCash(): Promise<{ cash: number }> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/settings/cash`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function updatePortfolioCash(cash: number): Promise<{ cash: number }> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/settings/cash`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify({ cash }),
  });
  return handleRes(response);
}

export async function getPortfolioSummary(): Promise<{
  total_value: number;
  stocks_value: number;
  total_cost: number;
  cash: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  realized_pnl: number;
  num_positions: number;
}> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/summary`, {
    credentials: "include",
  });
  return handleRes(response);
}

export async function getPortfolioRealizedPnl(): Promise<any[]> {
  const response = await authFetch(`${API_BASE_URL}/api/wallet/portfolio/realized-pnl`, {
    credentials: "include",
  });
  return handleRes(response);
}
