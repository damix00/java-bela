import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    // allow all
    allowedDevOrigins: ["192.168.*.*", "93.139.194.149"],
    experimental: {
        serverActions: {
            allowedOrigins: [
                "192.168.*.*",
                "93.139.194.149",
                "93.139.194.149:3000",
            ],
        },
    },
};

export default nextConfig;
