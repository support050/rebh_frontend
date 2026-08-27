"use client";

import type { CompanyTemplate, RowData } from "../types";
import { yoySeries, lastYoY, fmtM } from "../utils";

export interface Signal {
  neg: boolean;
  h: string;
  confText?: string;
  confOk?: boolean;
  tag: string;
}

/**
 * Rules engine — computes all signals from the company's row data.
 * Implements all 6 rules from the HTML mockup:
 *   1. Multi-quarter acceleration / deceleration
 *   2. Operating leverage
 *   3. Provisions vs income growth
 *   4. Sign flip detection
 *   5. Structural balance-sheet jumps (aux)
 *   6. Gross margin improvement streak
 */
export function engineSignals(C: CompanyTemplate, isPriceAboveMa: boolean): Signal[] {
  const out: Signal[] = [];
  const pct = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(0) + "%";
  const getConf = (pos: boolean) =>
    pos
      ? {
          confText: isPriceAboveMa ? "✓ السعر يؤكد (فوق MA50)" : "✗ السعر لا يؤكد بعد",
          confOk: isPriceAboveMa,
        }
      : {
          confText: isPriceAboveMa ? "السعر لم يعكسها بعد (فوق MA50)" : "السعر يعكسها (تحت MA50)",
          confOk: !isPriceAboveMa,
        };

  // ── Rule 1: Acceleration / deceleration on key items ──
  C.rows
    .filter((r) => r.accel && !r.eps && r.v)
    .forEach((r) => {
      const ys = yoySeries(r.v!).filter((x): x is number => x != null);
      if (ys.length < 2) return;
      const lastv = ys[ys.length - 1];
      const prev = ys[ys.length - 2];
      let rising = 0;
      for (let i = ys.length - 1; i > 0 && ys[i] > ys[i - 1]; i--) rising++;

      if (ys.length >= 3 && rising >= 2 && lastv > 0) {
        const c = getConf(true);
        out.push({
          neg: false,
          h: `${r.ar}: تسارع ${rising + 1} أرباع متتالية (${ys
            .slice(-Math.min(4, ys.length))
            .map(pct)
            .join(" ← ")})`,
          confText: c.confText,
          confOk: c.confOk,
          tag: "قاعدة: التسارع المتصل (منهج O'Neil/StockBee)",
        });
      } else if (ys.length >= 3 && rising >= 2 && lastv <= 0) {
        const c = getConf(true);
        out.push({
          neg: false,
          h: `${r.ar}: وتيرة الانكماش تتحسن (${ys
            .slice(-3)
            .map(pct)
            .join(" ← ")}) — ليس نمواً بعد`,
          confText: c.confText,
          confOk: c.confOk,
          tag: "قاعدة: انكماش يتباطأ — تعافٍ دوري مبكر محتمل (Lynch)",
        });
      } else if (ys.length >= 3 && lastv < prev && prev >= 20) {
        const c = getConf(false);
        out.push({
          neg: true,
          h: `${r.ar}: تباطؤ بعد ذروة نمو — من ${pct(prev)} إلى ${pct(lastv)} في الربع الأخير. بند مراقبة`,
          confText: c.confText,
          confOk: c.confOk,
          tag: "قاعدة: كسر نمط التسارع — التباطؤ بعد الذروة لحظة الحذر عند O'Neil",
        });
      }
    });

  // ── Rule 2: Operating leverage ──
  const inc = C.rows.find((r) => r.t === "total" && !r.net) || C.rows.find((r) => r.accel && !r.eps);
  const opx = C.rows.find((r) => r.opex);
  if (inc?.v && opx?.v) {
    const gi = lastYoY(inc.v);
    const go = lastYoY(opx.v);
    if (gi != null && go != null && gi - go > 2) {
      const c = getConf(true);
      out.push({
        neg: false,
        h: `رافعة تشغيلية إيجابية: الدخل ${pct(gi)} مقابل مصاريف ${pct(go)} — فارق ${(gi - go).toFixed(1)} نقطة`,
        confText: c.confText,
        confOk: c.confOk,
        tag: "قاعدة: نمو الدخل − نمو المصاريف > 2 نقطة",
      });
    }
  }

  // ── Rule 3: Provisions vs income monitoring ──
  const prov = C.rows.find((r) => r.prov);
  if (prov?.v && inc?.v) {
    const gp = lastYoY(prov.v);
    const gi2 = lastYoY(inc.v);
    if (gp != null && gi2 != null && gp > gi2 + 5) {
      const c = getConf(false);
      out.push({
        neg: true,
        h: `${prov.ar} ينمو أسرع من الدخل: ${pct(gp)} مقابل ${pct(gi2)} — ضغط على جودة الأرباح`,
        confText: c.confText,
        confOk: c.confOk,
        tag: "قاعدة: نمو المخصص/المطالبات > نمو الدخل + 5 نقاط",
      });
    } else if (gp != null && gp < 0) {
      const c = getConf(true);
      out.push({
        neg: false,
        h: `المخصصات تنخفض (${pct(gp)}) مع استمرار نمو المحفظة — تحسن جودة ائتمان`,
        confText: c.confText,
        confOk: c.confOk,
        tag: "قاعدة: انخفاض المخصص مع نمو الدخل",
      });
    }
  }

  // ── Rule 4: Sign flip detection ──
  C.rows
    .filter((r) => !r.t && !r.eps && r.v)
    .forEach((r) => {
      const v = r.v!.filter((x): x is number => x != null);
      if (
        v.length >= 4 &&
        Math.sign(v[v.length - 1]) !== Math.sign(v[v.length - 2]) &&
        Math.abs(v[v.length - 1]) > Math.abs(v[v.length - 2]) * 0.3
      ) {
        out.push({
          neg: v[v.length - 1] < 0,
          h: `${r.ar}: انقلاب إشارة — من ${fmtM(v[v.length - 2])} إلى ${fmtM(v[v.length - 1])} مليون.`,
          tag: "قاعدة: تغيّر إشارة البند بين ربعين",
        });
      }
    });

  // ── Rule 5: Structural balance-sheet jumps (aux) ──
  (C.aux || []).forEach((a) => {
    const g = lastYoY(a.v);
    if (g != null && Math.abs(g) > 40) {
      out.push({
        neg: false,
        h: `${a.ar}: ${pct(g)} خلال سنة — تحول هيكلي يستحق القراءة مع الإيضاحات.`,
        tag: "قاعدة: |التغير السنوي| > 40% في بند ميزانية (إشارة Druckenmiller)",
      });
    }
  });

  // ── Rule 6: Gross margin improvement streak ──
  const gross = C.rows.find((r) => r.gross);
  const rev = C.rows.find((r) => r.accel && !r.eps);
  if (gross?.v && rev?.v) {
    const m = gross.v.map((g, i) => (g != null && rev.v![i] ? (g as number) / (rev.v![i] as number) : 0));
    let streak = 0;
    for (let i = m.length - 1; i > 0 && m[i] > m[i - 1]; i--) streak++;
    if (streak >= 3) {
      const c = getConf(true);
      out.push({
        neg: false,
        h: `هامش الربح الإجمالي° يتحسن ${streak + 1} أرباع متتالية (${(m[m.length - streak - 1] * 100).toFixed(1)}% ← ${(m[m.length - 1] * 100).toFixed(1)}%)`,
        confText: c.confText,
        confOk: c.confOk,
        tag: "قاعدة: سلسلة تحسن الهامش (إشارة Minervini المبكرة)",
      });
    }
  }

  return out.slice(0, 5);
}