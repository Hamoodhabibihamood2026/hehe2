const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, 'visits.log');

// Trust the first proxy in front of us (needed on most hosts like Render/Railway/Heroku)
app.set('trust proxy', true);

function getClientIp(req) {
  // req.ip already respects "trust proxy" above and reads X-Forwarded-For for us.
  // We fall back to the raw socket address just in case.
  let ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Normalize IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  return ip;
}

function lookupGeo(ip, callback) {
  // ipwho.is: free, no key needed, and (unlike ip-api.com's free tier)
  // actually supports HTTPS, which Render's platform requires.
  // Skip lookup for local/private addresses.
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return callback(null);
  }
  https.get(`https://ipwho.is/${ip}`, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(
          json.success
            ? {
                city: json.city,
                regionName: json.region,
                country: json.country,
                isp: json.connection ? json.connection.isp : null,
              }
            : null
        );
      } catch {
        callback(null);
      }
    });
  }).on('error', (err) => {
    console.error('Geo lookup failed:', err.message);
    callback(null);
  });
}

function logVisit(entry) {
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}

app.get('/', (req, res) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();

  lookupGeo(ip, (geo) => {
    const entry = {
      timestamp,
      ip,
      userAgent,
      city: geo ? geo.city : null,
      region: geo ? geo.regionName : null,
      country: geo ? geo.country : null,
      isp: geo ? geo.isp : null,
    };

    console.log('Visit logged:', entry);
    logVisit(entry);

    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2>Thanks for testing the link.</h2>
          <p>For this assignment, here's exactly what was captured about this request:</p>
          <ul>
            <li><b>IP address:</b> ${ip}</li>
            <li><b>Approx location:</b> ${geo ? `${geo.city || '?'}, ${geo.regionName || '?'}, ${geo.country || '?'}` : 'lookup unavailable (private/local IP)'}</li>
            <li><b>ISP:</b> ${geo ? geo.isp : 'n/a'}</li>
            <li><b>User agent:</b> ${userAgent}</li>
            <li><b>Time:</b> ${timestamp}</li>
          </ul>
        </body>
      </html>
    `);
  });
});

// Simple endpoint to view the log (for your own testing only — see README about securing this)
app.get('/logs', (req, res) => {
  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) return res.send('No visits logged yet.');
    res.type('text/plain').send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
