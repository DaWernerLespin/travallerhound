const { translate } = require('../server/deepl');

/** Vercel function: POST /api/translate { text, source: 'de' | 'fr', target: 'de' | 'fr' } → { text }. */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST' });
    return;
  }
  try {
    const result = await translate(req.body);
    res.status(result.status).json(result.body);
  } catch {
    res.status(502).json({ error: 'Übersetzung nicht erreichbar' });
  }
};
