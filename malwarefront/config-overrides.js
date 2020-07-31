const { override, babelInclude, removeModuleScopePlugin, addWebpackPlugin, addWebpackModuleRule, addWebpackResolve } = require('customize-cra');
const fs = require("fs");
const path = require('path');
const webpack = require('webpack');

const pluginPackagePrefix = "@malwarefront-plugin";
const pluginsIndexFile = path.join(require.resolve("@malwarefront/extensions"), '..', 'plugins.js');

function findInstalledPlugins() {
    let modules = {};
    const modulesDir = path.join(__dirname, "node_modules", pluginPackagePrefix);
    if(!fs.existsSync(modulesDir))
        return modules;
    for(const pluginName of fs.readdirSync(modulesDir)) {
        let realPath = path.join(modulesDir, pluginName);
        try {
            realPath = path.resolve(modulesDir, fs.readlinkSync(realPath));
        } catch(e) {
            if(e.errno != -22 /* EINVAL */)
                throw e;
        }
        modules[pluginPackagePrefix + "/" + pluginName] = realPath;
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
                    name: moduleName.split("/")[1]
                }
            ]
        }
    })).concat({
        loader: 'exports-loader',
        options: {
            exports: moduleNames.map((moduleName) => ({
                syntax: 'named',
                name: moduleName.split("/")[1]
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
