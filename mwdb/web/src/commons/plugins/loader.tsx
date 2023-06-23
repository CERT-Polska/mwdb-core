import _ from "lodash";
// @ts-ignore
import pluginLoaders from "@mwdb-web/plugins";

type PluginSpec = { [element: string]: any[] };
type Plugins = { [pluginName: string]: PluginSpec };

type PluginLoader = { default: () => PluginSpec };
type PluginLoaderPromise = Promise<PluginLoader>;
type PluginLoaders = { [pluginName: string]: PluginLoaderPromise };

let loadedPlugins: Plugins = {};
let pluginsLoadedCallbacks: Array<() => void> = [];

export async function loadPlugins(): Promise<void> {
    let plugins: Plugins = {};
    for (const [pluginName, pluginModulePromise] of Object.entries(
        pluginLoaders as PluginLoaders
    )) {
        try {
            // await import("@mwdb-core/plugin-xyz")
            const pluginModule = (await pluginModulePromise).default;
            plugins[pluginName] = pluginModule();
        } catch (e) {
            console.error(`Plugin ${pluginName} failed to load`, e);
        }
    }
    // Hacky but I want to avoid top-level await
    loadedPlugins = plugins;
    pluginsLoadedCallbacks.map((callback) => callback());
}

export function afterPluginsLoaded(callback: () => void): void {
    pluginsLoadedCallbacks.push(callback);
}

export function fromPlugins(element: string): any[] {
    return _.flatten(
        Object.keys(loadedPlugins).map(
            (name) => loadedPlugins[name][element] || []
        )
    );
}
