/**
 * GHL Funnel Inspector — Cloudflare Worker Proxy
 * Deploys to: https://ghl-proxy.<your-subdomain>.workers.dev
 *
 * Deploy steps:
 *   1. Go to https://workers.cloudflare.com → sign up free
 *   2. Create New Worker → paste this entire file
 *   3. Click Save & Deploy
 *   4. Copy your worker URL and paste it into the frontend HTML file
 */

const ALLOWED_ORIGINS = ['*']; // Restrict to your domain in production e.g. ['https://yourdomain.com']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Version',
};

const GHL_BASE = 'https://services.leadconnectorhq.com';

export default {
  async fetch(request) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Only allow /proxy/* paths
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Build the GHL target URL
    const ghlPath = url.pathname.replace('/proxy/', '/');
    const ghlUrl = `${GHL_BASE}${ghlPath}${url.search}`;

    // Forward the Authorization header
    const authHeader = request.headers.get('Authorization');
    const versionHeader = request.headers.get('Version') || '2021-07-28';

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      const ghlResponse = await fetch(ghlUrl, {
        method: request.method,
        headers: {
          'Authorization': authHeader,
          'Version': versionHeader,
          'Content-Type': 'application/json',
        },
      });

      const data = await ghlResponse.text();

      return new Response(data, {
        status: ghlResponse.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
