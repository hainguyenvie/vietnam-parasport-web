import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export const config = {
  api: {
    // Disable body parsing so we can consume the stream raw and pipe it to the backend.
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const action = req.query.action as string;
  const internalUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001/api/v1';
  
  const targetUrlStr = `${internalUrl.replace(/\/+$/, '')}/settings/admin/${action}`;
  const targetUrl = new URL(targetUrlStr);

  // Copy all headers from the incoming request, but override the host header
  const headers = { ...req.headers, host: targetUrl.host };

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: headers,
  };

  const client = targetUrl.protocol === 'https:' ? https : http;

  const proxyReq = client.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err: any) => {
    console.error('Pages API Settings proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to proxy settings request', details: err.message });
    }
  });

  // Since bodyParser is false, req is a standard Node.js Readable stream.
  // We can pipe it directly into the proxy request, sending the exact bytes.
  req.pipe(proxyReq, { end: true });
}
