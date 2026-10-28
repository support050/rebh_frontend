/**
 * ESM resolve hook so Node can import the app's .ts sources directly
 * (--experimental-strip-types): maps tsconfig `@/*` → frontend root,
 * adds the mandatory .ts extension to relative source imports, and stubs
 * browser-only packages the harness never exercises.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FRONTEND = path.resolve(import.meta.dirname, '..');

const STUBS = {
  'html-to-image': 'export async function toBlob(){return null} export async function toPng(){return null} export async function toJpeg(){return null}',
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier in STUBS) {
    return {
      url: 'data:text/javascript,' + encodeURIComponent(STUBS[specifier]),
      shortCircuit: true,
      format: 'module',
    };
  }
  if (specifier.startsWith('@/')) {
    let p = path.join(FRONTEND, specifier.slice(2));
    for (const ext of ['.ts', '.tsx', '.mjs', '.js', '', '.json']) {
      const c = p + ext;
      if (c.endsWith('.') || c.endsWith(path.sep)) continue;
      try {
        await import('node:fs/promises').then((fs) => fs.stat(c));
        return { url: pathToFileURL(c).href, shortCircuit: true, format: c.endsWith('.ts') ? 'module-typescript' : 'module' };
      } catch { /* try next */ }
    }
  }
  if (specifier.startsWith('.') && context.parentURL && context.parentURL.startsWith('file:') && !path.basename(context.parentURL).endsWith('.mjs')) {
    const dir = path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    const p = path.resolve(dir, specifier);
    if (!path.extname(p)) {
      try {
        await import('node:fs/promises').then((fs) => fs.stat(p + '.ts'));
        return { url: pathToFileURL(p + '.ts').href, shortCircuit: true, format: 'module-typescript' };
      } catch { /* fall through */ }
    }
  }
  return nextResolve(specifier, context);
}
