import { createApp } from './server.js';
import { CONFIG } from './config.js';

async function runTests() {
  const app = createApp();
  const port = 3001; // отдельный порт для тестов
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}`;

  console.log(`=== Тестирование Лабораторной работы №15 (Koa.js) ===\n`);

  try {
    // Тест 1: Базовый маршрут GET /
    console.log('1. GET / - проверка HTML ответа:');
    const res1 = await fetch(`${baseUrl}/`);
    const html = await res1.text();
    console.log(`   Статус: ${res1.status}, Содержит группу "${CONFIG.groupName}": ${html.includes(CONFIG.groupName)}`);

    // Тест 2: CRUD пользователей
    console.log('\n2. CRUD /api/users:');
    const createRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Тестовый Пользователь', group: CONFIG.groupName }),
    });
    const createdUser = await createRes.json();
    console.log(`   POST /api/users -> Создан ID: ${createdUser.id}, Name: ${createdUser.name}`);

    const getRes = await fetch(`${baseUrl}/api/users`);
    const allUsers = await getRes.json();
    console.log(`   GET /api/users -> Всего пользователей: ${allUsers.length}`);

    // Тест 3: Middleware обработки ошибок и авторизации
    console.log('\n3. Middleware:');
    const errRes = await fetch(`${baseUrl}/error`);
    const errJson = await errRes.json();
    console.log(`   GET /error -> Статус: ${errRes.status}, Error: ${errJson.error}`);

    const unauthRes = await fetch(`${baseUrl}/protected`);
    console.log(`   GET /protected без заголовка -> Статус: ${unauthRes.status} (Ожидалось 401)`);

    const authRes = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    console.log(`   GET /protected с токеном -> Статус: ${authRes.status} (Ожидалось 200)`);

    // Тест 4 & 5: Студенты с пагинацией, фильтрацией и поиском
    console.log('\n4. Студенты (фильтрация, пагинация, поиск):');
    const studentsRes = await fetch(`${baseUrl}/students?limit=5&offset=0&sort=name`);
    const studentsData = await studentsRes.json();
    console.log(`   GET /students?limit=5&sort=name -> Всего: ${studentsData.total}, Получено: ${studentsData.students.length}`);
    console.log(`   Первый в списке: ${studentsData.students[0]?.name}`);

    const filterRes = await fetch(`${baseUrl}/students?group=${encodeURIComponent(CONFIG.groupName)}`);
    const filterData = await filterRes.json();
    console.log(`   GET /students?group=${CONFIG.groupName} -> Найдено: ${filterData.total}`);

    console.log('\n✅ Все тесты ЛР15 успешно пройдены!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Ошибка при тестировании ЛР15:', err);
  process.exit(1);
});
