"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api/authFetch";

interface CouncilMember {
  name: string;
  group: string;
  text: string;
  star: string;
}

interface CouncilResponse {
  statement: string;
  pass_count: number;
  total_count: number;
  council: CouncilMember[];
}

export function CouncilSignoffTab() {
  const [data, setData] = useState<CouncilResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCouncil() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/terminal/council/");
        if (!res.ok) {
          throw new Error(`Failed to load Council data (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load Council data");
          setLoading(false);
        }
      }
    }

    loadCouncil();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
          Unanimous sign-off{" "}
          <span className="font-normal text-[10px] text-[#9CA3AF]">
            · each name signs the specific part their methodology governs · all verdicts follow executed checks, not vibes
          </span>
        </h3>

        {loading ? (
          <div className="p-12 text-center flex items-center justify-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#8C3B32] border-t-transparent" />
          </div>
        ) : error || !data ? (
          <div className="m-4 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-center text-[12px] text-[#DC2626]">
            ⚠️ {error || "Failed to load Council signoff"}
          </div>
        ) : (
          <>
            <div className="mx-4 my-3 rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] p-3.5 text-[11px] leading-relaxed text-[#6B7280]">
              <b className="text-[#1A1A1A]">The joint statement:</b> &ldquo;{data.statement}&rdquo;
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.council.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-[4px] border border-[#E5E7EB] bg-white p-3 text-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <div>
                    <b className={c.star ? "text-[#8C3B32]" : "text-[#16A34A]"}>
                      {c.star || "✓"}
                    </b>{" "}
                    <b className="text-[#1A1A1A]">{c.name}</b>{" "}
                    <span className="text-[9.5px] text-[#9CA3AF]">{c.group}</span>
                  </div>
                  <div className="mt-1 font-sans text-[#6B7280]">{c.text}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
              Verdicts marked ✦ = &quot;achieves what I do — and better&quot;. Verified against {data.pass_count} / {data.total_count} passing financial statements in active repository.
            </div>
          </>
        )}
      </div>
    </div>
  );
}