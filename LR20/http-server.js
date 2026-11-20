import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import crypto from 'node:crypto';
import { CONFIG } from './config.js';

export function createServer() {
  const logFile = path.resolve(process.cwd(), 'access.log');
  const metrics = {
    group: CONFIG.groupName,
    total: 0,
    byMethod: { GET: 0, POST: 0, PUT: 0, DELETE: 0 },
    byStatus: {},
    uptime: () => Math.floor(process.uptime()),
  };

  // In-memory кэш
  const cache = new Map();

  // Хранилище студентов
  let students = [
    { id: 1, name: 'Иван', group: CONFIG.groupName },
    { id: 2, name: 'Мария', group: CONFIG.groupName },
    { id: 3, name: 'Александр', group: CONFIG.groupName },
  ];
  let nextStudentId = 4;

  // Создаем папку public и тестовый файл для статики
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), '<!DOCTYPE html><html><body><h1>Static File</h1></body></html>');
    fs.writeFileSync(path.join(publicDir, 'style.css'), 'body { background: #eee; }');
  }

  // Создаем тестовый файл для стриминга
  const streamFile = path.resolve(process.cwd(), 'stream-sample.dat');
  if (!fs.existsSync(streamFile)) {
    fs.writeFileSync(streamFile, Buffer.alloc(2 * 1024 * 1024, 'Stream chunk data\n'));
  }

  const server = http.createServer(async (req, res) => {
    metrics.total++;
    metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;

    const start = Date.now();
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    res.setHeader('X-Group', CONFIG.groupName);

    // Логирование завершения ответа
    res.on('finish', () => {
      const ms = Date.now() - start;
      const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      metrics.byStatus[res.statusCode] = (metrics.byStatus[res.statusCode] || 0) + 1;
      const logLine = `[${timeStr}] [${CONFIG.groupName}] ${req.method} ${pathname} ${res.statusCode} - ${ms}ms`;
      console.log(logLine);
      fs.appendFileSync(logFile, logLine + '\n', 'utf-8');
    });

    // Функция чтения тела запроса с ограничением размера 1 МБ (Задание 3)
    const readBody = () =>
      new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        const maxSize = 1024 * 1024; // 1 МБ

        req.on('data', (chunk) => {
          size += chunk.length;
          if (size > maxSize) {
            req.destroy();
            reject({ status: 413, message: 'Payload Too Large' });
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            // Защита от path traversal
    if (req.url.includes('..') || pathname.includes('secret.txt')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    try {
              resolve(JSON.parse(buffer.toString('utf-8')));
            } catch {
              reject({ status: 400, message: 'Invalid JSON' });
            }
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const params = new URLSearchParams(buffer.toString('utf-8'));
            const obj = {};
            for (const [k, v] of params.entries()) obj[k] = v;
            resolve(obj);
          } else {
            resolve(buffer.toString('utf-8'));
          }
        });

        req.on('error', (err) => reject(err));
      });

    // Защита от path traversal
    if (req.url.includes('..') || pathname.includes('secret.txt')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    try {
      // 1. Задание 1: Базовые страницы GET / и GET /about
      if (pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Лабораторная работа №20</h1>
            <p>Группа: ${CONFIG.groupName}</p>
            <p>Студент: ${CONFIG.studentName}</p>
            <p>Метод: GET, URL: /</p>
          </body>
          </html>
        `);
        return;
      }

      if (pathname === '/about' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <body>
            <h1>О студенте</h1>
            <p>Группа: ${CONFIG.groupName}</p>
            <p>Студент: ${CONFIG.studentName}</p>
          </body>
          </html>
        `);
        return;
      }

      // 2. Задание 2: Работа с HTTP-заголовками (/headers, /headers/set, /headers/check)
      if (pathname === '/headers' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion,
          })
        );
        return;
      }

      if (pathname === '/headers/set' && req.method === 'GET') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('X-Group', CONFIG.groupName);
        res.setHeader('Cache-Control', 'no-cache');
        res.writeHead(200);
        res.end('<h1>Заголовки установлены</h1>');
        return;
      }

      if (pathname === '/headers/check' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            hasContentType: Boolean(req.headers['content-type']),
            hasXGroup: Boolean(req.headers['x-group']),
            hasUserAgent: Boolean(req.headers['user-agent']),
          })
        );
        return;
      }

      // 3. Задание 3: Чтение тела запроса (/echo, /form)
      if (pathname === '/echo' && req.method === 'POST') {
        const body = await readBody();
        const contentType = req.headers['content-type'] || 'text/plain';
        if (typeof body === 'object') {
          body.group = CONFIG.groupName;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(body));
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(body);
        }
        return;
      }

      if (pathname === '/form' && req.method === 'POST') {
        const body = await readBody();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
        return;
      }

      // 4. Задание 4: REST API для студентов (/api/students)
      if (pathname === '/api/students') {
        if (req.method === 'GET') {
          const groupQuery = parsedUrl.searchParams.get('group');
          let result = students;
          if (groupQuery) {
            result = result.filter((s) => s.group === groupQuery);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === 'POST') {
          const body = await readBody();
          const newStudent = { id: nextStudentId++, name: body.name || 'Аноним', group: body.group || CONFIG.groupName };
          students.push(newStudent);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newStudent));
          return;
        }

        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('405 Method Not Allowed');
        return;
      }

      const studentIdMatch = pathname.match(/^\/api\/students\/(\d+)$/);
      if (studentIdMatch) {
        const id = parseInt(studentIdMatch[1], 10);
        const student = students.find((s) => s.id === id);

        if (req.method === 'GET') {
          if (!student) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Студент не найден' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(student));
          return;
        }

        if (req.method === 'PUT') {
          if (!student) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Студент не найден' }));
            return;
          }
          const body = await readBody();
          if (body.name) student.name = body.name;
          if (body.group) student.group = body.group;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(student));
          return;
        }

        if (req.method === 'DELETE') {
          const idx = students.findIndex((s) => s.id === id);
          if (idx === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Студент не найден' }));
            return;
          }
          students.splice(idx, 1);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ deleted: true, id }));
          return;
        }

        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('405 Method Not Allowed');
        return;
      }

      // 5. Задание 5: Статические файлы (/static/*) с ETag и кэшированием
      if (pathname.startsWith('/static/')) {
        // Path traversal защита
        if (pathname.includes('..')) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('403 Forbidden');
          return;
        }

        const relativePath = pathname.slice('/static/'.length);
        const fullStaticPath = path.join(publicDir, relativePath);

        if (!fs.existsSync(fullStaticPath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        const content = fs.readFileSync(fullStaticPath);
        const etag = `"${crypto.createHash('md5').update(content).digest('hex').slice(0, 8)}"`;

        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304);
          res.end();
          return;
        }

        const ext = path.extname(fullStaticPath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.js': 'application/javascript',
          '.json': 'application/json',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'max-age=60');
        res.writeHead(200);
        res.end(content);
        return;
      }

      // Стриминг файла (/stream)
      if (pathname === '/stream') {
        const stream = fs.createReadStream(streamFile);
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        stream.pipe(res);
        return;
      }

      // Метрики (/metrics)
      if (pathname === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            group: metrics.group,
            total: metrics.total,
            byMethod: metrics.byMethod,
            byStatus: metrics.byStatus,
            uptime: metrics.uptime(),
          })
        );
        return;
      }

      // 404 по умолчанию
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 Not Found</h1><p>Путь ${pathname} не найден</p>`);
    } catch (err) {
      const status = err.status || 500;
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.message || '500 Internal Server Error');
    }
  });

  return server;
}

if (process.argv[1]?.endsWith('http-server.js')) {
  const server = createServer();
  const PORT = CONFIG.port || 3000;
  server.listen(PORT, () => {
    console.log(`[INFO] HTTP-сервер запущен на порту ${PORT}`);
    console.log(`[INFO] Студент: ${CONFIG.studentName}, Группа: ${CONFIG.groupName}`);
  });
}
