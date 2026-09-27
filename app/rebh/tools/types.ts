export interface CompanyItem {
    sym: string;
    n: string;
    sec: string;
    px: number;
    mc: number;
    pe?: number;
    pb?: number;
    roe?: number;
    g_net?: number;
    g_rev?: number;
    f_score?: number;
    fresh?: boolean;
    ncav?: number;
    pncav?: number;
    peg?: number;
    period?: string;
    end?: string;
    period_end?: string;
}