/**
 * serve.mjs — server statis untuk pratinjau lokal.
 *
 * Halaman memuat data lewat fetch(), sehingga tidak bisa dibuka dengan
 * double-click (protokol file:// diblokir CORS). Jalankan: npm run serve
 *
 * Modul ini juga dipakai scripts/uji.mjs agar tes memakai jalur yang sama
 * dengan yang dipakai pengguna.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const TIPE = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon'
};

export function buatServer(root = ROOT) {
  const akar = path.resolve(root);

  return http.createServer(function (req, res) {
    let url;
    try {
      url = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch (e) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('400');
      return;
    }

    let berkas = path.join(akar, url === '/' ? 'index.html' : url);

    /* Cegah path traversal keluar dari akar. */
    if (path.resolve(berkas) !== akar && !path.resolve(berkas).startsWith(akar + path.sep)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('403');
      return;
    }

    try {
      if (fs.existsSync(berkas) && fs.statSync(berkas).isDirectory()) {
        berkas = path.join(berkas, 'index.html');
      }
    } catch (e) {}

    fs.readFile(berkas, function (galat, isi) {
      if (galat) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('404 ' + url);
        return;
      }
      res.writeHead(200, {
        'content-type': TIPE[path.extname(berkas).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
      });
      res.end(isi);
    });
  });
}

export function jalankan(port = 8080, host = '127.0.0.1') {
  const server = buatServer();
  return new Promise(function (resolve) {
    server.listen(port, host, function () {
      const alamat = server.address();
      console.log('SKD Notes: http://' + host + ':' + alamat.port + '/');
      console.log('Tekan Ctrl+C untuk berhenti.');
      resolve(server);
    });
  });
}

const langsung = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (langsung) {
  jalankan(Number(process.env.PORT || 8080)).catch(function (e) {
    console.error('Gagal menjalankan server:', e.message);
    process.exit(1);
  });
}
