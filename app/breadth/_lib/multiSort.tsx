/**
 * Multi-column sorting with priority numbers — shared utilities.
 *
 * Mirrors the pattern used in `/industry-groups`: clicking a column header
 * cycles through add-asc → toggle-desc → remove, with a visual priority
 * badge (① ② ③) showing the sort order. Multiple columns can be active
 * simultaneously; rows are compared sequentially through the priority queue.
 */
'use client';
import React, { useCallback, useMemo, useState } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/** A sort value — numbers compare numerically, strings lexically, nulls last. */
export type SortValue = number | string | null | undefined;

/**
 * Hook that manages multi-column sort state and provides a sorted view.
 *
 * @param getValue  Extracts the comparison value for a given row + column key.
 *                  Return `null`/`undefined` to push the row to the bottom.
 */
export function useMultiSort<T>(getValue: (row: T, key: string) => SortValue) {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  /** 3-state cycle: not-present → asc, asc → desc, desc → remove. */
  const handleSort = useCallback((key: string) => {
    setSortConfigs((prev) => {
      const idx = prev.findIndex((c) => c.key === key);
      if (idx === -1) return [...prev, { key, direction: 'asc' as const }];
      if (prev[idx].direction === 'asc') {
        const next = [...prev];
        next[idx] = { ...next[idx], direction: 'desc' as const };
        return next;
      }
      // desc → remove
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  /** Clear all sort columns. */
  const clearSort = useCallback(() => setSortConfigs([]), []);

  /** Chained comparator: iterate configs in priority order. */
  const sortRows = useCallback(
    (rows: T[]): T[] => {
      if (sortConfigs.length === 0) return rows;
      return [...rows].sort((a, b) => {
        for (const config of sortConfigs) {
          const x = getValue(a, config.key);
          const y = getValue(b, config.key);

          // Nulls / undefined always sort last regardless of direction.
          const xNull = x == null || (typeof x === 'number' && !Number.isFinite(x));
          const yNull = y == null || (typeof y === 'number' && !Number.isFinite(y));
          if (xNull && yNull) continue;
          if (xNull) return 1;
          if (yNull) return -1;

          let diff: number;
          if (typeof x === 'number' && typeof y === 'number') {
            diff = x - y;
          } else {
            diff = String(x).localeCompare(String(y));
          }
          if (diff !== 0) return config.direction === 'asc' ? diff : -diff;
        }
        return 0;
      });
    },
    [sortConfigs, getValue],
  );

  return { sortConfigs, handleSort, clearSort, sortRows };
}

/**
 * Sort indicator matching the industry-groups visual style, adapted to use
 * breadth-module CSS variables (--blue, --text2) for light/dark theme support.
 *
 * Shows ▲/▼ + priority number badge when the column is active, or a faded
 * ▲▼ hint when idle to indicate clickability.
 */
export function SortIndicator({
  sortConfigs,
  colKey,
}: {
  sortConfigs: SortConfig[];
  colKey: string;
}) {
  const idx = sortConfigs.findIndex((c) => c.key === colKey);
  if (idx === -1) {
    return (
      <span
        style={{
          fontSize: 9,
          lineHeight: '8px',
          marginLeft: 2,
          opacity: 0.35,
          color: 'var(--text2)',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      >
        ▲▼
      </span>
    );
  }
  const config = sortConfigs[idx];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--blue)' }}>
        {config.direction === 'asc' ? '▲' : '▼'}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 15,
          height: 15,
          background: 'var(--blue)',
          color: '#fff',
          fontSize: 9,
          fontWeight: 'bold',
          borderRadius: '50%',
          lineHeight: 1,
        }}
      >
        {idx + 1}
      </span>
    </span>
  );
}
