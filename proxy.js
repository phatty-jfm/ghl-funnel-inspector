/**
 * Vercel Serverless Function — GHL API Proxy
 * File location in your repo: /api/proxy.js
 *
 * This handles all GHL API requests from the frontend
 * and forwards them server-side (no CORS issues).
 */

const GHL_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Version');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers['authorization'];
  const version = req.headers['version'] || '2021-07-28';

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // Get the GHL path from query param e.g. ?path=/funnels/funnel/list&locationId=xxx
  const { path, ...rest } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path query parameter' });
  }

  // Build query string from remaining params
  const qs = new URLSearchParams(rest).toString();
  const ghlUrl = `${GHL_BASE}${path}${qs ? '?' + qs : ''}`;

  try {
    const ghlRes = await fetch(ghlUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Version': version,
        'Content-Type': 'application/json',
      },
    });

    const data = await ghlRes.json();
    return res.status(ghlRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
