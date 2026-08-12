// generate-report.mjs
// Standalone script — runs via GitHub Actions to generate the Weekly Report PDF.
// Usage: node scripts/generate-report.mjs
// Required env vars:
//   SITE_EMAIL     — login email for rebh.ai  (stored as GitHub Secret)
//   SITE_PASSWORD  — login password            (stored as GitHub Secret)
//   SITE_URL       — https://www.rebh.ai       (stored as GitHub Variable)
//   BACKEND_URL    — https://lumivst-backend-v2.onrender.com (GitHub Variable)

import puppeteer from 'puppeteer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { writeFileSync } from 'fs';

const SITE_URL    = process.env.SITE_URL    || 'https://www.rebh.ai';
const BACKEND_URL = process.env.BACKEND_URL || 'https://lumivst-backend-v2.onrender.com';
const EMAIL       = process.env.SITE_EMAIL;
const PASSWORD    = process.env.SITE_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error('❌ SITE_EMAIL and SITE_PASSWORD must be set as GitHub Secrets.');
    process.exit(1);
}

// ─── Smart page-ready detector (same logic as route.ts) ──────────────────────
const PAGE_READY_FN = () => {
    const href = window.location.href;
    if (href.includes('Matrix')) return !document.body.innerText.includes('Loading Matrix Chart');
    if (href.includes('Alrayan')) {
        if (document.querySelectorAll('svg[style*="spin"]').length > 0) return false;
        const cvs = Array.from(document.querySelectorAll('canvas'));
        if (!cvs.length) return false;
        return cvs.some(c => {
            try {
                const ctx = c.getContext('2d');
                if (!ctx || !c.width || !c.height) return false;
                const d = ctx.getImageData(0, Math.floor(c.height / 2), c.width, 1).data;
                for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
            } catch { return true; }
            return false;
        });
    }
    const cvs = Array.from(document.querySelectorAll('canvas'));
    if (!cvs.length) return false;
    return cvs.every(c => {
        try {
            const ctx = c.getContext('2d');
            if (!ctx || !c.width || !c.height) return false;
            const d = ctx.getImageData(0, Math.floor(c.height / 2), c.width, 1).data;
            for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
        } catch { return true; }
        return false;
    });
};

