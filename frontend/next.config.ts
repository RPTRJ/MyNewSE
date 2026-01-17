import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
