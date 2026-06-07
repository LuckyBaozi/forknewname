/**
 * Unified JSON error response middleware.
 */
function errorHandler(err, _req, res, _next) {
  console.error('[Error]', err.message || err);

  const status = err.status || 500;
  const message = err.expose
    ? err.message
    : '服务器内部错误，请稍后重试';

  res.status(status).json({
    code: -1,
    message
  });
}

module.exports = errorHandler;
