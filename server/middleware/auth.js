const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
};

const authenticateToken = async token => {
  const claims = jwt.verify(token, getJwtSecret());
  if (!claims?.id) throw new Error('Invalid authentication token.');
  const account = await User.findById(claims.id).select('+tokenVersion username role').lean();
  if (!account || Number(claims.tokenVersion || 0) !== Number(account.tokenVersion || 0)) throw new Error('Authentication token is no longer valid.');
  return { ...claims, id: String(account._id), username: account.username, role: account.role };
};

const protect = async (req, res, next) => {
  const [scheme, token, extra] = (req.get('Authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token || extra) {
    return res.status(401).json({ error: 'A valid Bearer token is required.' });
  }
  try {
    req.user = await authenticateToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
};

module.exports = { protect, requireAdmin, authenticateToken, getJwtSecret };
