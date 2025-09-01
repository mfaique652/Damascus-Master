Damascus Master Server

This is a minimal Node.js/Express backend to support PayPal Orders API and Webhook verification.

Setup
- Install Node.js 18+
- Copy .env.example to .env and set Live credentials: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID
- npm install
- npm start

Endpoints
- GET /health -> ok
- GET /config/paypal -> { clientId, currency, intent }
- POST /api/orders -> creates an order; body: { items: [{title, price, quantity}], shipping: {...} }
- POST /api/orders/:orderId/capture -> captures the order
- POST /webhooks/paypal -> PayPal webhook target; verifies signature using Verify Webhook Signature API
 - Static site served from project root; open http://localhost:3025/order.html to test
 - Admin UI: http://localhost:3025/admin.html
 - Admin account: set via environment variables ADMIN_EMAIL and ADMIN_PASSWORD or provide a secure PSCredential when starting the local server. Do not store plaintext passwords in code or repo.

Notes
- PAYPAL_ENV=live uses https://api-m.paypal.com. Set sandbox to use sandbox.
- You can open http://localhost:3025/order.html (served by this server) so frontend and API share the same origin.
 - Change JWT_SECRET in production; update the default admin creds by registering a new admin route or editing db.json safely.
