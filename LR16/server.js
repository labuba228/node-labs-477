import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.js';

export function createApp() {
  const app = express();

  // Middleware парсинга
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware сжатия (Задание 3)
  app.use(compression());

  // Middleware логирования (Задание 3)
  const logFile = path.resolve(process.cwd(), 'books.log');
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const logLine = `[${timeStr}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`;
      console.log(logLine);
      fs.appendFileSync(logFile, logLine + '\n', 'utf-8');
    });
    next();
  });

  // Rate Limiter: максимум 100 запросов в минуту (Задание 3)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много запросов. Лимит: 100 запросов в минуту', status: 429 },
  });
  app.use(limiter);

  // In-memory кэш (Задание 5)
  const cache = new Map();
  function cacheMiddleware(ttlSec = 300) {
    return (req, res, next) => {
      if (req.method !== 'GET') return next();
      const key = req.originalUrl;
      const cached = cache.get(key);
      if (cached && Date.now() - cached.time < ttlSec * 1000) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached.data);
      }
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        cache.set(key, { data, time: Date.now() });
        return originalJson(data);
      };
      next();
    };
  }

  // Swagger Documentation (Задание 5)
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Books REST API - Лабораторная работа №16',
        version: '1.0.0',
        description: `API библиотеки для студента ${CONFIG.studentName}, группа ${CONFIG.groupName}`,
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
    apis: [],
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Задание 1: Базовый HTTP-сервер ---
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Лабораторная работа №16</title>
        <style>body { font-family: sans-serif; padding: 2rem; background: #eef2f6; }</style>
      </head>
      <body>
        <h1>Лабораторная работа №16: Express.js</h1>
        <p><strong>Студент:</strong> ${CONFIG.studentName}</p>
        <p><strong>Группа:</strong> ${CONFIG.groupName}</p>
        <p><strong>Вариант:</strong> ${CONFIG.variant}</p>
        <p><strong>Дата и время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
        <p><em>Приветственное сообщение: Добро пожаловать на сервер Express!</em></p>
        <h3>Доступные маршруты:</h3>
        <ul>
          <li><a href="/about">/about</a> - О разработчике</li>
          <li><a href="/contacts">/contacts</a> - Контакты</li>
          <li><a href="/api/books">/api/books</a> - Список книг</li>
          <li><a href="/api/books/stats">/api/books/stats</a> - Статистика книг</li>
          <li><a href="/api-docs">/api-docs</a> - Swagger UI</li>
        </ul>
      </body>
      </html>
    `);
  });

  app.get('/about', (req, res) => {
    res.json({
      student: CONFIG.studentName,
      group: CONFIG.groupName,
      variant: CONFIG.variant,
      role: 'Fullstack Developer / Student',
    });
  });

  app.get('/contacts', (req, res) => {
    res.json({
      email: 'student477@example.com',
      telegram: '@alex_kuxov',
      university: 'БрГТУ / ББМО',
    });
  });

  // Хранилище книг (100 сгенерированных книг)
  const authors = ['Л. Толстой', 'Ф. Достоевский', 'М. Булгаков', 'А. Пушкин', 'А. Чехов', 'Н. Гоголь', 'И. Тургенев', 'Дж. Оруэлл'];
  const titles = ['Война и мир', 'Преступление и наказание', 'Мастер и Маргарита', 'Евгений Онегин', 'Вишневый сад', 'Мертвые души', 'Отцы и дети', '1984', 'Собачье сердце', 'Идиот'];
  const genres = ['Роман', 'Классика', 'Фантастика', 'Драма', 'Повесть'];

  let books = [];
  for (let i = 1; i <= 100; i++) {
    const author = authors[i % authors.length];
    const baseTitle = titles[i % titles.length];
    books.push({
      id: i,
      title: i <= titles.length ? baseTitle : `${baseTitle} (Том ${Math.floor(i / titles.length) + 1})`,
      author,
      year: 1830 + (i % 150),
      genre: genres[i % genres.length],
      available: i % 5 !== 0,
    });
  }
  let nextBookId = 101;

  // Аутентификация (Задание 5)
  const users = [
    { email: 'admin@example.com', password: 'password123', role: 'admin' },
    { email: 'user@example.com', password: 'password123', role: 'user' },
  ];

  app.post('/auth/register', (req, res) => {
    const { email, password, role = 'user' } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    users.push({ email, password, role });
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  });

  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Неверные учетные данные' });
    const token = jwt.sign({ email: user.email, role: user.role }, CONFIG.jwtSecret, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  });

  function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Требуется токен авторизации' });
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      req.user = jwt.verify(token, CONFIG.jwtSecret);
      next();
    } catch {
      return res.status(403).json({ error: 'Недействительный или просроченный токен' });
    }
  }

  // --- Задание 4: Статистика книг ---
  app.get('/api/books/stats', (req, res) => {
    const total = books.length;
    const byAuthor = {};
    const byGenre = {};
    let oldestYear = Infinity;
    let newestYear = -Infinity;

    for (const b of books) {
      byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
      byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
      if (b.year < oldestYear) oldestYear = b.year;
      if (b.year > newestYear) newestYear = b.year;
    }

    res.json({
      total,
      byAuthor,
      byGenre,
      oldestYear,
      newestYear,
    });
  });

  // --- Задание 2 & 4: Поиск по автору ---
  app.get('/api/books/search', (req, res) => {
    const { author } = req.query;
    if (!author) return res.status(400).json({ error: 'Укажите параметр author' });
    const found = books.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
    res.json(found);
  });

  // --- Экспорт в JSON/CSV (Задание 5) ---
  app.get('/api/books/export', (req, res) => {
    const format = req.query.format || 'json';
    if (format === 'csv') {
      const header = 'id,title,author,year,genre\n';
      const rows = books.map((b) => `${b.id},"${b.title}","${b.author}",${b.year},"${b.genre}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="books.csv"');
      return res.send(header + rows);
    }
    res.json(books);
  });

  // --- GET /api/books (с фильтрацией, пагинацией, сортировкой, поиском) ---
  app.get('/api/books', cacheMiddleware(60), (req, res) => {
    let result = [...books];
    const { author, year, yearFrom, yearTo, sort, search } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    if (author) {
      result = result.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
    }
    if (year) {
      result = result.filter((b) => b.year === parseInt(year, 10));
    }
    if (yearFrom) {
      result = result.filter((b) => b.year >= parseInt(yearFrom, 10));
    }
    if (yearTo) {
      result = result.filter((b) => b.year <= parseInt(yearTo, 10));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }

    if (sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    } else if (sort === '-year') {
      result.sort((a, b) => b.year - a.year);
    }

    const total = result.length;
    const offset = (page - 1) * limit;
    const paginated = result.slice(offset, offset + limit);

    res.json({
      total,
      page,
      limit,
      data: paginated,
    });
  });

  // GET /api/books/:id
  app.get('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const book = books.find((b) => b.id === id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    res.json(book);
  });

  // POST /api/books (валидация + проверка на дубликаты)
  app.post('/api/books', (req, res) => {
    const { title, author, year, genre = 'Роман' } = req.body || {};
    if (!title || !author || !year) {
      return res.status(400).json({ error: 'Поля title, author и year обязательны', status: 400 });
    }
    const dup = books.find((b) => b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase());
    if (dup) {
      return res.status(409).json({ error: 'Такая книга уже существует в каталоге', status: 409 });
    }
    const newBook = { id: nextBookId++, title, author, year: Number(year), genre, available: true };
    books.push(newBook);
    cache.clear();
    res.status(201).json(newBook);
  });

  // PUT /api/books/:id
  app.put('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const book = books.find((b) => b.id === id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    const { title, author, year, genre } = req.body || {};
    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = Number(year);
    if (genre) book.genre = genre;
    cache.clear();
    res.json(book);
  });

  // DELETE /api/books/:id
  app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    books.splice(idx, 1);
    cache.clear();
    res.json({ message: 'Книга успешно удалена', id });
  });

  // Маршруты для тестирования ошибок (Задание 3)
  app.get('/error', (req, res, next) => {
    next(new Error('Тестовая синхронная ошибка'));
  });

  app.get('/async-error', async (req, res, next) => {
    setTimeout(() => {
      try {
        throw new Error('Тестовая асинхронная ошибка');
      } catch (err) {
        next(err);
      }
    }, 10);
  });

  // Централизованный обработчик ошибок (Задание 3)
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Внутренняя ошибка сервера',
      status,
    });
  });

  return app;
}

if (process.argv[1]?.endsWith('server.js')) {
  const app = createApp();
  const PORT = CONFIG.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер Express.js запущен на http://localhost:${PORT}`);
    console.log(`Студент: ${CONFIG.studentName}, Группа: ${CONFIG.groupName}, Вариант: ${CONFIG.variant}`);
  });
}
