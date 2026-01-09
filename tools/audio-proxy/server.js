const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple proxy endpoint: /proxy?url=<encodedUrl>
app.options('/proxy', (req, res) => {
  // CORS preflight
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.sendStatus(204);
});

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url query');

  try {
    console.log(`Proxy request for: ${url}`);
    const resp = await fetch(url);
    console.log(`Upstream status: ${resp.status} for ${url}`);

    // forward status and headers we care about
    res.status(resp.status);
    const contentType = resp.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);
    const contentLength = resp.headers.get('content-length');
    if (contentLength) res.set('Content-Length', contentLength);

    // allow CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // stream body to client
    const body = resp.body;
    if (body && typeof body.pipe === 'function') {
      body.pipe(res);
    } else {
      const buffer = await resp.buffer();
      res.send(buffer);
    }
  } catch (e) {
    console.error(`Proxy fetch error for ${url}:`, e);
    res.status(502).send('Failed to fetch');
  }
});

app.listen(PORT, () => {
  console.log(`Audio proxy running on http://localhost:${PORT}/proxy?url=<encodedUrl>`);
});
