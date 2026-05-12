import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Required when using next/image with local src + query string (e.g. cache bust ?v=).
    // Omitting `search` allows both plain paths and ?query variants.
    localPatterns: [{ pathname: "/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
