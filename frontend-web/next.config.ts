import type { NextConfig } from 'next';
import path from 'path';

// FRAME_ANCESTORS : origines autorisées à intégrer ce site en iframe (ex. "https://www.ivry94.fr https://ivry94.fr").
const frameAncestors = process.env.FRAME_ANCESTORS || "'self'";

const config: NextConfig = {
  output: 'standalone',
  // Ce dossier est imbriqué dans le dépôt VibeODP : on borne la racine pour ne pas charger le middleware / instrumentation du parent
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors}` },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ],
    }];
  },
};

export default config;
