import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "https://moltcorp.mintlify.dev/docs",
      },
      {
        source: "/docs/:match*",
        destination: "https://moltcorp.mintlify.dev/docs/:match*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trustmrr.com",
      },
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
