const { describe, expect, it, jest } = require('@jest/globals');

const { CONTEXT, deeplUrl, translate, validate } = require('../deepl');

describe('DeepL proxy', () => {
  it('uses the free host for free keys', () => {
    expect(deeplUrl('abc:fx')).toBe('https://api-free.deepl.com/v2/translate');
    expect(deeplUrl('abc')).toBe('https://api.deepl.com/v2/translate');
  });

  it('rejects bad requests', () => {
    expect(validate({ text: '', source: 'de', target: 'fr' })).not.toBeNull();
    expect(validate({ text: 'Hallo', source: 'en', target: 'fr' })).not.toBeNull();
    expect(validate({ text: 'x'.repeat(1001), source: 'de', target: 'fr' })).not.toBeNull();
    expect(validate({ text: 'Hallo', source: 'de', target: 'fr' })).toBeNull();
  });

  it('reports a missing key', async () => {
    const result = await translate({ text: 'Hallo', source: 'de', target: 'fr' }, '');
    expect(result.status).toBe(500);
  });

  it('sends the text to DeepL and returns the translation', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({ translations: [{ text: 'Bonjour' }] }) }));
    global.fetch = fetchMock;
    const result = await translate({ text: 'Hallo', source: 'de', target: 'fr' }, 'key:fx');
    expect(result).toEqual({ status: 200, body: { text: 'Bonjour' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api-free.deepl.com/v2/translate');
    expect(init.headers.Authorization).toBe('DeepL-Auth-Key key:fx');
    expect(JSON.parse(init.body)).toEqual({ text: ['Hallo'], source_lang: 'DE', target_lang: 'FR', context: CONTEXT });
  });
});
