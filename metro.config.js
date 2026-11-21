// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const { translate } = require('./server/deepl');

const config = getDefaultConfig(__dirname);

/**
 * Dev server only: answers POST /api/translate like the Vercel function (api/translate.js),
 * so the free-text chat works locally on web and in Expo Go. The key comes from `.env.local`.
 */
const enhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const base = enhance ? enhance(middleware, server) : middleware;
  return (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/translate')) return base(req, res, next);
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return send(405, { error: 'Nur POST' });
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', async () => {
      try {
        const result = await translate(JSON.parse(raw || '{}'));
        send(result.status, result.body);
      } catch {
        send(502, { error: 'Übersetzung nicht erreichbar' });
      }
    });
  };
};

module.exports = config;
