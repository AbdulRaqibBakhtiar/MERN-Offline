# Bazzar

Bazzar is a community marketplace for tools, equipment, and useful parts. Buyers can discover listings, review product details, contact sellers, and send order requests. Sellers manage their listings, answer questions, and process incoming orders. Articles and community posts support the marketplace with useful context and updates.

This project is designed as a full-stack portfolio demonstration of a focused buyer and seller journey, with publishing and real-time communication alongside it.

## Product walkthrough

1. Browse and search the marketplace; open a listing to see its photos or videos, stock, seller, specifications, and reviews.
2. Contact the seller from the listing, or submit an order request. Requests reserve available stock and appear in the buyer's order history and the seller's incoming orders.
3. Sellers can accept or cancel pending requests, then mark accepted orders fulfilled. Cancelling a pending request returns its reserved stock.
4. Signed-in users can publish and manage their own listings. Admins can manage any listing. Article permissions are role based: authors manage their own drafts and submissions, while editors and admins manage the editorial workflow.

## Technology

- React 19 and React Router for the client application
- Express 5 and Node.js for the API
- MongoDB and Mongoose for user, listing, article, conversation, and order data
- Socket.IO for real-time chat and marketplace refresh events
- JWT authentication and bcrypt password hashing
- Multer uploads for product and other media

## Run locally

1. Install dependencies in both `server` and `client`.
2. Copy `server/.env.example` to `server/.env` and configure the deployment values. Use a unique random `JWT_SECRET` of at least 32 characters, a database user restricted to this application's database, and your exact HTTPS frontend origin in `CORS_ORIGINS`.
3. Add usernames to `ADMIN_USERNAMES`, `EDITOR_USERNAMES`, and `AUTHOR_USERNAMES` as comma-separated lists. Accounts must register first; configured roles take effect on their next login. Admin has the highest precedence.
4. Start the API from `server` with `npm run dev`.
5. Start the client from `client` with `npm start`.

Use the `server.js` entry point through the package scripts. The retired `server_old.js` prototype is intentionally inert and contains no API routes.

When the API is not reachable at the browser's current hostname on port `5000`, set `REACT_APP_API_BASE_URL` for the client. Put the API behind HTTPS, and set `TRUST_PROXY=true` only when it is behind a trusted reverse proxy.

## Current boundaries

Marketplace checkout creates an order request and reserves stock. Bazzar connects buyers and sellers; it does not collect card or bank details, process payments, or arrange delivery. The card and bank fields in checkout are local-only portfolio demos. Do not enter real payment details. Adding actual payment processing requires selecting a provider, onboarding the business, and implementing provider-hosted/tokenized checkout and verified webhooks.

## Deployment security and communications

- Configure `CORS_ORIGINS` as a comma-separated allowlist of exact frontend origins. Production starts closed to browser origins when it is missing. Do not use `*` in production.
- Account recovery uses Resend. Set `RESEND_API_KEY`, `AUTH_EMAIL_FROM` on a verified sending domain, and `CLIENT_APP_URL`. Recovery links are one-time, hashed at rest, expire after 30 minutes, and reset invalidates existing API and socket sessions. Without these settings recovery reports that email is not configured.
- Product, news, and article uploads are limited to supported media types and 25 MB per file. Public marketplace media is served without directory listings; do not upload private documents.
- Sign-in, registration, and recovery have per-process rate limits. If you run multiple API instances, replace the in-memory limiter with shared Redis-backed limits and configure proxy trust only for your known proxy.
- Calls use a peer-to-peer mesh capped at four people total. For better connectivity across restrictive networks, deploy coturn with REST authentication, set `TURN_URLS` and `TURN_SHARED_SECRET` on the API, and set the same shared secret as coturn's `static-auth-secret`. The API issues short-lived TURN credentials; never put the shared secret in the client. TURN still requires a reachable public server, UDP/TCP firewall rules, and TLS configuration for `turns:`.
- The current four-person cap is a conservative portfolio default, not a validated capacity guarantee. Test across real mobile, office, and restrictive networks before increasing it. For larger or more reliable conferences, move media forwarding to an SFU (for example, a managed WebRTC SFU) rather than raising the peer-to-peer mesh limit.
- Keep `.env` files and uploaded production data out of source control. Rotate any credentials that have ever been committed or shared.
