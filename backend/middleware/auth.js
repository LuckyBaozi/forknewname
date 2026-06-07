/**
 * Simple shared-secret admin authentication middleware.
 * Set ADMIN_KEY environment variable to configure.
 * If ADMIN_KEY is not set, admin routes return 401.
 */
function auth(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(401).json({
      code: -1,
      message: '管理密钥未配置，请设置 ADMIN_KEY 环境变量'
    });
  }

  // Accept key via Authorization header (Bearer) or ?key= query param
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token && req.query.key) {
    token = req.query.key;
  }

  if (token !== adminKey) {
    return res.status(401).json({
      code: -1,
      message: '密钥无效'
    });
  }

  next();
}

module.exports = auth;
