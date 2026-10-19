const getAllowedOrigins = () => {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  if (configured.length) return configured;
  if (process.env.NODE_ENV === 'production') return [];
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

module.exports = { getAllowedOrigins };
