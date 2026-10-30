import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function persistDefaultSheetsUrlPlugin() {
  return {
    name: 'persist-default-sheets-url',
    configureServer(server: any) {
      server.middlewares.use('/api/set-default-sheets-url', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const {url} = JSON.parse(body || '{}');
              if (url && typeof url === 'string' && url.startsWith('https://script.google.com/')) {
                const targetPath = path.resolve(__dirname, 'src/config/defaultSheetsUrl.ts');
                const nextContent = `// Konfigurasi Spreadsheet Utama Permanen (Otomatis aktif di semua perangkat HP & Laptop)\nexport const DEFAULT_SHEETS_WEBAPP_URL = ${JSON.stringify(url.trim())};\n`;
                const currentContent = fs.existsSync(targetPath)
                  ? fs.readFileSync(targetPath, 'utf-8')
                  : '';
                if (currentContent !== nextContent) {
                  fs.writeFileSync(targetPath, nextContent, 'utf-8');
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ok: true}));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ok: false}));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), persistDefaultSheetsUrlPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
