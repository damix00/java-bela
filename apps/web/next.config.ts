import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    productionBrowserSourceMaps: false,
    experimental: {
        serverSourceMaps: false,
    },

    // Emits `.next/standalone`: the server plus only the files it actually uses, which is what
    // the container copies instead of a full node_modules.
    output: "standalone",

    // Tracing has to start at the workspace root, not this directory. `@bela/protocol` is a
    // source-only workspace package that resolves through the root `node_modules`, and without
    // this the standalone bundle is built as if it were not there.
    outputFileTracingRoot: path.join(import.meta.dirname, "..", ".."),
};

export default nextConfig;
