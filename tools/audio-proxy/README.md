Development CORS proxy for audio

Run locally during development to serve remote audio with permissive CORS headers.

Setup:

```bash
cd tools/audio-proxy
npm install
npm start
```

Usage from Flutter web (default in this repo):
- Proxy base: `http://localhost:8080/proxy?url=`
- Example proxied audio URL: `http://localhost:8080/proxy?url=https%3A%2F%2Fexample.com%2Faudio.mp3`

Note: This is intended for local development only. For production, enable CORS on the audio host or use a production-grade proxy/CDN.
