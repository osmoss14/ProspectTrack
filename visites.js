/**
 * api.js — Fonctions d'accès à Supabase
 * ────────────────────────────────────────
 * Une seule fonction générique `api()` utilisée partout.
 */

/**
 * Appelle l'API REST Supabase.
 * @param {string} table   - Nom de la table (ex: 'visites')
 * @param {string} method  - HTTP method: GET, POST, PATCH, DELETE
 * @param {object} body    - Corps de la requête (pour POST/PATCH)
 * @param {string} qs      - Query string (ex: '?id=eq.xxx')
 * @returns {Promise<Array>}
 */
async function api(table, method = 'GET', body = null, qs = '') {
  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  // GET n'a pas besoin de Prefer
  if (method === 'GET') delete headers['Prefer'];

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${qs}`,
    { method, headers, body: body ? JSON.stringify(body) : null }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}