async function main() {
    console.log(`🚀 Starting PDF generation — ${SITE_URL}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    });

    try {
        // ── Step 1: Login via UI ────────────────────────────────────────────────
        console.log('🔐 Logging in via UI…');
        const loginPage = await browser.newPage();
        await loginPage.setViewport({ width: 1920, height: 1080 });

        await loginPage.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle2', timeout: 60_000 });

        // Fill login inputs if available or fetch login endpoint
        try {
            await loginPage.type('input[type="email"], input[name="email"]', EMAIL);
            await loginPage.type('input[type="password"], input[name="password"]', PASSWORD);
            await Promise.all([
                loginPage.click('button[type="submit"]'),
                loginPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => {}),
            ]);
        } catch {
            // Fallback to API fetch inside browser context
            await loginPage.evaluate(async (backendUrl, email, password) => {
                const csrfRes = await fetch(`${backendUrl}/api/auth/csrf`, { credentials: 'include' });
                const { csrf_token: csrf } = await csrfRes.json();
                await fetch(`${backendUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
                    credentials: 'include',
                    body: JSON.stringify({ email, password }),
                });
            }, BACKEND_URL, EMAIL, PASSWORD);
        }

        const backendCookies = await loginPage.cookies();
        await loginPage.close();
        console.log(`✅ Logged in (${backendCookies.length} cookies)`);

        // Helper: open a new authenticated page on the SITE_URL domain
        async function openPage() {
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            if (backendCookies.length > 0) {
                const frontendCookies = backendCookies.map(c => ({ ...c, url: SITE_URL }));
                const beCookies       = backendCookies.map(c => ({ ...c, url: BACKEND_URL }));
                await page.setCookie(...frontendCookies, ...beCookies);
            }
            return page;
        }

        // ── Step 2: Screenshot helper ─────────────────────────────────────────
        async function capturePage(path, selector) {
            const page = await openPage();
            try {
                await page.goto(`${SITE_URL}${path}`, { waitUntil: 'networkidle2', timeout: 120_000 });
                await page.waitForFunction(PAGE_READY_FN, { timeout: 30_000 }).catch(() => {});

                await page.addStyleTag({
                    content: `
                        nav, footer, nextjs-portal, #next-build-indicator,
                        .z-50.flex-shrink-0, .z-\\[60\\] { display: none !important; }
                        ${path.includes('Matrix') ? 'header { display: none !important; }' : ''}
                    `,
                });

                if (path.includes('Alrayan')) {
                    await new Promise(r => setTimeout(r, 500));
                }

                if (selector) {
                    const el = await page.$(selector);
                    if (el) return await el.screenshot();
                }
                return await page.screenshot({ fullPage: true });
            } finally {
                await page.close();
            }
        }

        // ── Step 3: Industry Groups PDF helper ────────────────────────────────
        async function captureIndustryPdf(path) {
            const page = await openPage();
            try {
                await page.goto(`${SITE_URL}${path}`, { waitUntil: 'networkidle2', timeout: 120_000 });
                // Raised timeout to 180s to give full headroom for expanding all ~22 sectors
                await page.waitForFunction(
                    () => window.__REPORT_PDF_BASE64__ !== undefined,
                    { timeout: 180_000 },
                );
                const dataUri = await page.evaluate(() => window.__REPORT_PDF_BASE64__);
                if (dataUri === 'ERROR') throw new Error('jsPDF generation failed in browser');
                return dataUri;
            } finally {
                await page.close();
            }
        }

        // ── Step 4: Build the PDF ─────────────────────────────────────────────
        const pdfDoc = await PDFDocument.create();
        const font    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const subFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const addTextPage = (title, subtitle) => {
            const page = pdfDoc.addPage([1920, 1080]);
            const { width, height } = page.getSize();
            const tw = font.widthOfTextAtSize(title, 70);
            page.drawText(title, { x: (width - tw) / 2, y: height / 2, size: 70, font, color: rgb(0.1, 0.1, 0.1) });
            if (subtitle) {
                const sw = subFont.widthOfTextAtSize(subtitle, 40);
                page.drawText(subtitle, { x: (width - sw) / 2, y: height / 2 - 60, size: 40, font: subFont, color: rgb(0.4, 0.4, 0.4) });
            }
        };

        const appendTitled = async (title, buffer) => {
            const image = await pdfDoc.embedPng(buffer);
            const { width: imgW, height: imgH } = image.scale(1);
            const headerH = 100; // 30 margin + 50 title + 20 margin
            const page = pdfDoc.addPage([imgW, imgH + headerH]);
            const tw = font.widthOfTextAtSize(title, 50);
            page.drawText(title, { x: (imgW - tw) / 2, y: imgH + 40, size: 50, font, color: rgb(0.1, 0.1, 0.1) });
            page.drawImage(image, { x: 0, y: 0, width: imgW, height: imgH });
        };

        // Pages 1-2: dividers
        addTextPage('Weekly Routine', new Date().toLocaleDateString());
        addTextPage('Market Breadth');

        // Pages 3-5: chart screenshots
        console.log('📸 Capturing Percent of Stocks Above MA…');
        await appendTitled('1) Percent Of Stocks Above MA', await capturePage('/Percent_of_Stocks_Above_MA', 'main'));

        console.log('📸 Capturing Minervini Trend…');
        await appendTitled('2) Minervini Trend', await capturePage('/minervini-trend', 'main'));

        console.log('📸 Capturing Alhussain & Alrayan…');
        await appendTitled('3) Alhussain & Alrayan & A/D Rating', await capturePage('/screeners/Alrayan&Alhussain', 'main'));

        // Pages 6+: Industry Groups (jsPDF from browser)
        console.log('📄 Generating Industry Groups PDF…');
        const indDataUri = await captureIndustryPdf('/industry-groups?autoReport=true');
        const indPdfDoc  = await PDFDocument.load(Buffer.from(indDataUri.split(',')[1], 'base64'));
        const embPages   = await pdfDoc.embedPages(indPdfDoc.getPages());

        for (let i = 0; i < embPages.length; i++) {
            const ep = embPages[i];
            const scale = 1920 / ep.width;
            const scaledH = ep.height * scale;

            if (i === 0) {
                const page = pdfDoc.addPage([1920, scaledH + 100]);
                const tw = font.widthOfTextAtSize('Industry Groups', 50);
                page.drawText('Industry Groups', { x: (1920 - tw) / 2, y: scaledH + 40, size: 50, font, color: rgb(0.1, 0.1, 0.1) });
                page.drawPage(ep, { x: 0, y: 0, xScale: scale, yScale: scale });
            } else {
                const page = pdfDoc.addPage([1920, scaledH]);
                page.drawPage(ep, { x: 0, y: 0, xScale: scale, yScale: scale });
            }
        }

        // Last page: Matrix Chart
        console.log('📸 Capturing Matrix Chart…');
        await appendTitled('Relative Strength', await capturePage('/watchlist/?tab=Matrix%20Chart&reportMode=true', '#matrix-chart-main'));

        // ── Step 5: Save PDF ──────────────────────────────────────────────────
        const pdfBytes = await pdfDoc.save();
        const filename = `Weekly_Routine_${new Date().toISOString().slice(0, 10)}.pdf`;
        writeFileSync(filename, pdfBytes);
        console.log(`✅ PDF saved: ${filename}`);

    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
