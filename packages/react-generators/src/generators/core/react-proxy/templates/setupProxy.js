const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: process.env.DEV_BACKEND_HOST,
      pathRewrite: {
        '^/api': '',
      },
      changeOrigin: true,
      WS_OPTION,
    })
  );
};
