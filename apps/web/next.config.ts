import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Turbopack options silence Next 16 Webpack configuration warnings
  turbopack: {}
};

export default withPWA(nextConfig);
