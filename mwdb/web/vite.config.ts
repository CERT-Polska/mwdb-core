import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

import fs from "fs";
import { join, resolve } from "path";

function findInstalledPlugins() {
    const modulesDir = join(__dirname, "node_modules", "@mwdb-web");
    const packageDirPattern = /^plugin-[a-zA-Z0-9\-_]+$/g;

    if (!fs.existsSync(modulesDir)) return [];
    return fs.readdirSync(modulesDir).filter(dir => dir.match(packageDirPattern));
}

function pluginLoader() {
    /**
     * Vite plugin which provides virtual module "@mwdb-web/plugins".
     * Imports all plugins installed in @mwdb-web namespace.
     *
     * Usage of virtual module:
     *
     * import plugins from "@mwdb-web/plugins";
     *
     * plugins exposes dictionary {"plugin-name": pluginLoadFunction}
     */
    const virtualModuleId = "@mwdb-web/plugins";
    const resolvedVirtualModuleId = "\0" + virtualModuleId;

    return {
        name: "plugin-loader",
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                const plugins = findInstalledPlugins();
                const exports = plugins
                    .map(
                        (pluginName, index) =>
                            `"${pluginName}": import("@mwdb-web/${pluginName}"),`
                    )
                    .join("\n");
                return `export default { ${exports} };`;
            }
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        pluginLoader(),
        checker({
            typescript: true,
        }),
    ],
    /**
     * Expose mwdb/web/src as @mwdb-web to make it
     * reachable for plugins. The only thing that must
     * be excluded from that aliasing is @mwdb-web/plugins
     * that is virtual package provided by pluginLoader.
     */
    resolve: {
        alias: [
            {
                find: /^@mwdb-web(?!\/(plugins$|plugin-))/,
                replacement: resolve(__dirname, "./src")
            }
        ]
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,

        proxy: {
            "/api": {
                target: "http://mwdb.:8080",
                changeOrigin: true,
            },
        },
    },
});
