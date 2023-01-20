import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import fs from "fs";
import path from "path";

function findInstalledPlugins(namespace) {
  const modulesDir = path.join(__dirname, "node_modules", namespace);
  if(!fs.existsSync(modulesDir))
    return [];
  return fs.readdirSync(modulesDir)
}

function pluginLoader() {
  /**
   * Vite plugin which provides virtual module "@mwdb-core/plugins".
   * Imports all plugins installed in @mwdb-core namespace.
   *
   * Usage of virtual module:
   *
   * import plugins from "@mwdb-core/plugins";
   *
   * plugins exposes dictionary {"plugin-name": pluginLoadFunction}
   */
  const virtualModuleId = '@mwdb-core/plugins';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'plugin-loader',
    resolveId(id) {
      if(id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if(id === resolvedVirtualModuleId) {
        const plugins = findInstalledPlugins("@mwdb-core");
        const exports = plugins.map(
            (pluginName, index) => `"${pluginName}": import("@mwdb-core/${pluginName}"),`
        ).join("\n");
        return `export default { ${exports} };`;
      }
    },
  }
}

function pluginExposeCommons() {
  /**
   * Vite plugin that provides virtual module "@mwdb-core/commons/*".
   *
   * It maps src/commons modules to virtual package, so they're
   * available for plugins via simple import.
   */

  return {
    name: 'expose-commons',
    resolveId(id) {
      if(id.startsWith("@mwdb-core/commons/")) {
        return "\0" + id;
      }
    },
    load(id) {
      if(id.startsWith("\0@mwdb-core/commons/")) {
        const modulesPath = id.split("/");
        if(modulesPath.length !== 3) {
          throw new Error(`Incorrect commons import '${id}', only one level deep allowed`)
        }
        const submodule = modulesPath[2];
        const submodulePath = path.join(__dirname, "src/commons", submodule);
        return `export * from "${submodulePath}";`;
      }
    },
  }
}

export default defineConfig({
  plugins: [
      react(),
      pluginLoader(),
      pluginExposeCommons()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.PROXY_BACKEND_URL,
        changeOrigin: true
      }
    }
  }
})
