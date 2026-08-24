/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    const formalDomain = [{ type: "host", value: "alphahole.xyz" }];

    return [
      { source: "/", has: formalDomain, destination: "https://alphahole.vercel.app/", permanent: false },
      { source: "/posts", has: formalDomain, destination: "https://alphahole.vercel.app/knowledge", permanent: false },
      { source: "/posts/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/knowledge", permanent: false },
      { source: "/tools", has: formalDomain, destination: "https://alphahole.vercel.app/tools", permanent: false },
      { source: "/tools/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/tools", permanent: false },
      { source: "/prompts", has: formalDomain, destination: "https://alphahole.vercel.app/prompts", permanent: false },
      { source: "/prompts/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/prompts", permanent: false },
      { source: "/workflows", has: formalDomain, destination: "https://alphahole.vercel.app/workflows", permanent: false },
      { source: "/workflows/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/workflows", permanent: false },
      { source: "/cases", has: formalDomain, destination: "https://alphahole.vercel.app/cases", permanent: false },
      { source: "/cases/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/cases", permanent: false },
      { source: "/resources", has: formalDomain, destination: "https://alphahole.vercel.app/resources", permanent: false },
      { source: "/resources/:path*", has: formalDomain, destination: "https://alphahole.vercel.app/resources", permanent: false },
      { source: "/about", has: formalDomain, destination: "https://alphahole.vercel.app/about", permanent: false },
      { source: "/privacy", has: formalDomain, destination: "https://alphahole.vercel.app/privacy", permanent: false },
      { source: "/terms", has: formalDomain, destination: "https://alphahole.vercel.app/terms", permanent: false },
      { source: "/contact", has: formalDomain, destination: "https://alphahole.vercel.app/contact", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.vercel-insights.com https://vitals.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://api.openai.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // 媒体已切换为直链，不经过 next/image 优化面；移除全通配 remotePatterns
    unoptimized: true,
  },
};

module.exports = nextConfig;
