import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
