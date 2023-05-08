import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

import fs from "fs";
import { join } from "path";

function findInstalledPlugins(namespace) {
    const modulesDir = join(__dirname, "node_modules", namespace);
    if (!fs.existsSync(modulesDir)) return [];
    return fs.readdirSync(modulesDir);
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
                const plugins = findInstalledPlugins("@mwdb-web");
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

function pluginExposeCommons() {
    /**
     * Vite plugin that provides virtual module "@mwdb-web/commons/*".
     *
     * It maps src/commons modules to virtual package, so they're
     * available for plugins via simple import.
     */

    return {
        name: "expose-commons",
        resolveId(id) {
            if (id.startsWith("@mwdb-web/commons/")) {
                return "\0" + id;
            }
        },
        load(id) {
            if (id.startsWith("\0@mwdb-web/commons/")) {
                const modulesPath = id.split("/");
                if (modulesPath.length !== 3) {
                    throw new Error(
                        `Incorrect commons import '${id}', only one level deep allowed`
                    );
                }
                const submodule = modulesPath[2];
                const submodulePath = join(__dirname, "src/commons", submodule);
                return `export * from "${submodulePath}";`;
            }
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        pluginLoader(),
        pluginExposeCommons(),
        checker({
            typescript: true,
        }),
    ],
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
