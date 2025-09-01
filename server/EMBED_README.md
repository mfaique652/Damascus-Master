Embed workflow (short)

Purpose
- Deterministically embed sale metadata from canonical DB (`server/data/db.json`) into product HTML pages.
- Perform atomic writes and create timestamped backups before replacing files to allow safe rollback.

Location
- Shared implementation: `server/lib/embed.cjs` (exports `embedSaleForProduct(productId)`).
- CLI wrapper for batch runs: `tools/force_embed_sales.js` (calls the shared module).
- Smoke test: `server/lib/embed.test.cjs` — quick local test that calls the embed for a known product.

Backup files
- Backups are created next to the product HTML as `<page>.bak.force.<ts>`.

How to run (local)

1) Quick smoke test (recommended after changes):

```bash
npm run test:embed
```

2) Regenerate a single product (server endpoint):

POST /api/admin/products/:id/regenerate (must be authenticated as admin)

3) Batch-force embed (CLI):

```bash
node tools/force_embed_sales.js
```

Notes
- The embed module validates that the generated HTML still contains `window.__ALBUM_PLACEHOLDERS` and `wishlist-heart` before replacing the page.
- Keep `JWT_SECRET` stable during admin actions so tokens remain valid.
- The embed smoke test is intentionally lightweight and will create a `.bak.force.*` backup when run.
