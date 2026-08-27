'use client';

import type React from 'react';
import type { TerminalTokens } from './terminalTheme';

/**
 * Global reactive styles for the Financial Terminal.
 * Ensures 100% proper contrast in Dark and Light modes.
 */
export function TerminalGlobalStyles({ theme }: { theme: TerminalTokens }) {
  return (
    <style jsx global>{`
      /* ── Light Mode Explicit ── */
      .terminal-root[data-theme="light"] {
        background-color: #f9f9f7 !important;
        color: #0b0b0b !important;
      }

      /* ── Dark Mode Explicit — All numbers, bolds, and dark texts become White (#f2f1ed) ── */
      .terminal-root[data-theme="dark"],
      .terminal-root.dark {
        background-color: #0d0d0d !important;
        color: #f2f1ed !important;
      }

      /* All primary black/dark numbers and text become bright white in Dark Mode */
      .terminal-root[data-theme="dark"] [class*="text-[#1A1A1A]"],
      .terminal-root[data-theme="dark"] [class*="text-[#1a1a1a]"],
      .terminal-root[data-theme="dark"] [class*="text-[#0F172A]"],
      .terminal-root[data-theme="dark"] [class*="text-[#0f172a]"],
      .terminal-root[data-theme="dark"] [class*="text-[#111827]"],
      .terminal-root[data-theme="dark"] .text-black,
      .terminal-root[data-theme="dark"] .text-gray-900,
      .terminal-root[data-theme="dark"] .text-neutral-900,
      .terminal-root[data-theme="dark"] table td,
      .terminal-root[data-theme="dark"] .tabular-nums,
      .terminal-root[data-theme="dark"] b,
      .terminal-root[data-theme="dark"] strong,
      .terminal-root[data-theme="dark"] .font-extrabold,
      .terminal-root[data-theme="dark"] .font-bold,
      .terminal-root[data-theme="dark"] h1,
      .terminal-root[data-theme="dark"] h2,
      .terminal-root[data-theme="dark"] h3,
      .terminal-root[data-theme="dark"] h4 {
        color: #f2f1ed !important;
      }

      /* Secondary labels in Dark Mode */
      .terminal-root[data-theme="dark"] [class*="text-[#6B7280]"],
      .terminal-root[data-theme="dark"] [class*="text-[#6b7280]"],
      .terminal-root[data-theme="dark"] .text-gray-500,
      .terminal-root[data-theme="dark"] .text-gray-600 {
        color: #c3c2b7 !important;
      }

      /* Muted / Subtitle text in Dark Mode */
      .terminal-root[data-theme="dark"] [class*="text-[#9CA3AF]"],
      .terminal-root[data-theme="dark"] [class*="text-[#9ca3af]"],
      .terminal-root[data-theme="dark"] .text-gray-400,
      .terminal-root[data-theme="dark"] small {
        color: #898781 !important;
      }

      /* Up / Growth Green Numbers */
      .terminal-root[data-theme="dark"] [class*="text-[#16A34A]"],
      .terminal-root[data-theme="dark"] [class*="text-[#16a34a]"],
      .terminal-root[data-theme="dark"] .text-green-600 {
        color: #0ca30c !important;
      }

      /* Down / Decline Red Numbers */
      .terminal-root[data-theme="dark"] [class*="text-[#DC2626]"],
      .terminal-root[data-theme="dark"] [class*="text-[#dc2626]"],
      .terminal-root[data-theme="dark"] .text-red-600 {
        color: #e66767 !important;
      }

      /* Accent / Blue / Star Highlight */
      .terminal-root[data-theme="dark"] [class*="text-[#8C3B32]"],
      .terminal-root[data-theme="dark"] [class*="text-[#8c3b32]"] {
        color: #3987e5 !important;
      }

      .terminal-root[data-theme="dark"] [class*="border-[#8C3B32]"],
      .terminal-root[data-theme="dark"] [class*="border-[#8c3b32]"] {
        border-color: #3987e5 !important;
      }

      .terminal-root[data-theme="dark"] [class*="bg-[#8C3B32]"] {
        background-color: #184f95 !important;
      }

      /* Gold badges */
      .terminal-root[data-theme="dark"] [class*="text-[#B8860B]"],
      .terminal-root[data-theme="dark"] [class*="text-[#b8860b]"] {
        color: #d9b64a !important;
      }

      .terminal-root[data-theme="dark"] [class*="bg-[#FEF9E7]"],
      .terminal-root[data-theme="dark"] [class*="bg-[#fef9e7]"] {
        background-color: rgba(217, 182, 74, 0.14) !important;
        border-color: #d9b64a !important;
      }

      /* Warning & Refuse Alerts */
      .terminal-root[data-theme="dark"] [class*="bg-[#FEF2F2]"],
      .terminal-root[data-theme="dark"] [class*="bg-[#fef2f2]"] {
        background-color: rgba(230, 103, 103, 0.13) !important;
        border-color: rgba(230, 103, 103, 0.3) !important;
        color: #e66767 !important;
      }

      .terminal-root[data-theme="dark"] [class*="border-[#FECACA]"],
      .terminal-root[data-theme="dark"] [class*="border-[#fecaca]"] {
        border-color: rgba(230, 103, 103, 0.3) !important;
      }

      /* Panels, Cards & Surfaces in Dark Mode */
      .terminal-root[data-theme="dark"] .bg-white {
        background-color: #1a1a19 !important;
        border-color: rgba(255, 255, 255, 0.09) !important;
        color: #f2f1ed !important;
      }

      .terminal-root[data-theme="dark"] .bg-\\[\\#F7F8FA\\],
      .terminal-root[data-theme="dark"] .bg-\\[\\#f7f8fa\\],
      .terminal-root[data-theme="dark"] .bg-\\[\\#F3F4F6\\],
      .terminal-root[data-theme="dark"] .bg-\\[\\#f3f4f6\\] {
        background-color: #222220 !important;
        border-color: rgba(255, 255, 255, 0.09) !important;
        color: #c3c2b7 !important;
      }

      .terminal-root[data-theme="dark"] .border-\\[\\#E5E7EB\\],
      .terminal-root[data-theme="dark"] .border-\\[\\#e5e7eb\\] {
        border-color: rgba(255, 255, 255, 0.09) !important;
      }

      /* Tables, Headers and Real Mouse Hover rows */
      .terminal-root[data-theme="dark"] table th {
        background-color: #222220 !important;
        color: #898781 !important;
        border-bottom: 1.5px solid #383835 !important;
      }

      .terminal-root[data-theme="dark"] table td {
        border-bottom: 1px solid #2c2c2a !important;
        color: #f2f1ed !important;
      }

      .terminal-root[data-theme="dark"] table td.sticky,
      .terminal-root[data-theme="dark"] table th.sticky {
        background-color: #1a1a19 !important;
        color: #f2f1ed !important;
      }

      /* Hover states only trigger on active hover */
      .terminal-root[data-theme="dark"] table tr:hover td,
      .terminal-root[data-theme="dark"] .hover\\:bg-\\[\\#F3F4F6\\]:hover,
      .terminal-root[data-theme="dark"] .hover\\:bg-\\[\\#f3f4f6\\]:hover {
        background-color: #222220 !important;
      }

      /* Progress Bars */
      .terminal-root[data-theme="dark"] .bar {
        background-color: #262624 !important;
      }

      .terminal-root[data-theme="dark"] .bar i {
        background-color: #3987e5 !important;
      }

      /* Inputs in Dark Mode */
      .terminal-root[data-theme="dark"] input {
        background-color: #222220 !important;
        border-color: rgba(255, 255, 255, 0.09) !important;
        color: #f2f1ed !important;
      }

      .terminal-root[data-theme="dark"] input::placeholder {
        color: #898781 !important;
      }
    `}</style>
  );
}




