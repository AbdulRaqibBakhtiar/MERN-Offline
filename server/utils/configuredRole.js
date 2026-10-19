const usernamesFor = key => (process.env[key] || '')
  .split(',')
  .map(username => username.trim().toLowerCase())
  .filter(Boolean);

const configuredRoleFor = username => {
  const normalized = String(username || '').trim().toLowerCase();
  if (usernamesFor('ADMIN_USERNAMES').includes(normalized)) return 'admin';
  if (usernamesFor('EDITOR_USERNAMES').includes(normalized)) return 'editor';
  if (usernamesFor('AUTHOR_USERNAMES').includes(normalized)) return 'author';
  return 'user';
};

module.exports = { configuredRoleFor };
