import type { NextConfig } from "next";
const development = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co${development ? " http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:3000 ws://localhost:3000" : ""}; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';${development ? "" : " upgrade-insecure-requests"}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
