import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    unoptimized: true,
  },
  // Allow static export for Firebase Hosting compatibility
  // Remove this if deploying to Vercel
  // output: "export",
};

export default nextConfig;
