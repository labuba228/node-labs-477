import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { CONFIG } from './config.js';

export function createApp() {
  const app = new Koa();
  const router = new Router();

  // 1. Middleware логирования (Задание 3)
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`[${timeStr}] ${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms`);
  });

  // 2. Middleware централизованной обработки ошибок (Задание 3)
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        error: err.message || 'Внутренняя ошибка сервера',
        status: ctx.status,
      };
      ctx.app.emit('error', err, ctx);
    }
  });

  app.use(bodyParser());

  // 3. Задание 1: Базовый HTTP-сервер
  router.get('/', (ctx) => {
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Лабораторная работа №15</title>
        <style>
          body { font-family: sans-serif; background: #f4f6f8; padding: 2rem; }
          .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
          h1 { color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Лабораторная работа №15</h1>
          <p><strong>Студент:</strong> ${CONFIG.studentName}</p>
          <p><strong>Группа:</strong> ${CONFIG.groupName}</p>
          <p><strong>Вариант:</strong> ${CONFIG.variant}</p>
          <p><strong>Текущая дата и время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          <p><em>Приветственное сообщение: Добро пожаловать на сервер Koa.js!</em></p>
        </div>
      </body>
      </html>
    `;
  });

  // 4. Задание 2: REST API пользователей (/api/users)
  let users = [
    { id: 1, name: CONFIG.studentName, group: CONFIG.groupName },
    { id: 2, name: 'Петров Петр', group: CONFIG.groupName },
  ];
  let nextUserId = 3;

  router.get('/api/users', (ctx) => {
    ctx.body = users;
  });

  router.post('/api/users', (ctx) => {
    const { name, group } = ctx.request.body || {};
    if (!name || !group) {
      ctx.throw(400, 'Невалидные данные: требуется name и group');
    }
    const newUser = { id: nextUserId++, name, group };
    users.push(newUser);
    ctx.status = 201;
    ctx.body = newUser;
  });

  router.put('/api/users/:id', (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    const user = users.find((u) => u.id === id);
    if (!user) {
      ctx.throw(404, 'Пользователь не найден');
    }
    const { name, group } = ctx.request.body || {};
    if (name) user.name = name;
    if (group) user.group = group;
    ctx.body = user;
  });

  router.delete('/api/users/:id', (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      ctx.throw(404, 'Пользователь не найден');
    }
    users.splice(idx, 1);
    ctx.body = { message: 'Пользователь успешно удален', id };
  });

  // 5. Задание 3: Middleware авторизации и тестовые маршруты
  const authMiddleware = async (ctx, next) => {
    const authHeader = ctx.get('Authorization');
    if (!authHeader) {
      ctx.throw(401, 'Отсутствует заголовок Authorization');
    }
    await next();
  };

  router.get('/protected', authMiddleware, (ctx) => {
    ctx.body = { message: 'Доступ к защищенному маршруту разрешен', user: ctx.get('Authorization') };
  });

  router.get('/error', () => {
    throw new Error('Тестовая ошибка сервера');
  });

  // 6. Задания 4 и 5: Управление студентами (пагинация, сортировка, поиск, CRUD)
  // Автоматическая генерация 50 студентов на основе группы
  const firstNames = ['Александр', 'Иван', 'Максим', 'Артем', 'Михаил', 'Даниил', 'Дмитрий', 'Кирилл', 'Андрей', 'Егор', 'Анна', 'Мария', 'София', 'Алиса', 'Полина'];
  const lastNames = ['Куксов', 'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Федоров', 'Морозов'];

  let students = [];
  for (let i = 1; i <= 50; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    students.push({
      id: i,
      name: `${ln} ${fn}`,
      group: i % 3 === 0 ? CONFIG.groupName : `${CONFIG.groupName}-${(i % 3) + 1}`,
      course: (i % 4) + 1,
    });
  }
  let nextStudentId = 51;

  router.get('/students', (ctx) => {
    const { group, sort, search } = ctx.query;
    const limit = ctx.query.limit !== undefined ? parseInt(ctx.query.limit, 10) : 10;
    const offset = ctx.query.offset !== undefined ? parseInt(ctx.query.offset, 10) : 0;

    let result = [...students];

    // Фильтрация по группе
    if (group) {
      result = result.filter((s) => s.group.toLowerCase() === group.toLowerCase());
    }

    // Поиск по имени
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Сортировка
    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (sort === '-name') {
      result.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    } else if (sort === 'course') {
      result.sort((a, b) => a.course - b.course);
    }

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    ctx.body = {
      total,
      limit,
      offset,
      students: paginated,
    };
  });

  router.get('/students/:id', (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    const student = students.find((s) => s.id === id);
    if (!student) {
      ctx.throw(404, 'Студент не найден');
    }
    ctx.body = student;
  });

  router.post('/students', (ctx) => {
    const { name, group, course } = ctx.request.body || {};
    if (!name || !group || course === undefined) {
      ctx.throw(400, 'Необходимо заполнить обязательные поля: name, group, course');
    }
    const newStudent = { id: nextStudentId++, name, group, course: Number(course) };
    students.push(newStudent);
    ctx.status = 201;
    ctx.body = newStudent;
  });

  router.put('/students/:id', (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    const student = students.find((s) => s.id === id);
    if (!student) {
      ctx.throw(404, 'Студент не найден');
    }
    const { name, group, course } = ctx.request.body || {};
    if (name) student.name = name;
    if (group) student.group = group;
    if (course !== undefined) student.course = Number(course);
    ctx.body = student;
  });

  router.delete('/students/:id', (ctx) => {
    const id = parseInt(ctx.params.id, 10);
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) {
      ctx.throw(404, 'Студент не найден');
    }
    students.splice(idx, 1);
    ctx.body = { message: 'Студент успешно удален', id };
  });

  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

if (process.argv[1]?.endsWith('server.js')) {
  const app = createApp();
  const PORT = CONFIG.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер Koa.js запущен на http://localhost:${PORT}`);
    console.log(`Студент: ${CONFIG.studentName}, Группа: ${CONFIG.groupName}, Вариант: ${CONFIG.variant}`);
  });
}
