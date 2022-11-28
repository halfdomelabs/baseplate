const { createProxyMiddleware } = require('http-proxy-middleware');

console.log(process.env.DEV_BACKEND_HOST);

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: process.env.DEV_BACKEND_HOST,
      changeOrigin: true,
      ws: true,
    })
  );
};
