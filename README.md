# IP Logger (Cybersecurity Assignment Demo)

A minimal web server that demonstrates how any web request reveals the
requester's IP address — the same principle behind "IP grabber" links,
web analytics, and abuse-investigation tooling.

## How it works
- `GET /` reads the visitor's IP from the request (`req.ip`, which respects
  the `X-Forwarded-For` header set by hosting platforms/proxies).
- It does an optional reverse-geolocation lookup via the free
  [ip-api.com](https://ip-api.com) API (no key required, rate-limited).
- It logs the IP, approximate location, ISP, user agent, and timestamp to
  `visits.log`, and shows the same info back to the visitor.
- `GET /logs` lets you view everything that's been logged so far.

## Run it locally
```bash
npm install
node server.js
```
Then open http://localhost:3000 in a browser.

## Deploy it so you have a real public link
Any of these work well for a free, quick deployment (network access in
this sandbox doesn't include their APIs, so you'll do this step from your
own machine):

**Render (recommended, simplest)**
1. Push this folder to a GitHub repo.
2. Go to render.com → New → Web Service → connect the repo.
3. Build command: `npm install` — Start command: `node server.js`.
4. Deploy. Render gives you a public URL like `https://yourapp.onrender.com`.

**Railway**
1. `railway login` then `railway init` in this folder.
2. `railway up` to deploy.
3. `railway domain` to get a public URL.

**Quick local test without deploying (ngrok)**
1. `node server.js` locally.
2. In another terminal: `ngrok http 3000`.
3. ngrok gives you a temporary public URL that tunnels to your machine —
   good for testing with classmates before a real deployment.

## For your write-up
Worth covering in the assignment:
- **Why this works at all**: TCP/IP requires a source address so a
  response can be routed back — there's no way to hide it at the network
  layer without a VPN/proxy in front of the client.
- **Limitations**: `X-Forwarded-For` can be spoofed by malicious clients
  directly (never trust it for security decisions without a proper
  reverse proxy setting it); VPNs/proxies/Tor mask the real IP;
  IP-to-location lookups are approximate (usually ISP-level, not precise
  address-level).
- **Ethics/legal note**: Sending someone a disguised link to capture their
  IP without consent is a tracking/doxxing technique and violates most
  platforms' terms of service. Legitimate uses are things like your own
  server access logs, consented penetration testing, or abuse
  investigation with proper authorization — always get consent from
  whoever you're testing on/with.

## Securing the demo (optional, worth mentioning in the write-up too)
Right now `/logs` is public — fine for a personal test, not fine for
anything real. To lock it down, add basic auth or an environment-variable
secret check before returning the log contents.
