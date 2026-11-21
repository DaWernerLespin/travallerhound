/**
 * DeepL translation, server side only: DeepL blocks calls from browsers (CORS) and the key must not ship in the app.
 * Used by the Metro dev server (metro.config.js) and the Vercel function (api/translate.js).
 * Key: DEEPL_API_KEY in `.env.local` locally and in Vercel's environment variables.
 */
const LANGUAGES = { de: 'DE', fr: 'FR' };
const MAX_LENGTH = 1000;
/**
 * Background for DeepL (not translated, not billed), so ambiguous words get the restaurant meaning,
 * e.g. "Gericht" = dish, not court.
 */
const CONTEXT =
  'Gespräch in einem Restaurant in Frankreich zwischen einem Gast mit schwerer Erdnuss- und Lupinenallergie und dem Personal ' +
  'über Gerichte, Zutaten, Zubereitung und Bestellung. Conversation au restaurant entre un client allergique et le personnel ' +
  'au sujet des plats, des ingrédients et de la préparation.';

/** Free API keys end in ":fx" and use their own host. */
function deeplUrl(key) {
  return key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
}

/** Checks the request body ({ text, source, target }); returns an error message or null. */
function validate(body) {
  if (!body || typeof body.text !== 'string' || body.text.trim() === '') return 'text fehlt';
  if (body.text.length > MAX_LENGTH) return `text ist länger als ${MAX_LENGTH} Zeichen`;
  if (!LANGUAGES[body.source] || !LANGUAGES[body.target]) return 'source/target muss "de" oder "fr" sein';
  return null;
}

/** Translates one text. Returns { status, body } so both servers answer the same way. */
async function translate(body, key = process.env.DEEPL_API_KEY) {
  const invalid = validate(body);
  if (invalid) return { status: 400, body: { error: invalid } };
  if (!key) return { status: 500, body: { error: 'DEEPL_API_KEY ist nicht gesetzt' } };

  const response = await fetch(deeplUrl(key), {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: [body.text],
      source_lang: LANGUAGES[body.source],
      target_lang: LANGUAGES[body.target],
      context: CONTEXT,
    }),
  });
  if (!response.ok) return { status: 502, body: { error: `DeepL ${response.status}` } };
  const data = await response.json();
  const text = data.translations?.[0]?.text;
  if (typeof text !== 'string') return { status: 502, body: { error: 'DeepL: leere Antwort' } };
  return { status: 200, body: { text } };
}

module.exports = { translate, validate, deeplUrl, CONTEXT };
