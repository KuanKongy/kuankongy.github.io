import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */ //delete this if you want to run locally
  output: "export", 
  images: {
    unoptimized: true
  }
};

export default nextConfig;
