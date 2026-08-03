import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained runtime tree for the production container. This
  // avoids shipping the compiler, source tree, and development dependencies.
  output: "standalone",
  // Codex/browser smoke tests and developers commonly open the local app via
  // 127.0.0.1 while Next binds to localhost. Without this allow-list Next 16
  // blocks its own dev assets, leaving server-rendered forms unhydrated.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phet.colorado.edu",
      },
    ],
  },
};

export default nextConfig;
