const proxy = require("http-proxy-middleware");

/**
 * This is proxy setup for React development server working in Docker
 * Will not be used by local setup (without PROXY_BACKEND_URL) and production environment
 */

module.exports = function (app) {
    if (process.env.PROXY_BACKEND_URL) {
        app.use(
            "/api",
            proxy({
                target: process.env.PROXY_BACKEND_URL,
                changeOrigin: true,
            })
        );
    }
};
