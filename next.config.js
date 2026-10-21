/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://event-api.djamko.com";

const nextConfig = {
  allowedDevOrigins: ["192.168.4.35"],

  // Docker => standalone | Vercel => gestion native
  output: process.env.VERCEL ? undefined : "standalone",

  // ─── Stabilité ───────────────────────────────────────────────
  reactStrictMode: true,
  poweredByHeader: false,

  // Les erreurs TS bloquent le build
  typescript: {
    ignoreBuildErrors: false,
  },

  // ─── Headers sécurité ────────────────────────────────────────
  async headers() {
    const csp = [
      "default-src 'self'",

      // Next.js + Firebase + dev HMR
      [
        "script-src 'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.gstatic.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
      ].join(" "),

      // Tailwind / shadcn
      [
        "style-src 'self'",
        "'unsafe-inline'",
      ].join(" "),

      // Images
      [
        "img-src 'self'",
        "data:",
        "blob:",
        "https:",
        apiUrl,
        "https://event-api.djamko.com",
        "https://api.djamko.com",
        "https://static.vagueapp.com",
        "https://images.unsplash.com",
        "https://i.pravatar.cc",
        "https://img.youtube.com",
        "https://i.ytimg.com",
        "https://tile.openstreetmap.org",
        "https://server.arcgisonline.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.gstatic.com",
      ].join(" "),

      // Fonts
      "font-src 'self' data:",

      // API / websocket / Firebase
      [
        "connect-src 'self'",
        apiUrl,
        "https://event-api.djamko.com",
        "https://api.djamko.com",
        "wss://event-api.djamko.com",
        "wss://api.djamko.com",
        "https://nominatim.openstreetmap.org",
        "https://tile.openstreetmap.org",
        "https://overpass-api.de",
        "https://fcm.googleapis.com",
        "https://fcmregistrations.googleapis.com",
        "https://firebaseinstallations.googleapis.com",
        "https://firebase.googleapis.com",
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://region1.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://api.iconify.design",
        "https://api.simplesvg.com",
        "https://api.unisvg.com",
        // Dev HMR & Live Reloading
        ...(isDev
          ? [
              "http://localhost:*",
              "ws://localhost:*",
              "http://127.0.0.1:*",
              "ws://127.0.0.1:*",
            ]
          : []
        ),
      ].join(" "),

      // Audio/video
      [
        "media-src 'self'",
        "blob:",
        "https://assets.mixkit.co",
        apiUrl,
        "https://event-api.djamko.com",
      ].join(" "),

      // iframe
      [
        "frame-src 'self'",
        "https://www.google.com",
        "https://maps.google.com",
        "https://www.youtube.com",
        "https://www.facebook.com",
        "https://www.tiktok.com",
        "https://djamko.firebaseapp.com",
      ].join(" "),

      // Firebase worker
      "worker-src 'self' blob:",

      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=*, microphone=*, geolocation=*",
          },
        ],
      },
      // Firebase service worker
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Android App Links
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      // Apple Universal Links
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },

  // ─── Images Next.js ────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "event-api.djamko.com",
      },
      {
        protocol: "https",
        hostname: "api.djamko.com",
      },
      {
        protocol: "https",
        hostname: "static.vagueapp.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "w0.peakpx.com",
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "maps.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "server.arcgisonline.com",
      },
      ...(isDev
        ? [
            {
              protocol: "http",
              hostname: "localhost",
            },
          ]
        : []),
    ],
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 604800,
  },

  // ─── Compiler ────────────────────────────────
  compiler: {
    removeConsole: isProd
      ? {
          exclude: ["error", "warn"],
        }
      : false,
  },

  // ─── Optimisations ───────────────────────────
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash",
      "recharts",
    ],
  },
};

module.exports = nextConfig;
