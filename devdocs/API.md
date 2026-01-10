# API Documentation

HTTP endpoints for Hypermind integration and development.

## Endpoints

You can test all the available endpoints running: `nude test-api.js`.

<details>
<summary><code>GET /api/stats</code></summary>

Returns node statistics and swarm information.

```json
{
  "count": 42,
  "totalUnique": 1337,
  "direct": 8,
  "id": "abc123...",
  "screenname": "BraveElephant",
  "diagnostics": {...},
  "chatEnabled": true,
  "mapEnabled": true,
  "peers": [...]
}
```

</details>

<details>
<summary><code>POST /api/chat</code></summary>

Send P2P chat message. Rate limited: 5 messages per 5 seconds.

```json
{
  "content": "Hello, world!",
  "scope": "GLOBAL",
  "target": null
}
```

</details>

<details>
<summary><code>GET /api/github/latest-release</code></summary>

Latest GitHub release information.

```json
{
  "tag_name": "v1.2.3",
  "html_url": "https://github.com/lklynet/hypermind/releases/tag/v1.2.3",
  "published_at": "2026-01-08T12:00:00Z",
  "body": "Release notes..."
}
```

</details>

<details>
<summary><code>GET /events</code></summary>

Server-Sent Events stream for real-time updates. Returns same data as `/api/stats`.

</details>

<details>
<summary><code>GET /js/lists.js</code></summary>

Dynamic JavaScript file containing adjectives and nouns for screenname generation.

</details>

<details>
<summary><code>GET /js/screenname.js</code></summary>

Dynamic JavaScript file with screenname generation logic for browser.

</details>

<details>
<summary><code>GET /</code></summary>

Main HTML page with server-side template rendering.

</details>

## Development

### Route Structure

Routes are modular in `src/web/routes/`:

```
src/web/routes/
├── your-new-route.js
```

### Creating Routes

<details>
<summary>1. Create module</summary>

`src/web/routes/your-new-route.js`:

```javascript
const setupYourNewRouteRoutes = (router, dependencies) => {
  const { identity, peerManager } = dependencies;

  router.get("/api/your-new-route", (req, res) => {
    res.json({ success: true });
  });
};

module.exports = { setupYourNewRouteRoutes };
```

</details>

<details>
<summary>2. Register route</summary>

In `src/web/routes.js`:

```javascript
const { setupYourNewRouteRoutes } = require("./routes/your-new-route");

const yourNewRouteDeps = { identity, peerManager };
setupYourNewRouteRoutes(app, yourNewRouteDeps);
```

</details>

<details>
<summary>3. Add constants</summary>

In `src/config/constants.js`:

```javascript
const YOUR_CONFIG = {
  enabled: process.env.ENABLE_YOUR_FEATURE === "true",
  rateLimit: parseInt(process.env.YOUR_RATE_LIMIT) || 1000,
};

module.exports = { YOUR_CONFIG };
```

</details>

### Security

<details>
<summary>Rate limiting</summary>

```javascript
let requestHistory = [];

router.get("/api/your-new-route", (req, res) => {
  const now = Date.now();
  requestHistory = requestHistory.filter((time) => now - time < 10000);

  if (requestHistory.length >= 5) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  requestHistory.push(now);
});
```

</details>

<details>
<summary>Input validation</summary>

```javascript
router.post("/api/your-new-route", (req, res) => {
  const { data } = req.body;

  if (!data || typeof data !== "string" || data.length > 1000) {
    return res.status(400).json({ error: "Invalid data" });
  }
});
```

</details>

<details>
<summary>Error handling</summary>

```javascript
router.get("/api/your-new-route", async (req, res) => {
  try {
    const result = await someOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Operation failed" });
  }
});
```

</details>

### Testing

```bash
curl http://localhost:3000/api/your-new-route
```
