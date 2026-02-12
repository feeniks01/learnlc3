import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/lessons/:id',
        destination: '/learn/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
