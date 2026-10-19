// Retired prototype server. The package entry point is server.js.
// Keep this filename inert so an accidental `node server_old.js` cannot expose
// the original unauthenticated task routes or connect to a hard-coded database.
console.error('server_old.js is disabled. Start the supported API with `npm start` or `npm run dev`.');
process.exitCode = 1;
