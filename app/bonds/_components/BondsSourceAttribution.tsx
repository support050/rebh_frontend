'use client';

import { BONDS_FONT, BONDS_ATTRIBUTION } from '../_data/bondsDesign';

/**
 * The mandated source citation, rendered at the foot of each of the three
 * /bonds Treasury pages. The wording is fixed by the compliance brief and kept
 * verbatim in BONDS_ATTRIBUTION so it can never drift.
 */
export default function BondsSourceAttribution({ detail }: { detail?: string | null }) {
  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-gray-100 pt-3"
      style={{ fontFamily: BONDS_FONT, fontSize: 12, color: '#6b7280' }}
    >
      <span>
        {BONDS_ATTRIBUTION}
      </span>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
