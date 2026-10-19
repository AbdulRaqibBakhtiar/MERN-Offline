const buckets = new Map();

const rateLimit = ({ windowMs, max, message = 'Too many requests. Please try again later.' }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.baseUrl}${req.path}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: message });
    }
    if (buckets.size > 10000) {
      for (const [entry, value] of buckets) if (value.resetAt <= now) buckets.delete(entry);
    }
    return next();
  };
};

module.exports = { rateLimit };
