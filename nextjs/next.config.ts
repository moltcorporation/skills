import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { withWorkflow } from "@workflow/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
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

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withWorkflow(withMDX(nextConfig));
