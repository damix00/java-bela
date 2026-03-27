import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    // allow all
    allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
