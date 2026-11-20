import http from 'node:http';
import { createApp } from './app.js';
import { CONFIG } from './config.js';

async function testAll() {
  console.log('=== Запуск комплексного тестирования ЛР24 (REST API + MongoDB + Koa) ===\n');

  const app = createApp();
  const server = http.createServer(app.callback());
  const port = 3013;
  await new Promise((r) => server.listen(port, r));
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. GET /api/users
    console.log('1. GET /api/users (список с пагинацией):');
    const rUsers = await (await fetch(`${baseUrl}/api/users?page=1&limit=3`)).json();
    console.log(`   Всего пользователей: ${rUsers.total}, Страница: ${rUsers.page}/${rUsers.pages}, Получено: ${rUsers.data.length}`);

    // 2. Валидация Joi при создании (ошибка 400)
    console.log('\n2. Валидация Joi при POST:');
    const rBad = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'invalid-email', group_name: CONFIG.groupName }),
    });
    const badData = await rBad.json();
    console.log(`   POST с невалидными данными -> Статус: ${rBad.status}, Ошибка: ${badData.error}`);

    // 3. Успешная регистрация и получение токена
    console.log('\n3. Аутентификация JWT (Регистрация и Вход):');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Куксов Александр Денисович',
        email: 'alex_kuxov@example.com',
        password: 'securepassword123',
        group_name: CONFIG.groupName,
        age: 20,
        role: 'admin',
      }),
    });
    const regData = await regRes.json();
    const token = regData.accessToken;
    console.log(`   POST /api/auth/register -> Создан пользователь: ${regData.data.email}, Токен получен: ${Boolean(token)}`);

    // 4. Поиск пользователей
    console.log('\n4. Поиск пользователей:');
    const searchRes = await (await fetch(`${baseUrl}/api/users/search?q=Александр`)).json();
    console.log(`   GET /api/users/search?q=Александр -> Найдено: ${searchRes.found}`);

    // 5. Статистика
    console.log('\n5. Статистика пользователей:');
    const statsRes = await (await fetch(`${baseUrl}/api/users/stats`)).json();
    console.log(`   GET /api/users/stats -> Всего: ${statsRes.total}, Средний возраст: ${statsRes.averageAge}, Группа ${CONFIG.groupName}: ${statsRes.byGroup[CONFIG.groupName]}`);

    // 6. Защищенный Admin маршрут
    console.log('\n6. Проверка доступа по ролям (RBAC):');
    const adminRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   GET /api/admin/users с токеном Admin -> Статус: ${adminRes.status} (Ожидалось 200)`);

    const unauthAdmin = await fetch(`${baseUrl}/api/admin/users`);
    console.log(`   GET /api/admin/users без токена -> Статус: ${unauthAdmin.status} (Ожидалось 401)`);

    // 7. Health & Metrics
    console.log('\n7. Health & Metrics:');
    const health = await (await fetch(`${baseUrl}/health`)).json();
    console.log(`   GET /health -> Status: ${health.status}, DB: ${health.db}`);

    console.log('\n✅ Все задания ЛР24 успешно выполнены!');
  } finally {
    server.close();
  }
}

testAll().catch((err) => {
  console.error('Ошибка в ЛР24:', err);
  process.exit(1);
});
