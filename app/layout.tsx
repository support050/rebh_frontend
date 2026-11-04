import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Roboto, Tajawal } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "./providers/ThemeProvider";

import QueryProvider from "./providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

// Roboto is the measured FRED body font (extract_fred_design.py). Loaded via
// next/font so the /economic-indicators pages render the real face, not a
// verdana/arial fallback. Exposed as --font-roboto (consumed by fredDesign.ts).
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "REBH",
  description: "المنصة الشاملة للتحليل المالي وتقييم الأسهم السعودية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${notoArabic.variable} ${tajawal.variable} ${roboto.variable}`}
    >
      <body className="font-sans">
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
              <ToastProvider>
                <Layout>
                  {children}
                </Layout>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
