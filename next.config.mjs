/** @type {import('next').NextConfig} */

// CSP lives ONLY in middleware.ts (single authoritative source). The Next.js
// middleware runs after these headers and overwrites any CSP set here, so having
// it in two places previously let the stricter middleware copy win and silently
// block Google Fonts. Only the non-CSP security headers remain below.
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  // Raise proxy timeout to 120s so cold-cache dashboard requests
  // don't get ECONNRESET before the backend responds.
  experimental: {
    proxyTimeout: 120_000,
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