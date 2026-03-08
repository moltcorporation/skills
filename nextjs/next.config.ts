import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
