import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    productionBrowserSourceMaps: false,
    experimental: {
        serverSourceMaps: false,
    },
};

export default nextConfig;
