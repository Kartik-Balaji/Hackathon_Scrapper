import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["globe.gl", "three-globe", "three-render-objects"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "devpost.com" },
      { protocol: "https", hostname: "unstop.com" },
      { protocol: "https", hostname: "d2dmyh35ffsxbl.cloudfront.net" },
      { protocol: "https", hostname: "challengepost-s3-challengepost.netdna-ssl.com" },
    ],
  },
  webpack(config) {
    // Allow globe.gl ESM imports in Next.js webpack bundler
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
