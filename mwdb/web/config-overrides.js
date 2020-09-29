const { override, babelInclude, removeModuleScopePlugin, addWebpackModuleRule } = require('customize-cra');
const fs = require("fs");
const path = require('path');

const mwdbPackageNamespace = "@mwdb-web";
const pluginPackagePrefix = "plugin-";
const pluginsIndexFile = path.join(require.resolve("@mwdb-web/commons"), '..', 'extensions', 'plugins.js');

function findInstalledPlugins() {
    let modules = {};
    const modulesDir = path.join(__dirname, "node_modules", mwdbPackageNamespace);
    if(!fs.existsSync(modulesDir))
        return modules;
    for(const pluginName of fs.readdirSync(modulesDir)) {
        if(!pluginName.startsWith(pluginPackagePrefix))
            continue;
        let realPath = path.join(modulesDir, pluginName);
        try {
            realPath = path.resolve(modulesDir, fs.readlinkSync(realPath));
        } catch(e) {
            if(e.errno != -22 /* EINVAL */)
                throw e;
        }
        modules[mwdbPackageNamespace + "/" + pluginName] = realPath;
    }
    return modules;
}

function getPluginPaths(plugins) {
    return Object.values(plugins)
}

function getPluginLoaders(plugins) {
    const moduleNames = Object.keys(plugins)
    return moduleNames.map((moduleName) => ({
        loader: 'imports-loader',
        options: {
            imports: [
                {
                    moduleName,
                    name: moduleName.split("/")[1].slice(pluginPackagePrefix.length)
                }
            ]
        }
    })).concat({
        loader: 'exports-loader',
        options: {
            exports: moduleNames.map((moduleName) => ({
                syntax: 'named',
                name: moduleName.split("/")[1].slice(pluginPackagePrefix.length)
            }))
        }
    })
}

const plugins = findInstalledPlugins();

for(const pluginName of Object.keys(plugins)) {
    console.log("[plugins] Found plugin " + pluginName);
}

module.exports = {
    webpack: override(
        removeModuleScopePlugin(),
        babelInclude([path.join(__dirname, 'src')].concat(getPluginPaths(plugins))),
        (
            /* If there are plugins: add loaders */
            Object.keys(plugins).length
            ? addWebpackModuleRule(
                {
                    test: pluginsIndexFile,
                    use: getPluginLoaders(plugins)
                }
            )
            : (_ => _)
        )
    )
}
