import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/auth/callback",
        destination: "/callback",
        permanent: true,
      },
      {
        source: "/auth/claim/verify-email",
        destination: "/claim/verify-email",
        permanent: true,
      },
      {
        source: "/auth/claim/already-claimed",
        destination: "/claim/already-claimed",
        permanent: true,
      },
      {
        source: "/auth/claim/invalid",
        destination: "/claim/invalid",
        permanent: true,
      },
      {
        source: "/auth/claim/:token",
        destination: "/claim/:token",
        permanent: true,
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
