const crypto = require('crypto');

const buildIceServers = userId => {
  const iceServers = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ];
  const secret = process.env.TURN_SHARED_SECRET;
  const urls = (process.env.TURN_URLS || '').split(',').map(url => url.trim()).filter(Boolean);
  if (!secret || secret.length < 32 || !urls.length) return iceServers;

  const username = `${Math.floor(Date.now() / 1000) + 60 * 60}:${String(userId)}`;
  const credential = crypto.createHmac('sha1', secret).update(username).digest('base64');
  iceServers.push({ urls, username, credential });
  return iceServers;
};

module.exports = { buildIceServers };
