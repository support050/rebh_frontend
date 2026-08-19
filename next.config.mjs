/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Next.js dev server requires 'unsafe-eval' for HMR/source-maps.
// In production this is stripped to harden XSS protection.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
  : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com";

const cspValue = `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;

const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  // Raise proxy timeout to 120s so cold-cache dashboard requests
  // don't get ECONNRESET before the backend responds.
  experimental: {
    proxyTimeout: 120_000,
  },

  // Keep TCP connections alive — reduces ECONNRESET on re-used sockets.
  httpAgentOptions: {
    keepAlive: true,
  },

  async redirects() {
    return [
      {
        source: '/watchlist/relative-strength/:path*',
        destination: '/market_rs',
        permanent: true,
      }
    ];
  },

  // Proxy all /api/* requests to the backend.
  // This makes cookies first-party (set on www.rebh.ai instead of onrender.com)
  // which allows the Next.js middleware to read them for auth gating.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'your-domain.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'images.amazon.com' },
    ],
  },
}

export default nextConfig