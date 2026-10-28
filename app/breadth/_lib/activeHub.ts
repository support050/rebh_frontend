/**
 * The currently-mounted breadth page's ChartHub + page element + name.
 *
 * The ⇩ Export menu, ⚙ drawer and ? tour live in the breadth layout (above the
 * page), but they act on the *active* page's hub (its data, range and rendered
 * panels). BreadthView publishes itself here on mount and clears on unmount so
 * the chrome always targets the right page — the React analogue of the
 * reference's `activePage()` / global `stacks` lookup.
 */
import type { ChartHub } from '../_engine/Stack';

export interface ActivePage {
  hub: ChartHub;
  el: HTMLElement;
  pageId: string;
  pageName: string;
}

let current: ActivePage | null = null;
const listeners = new Set<() => void>();

export function setActivePage(next: ActivePage | null): void {
  current = next;
  listeners.forEach((fn) => fn());
}

export function getActivePage(): ActivePage | null {
  return current;
}

export function subscribeActivePage(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
