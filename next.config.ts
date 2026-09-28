import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Keep Turbopack inside this app. The parent folder name has spaces,
    // which otherwise makes Next treat sibling lockfiles as extra roots.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
