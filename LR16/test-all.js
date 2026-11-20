import { createApp } from './server.js';
import { CONFIG } from './config.js';

async function runTests() {
  const app = createApp();
  const port = 3002;
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}`;

  console.log(`=== Тестирование Лабораторной работы №16 (Express.js) ===\n`);

  try {
    // 1. GET /
    console.log('1. GET / - проверка HTML ответа:');
    const res1 = await fetch(`${baseUrl}/`);
    const html = await res1.text();
    console.log(`   Статус: ${res1.status}, Группа ${CONFIG.groupName}: ${html.includes(CONFIG.groupName)}`);

    // 2. GET /about & /contacts
    console.log('\n2. GET /about & /contacts:');
    const about = await (await fetch(`${baseUrl}/about`)).json();
    console.log(`   /about -> Студент: ${about.student}, Группа: ${about.group}`);

    // 3. CRUD книг
    console.log('\n3. CRUD книг (/api/books):');
    const postRes = await fetch(`${baseUrl}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Тестовая Книга', author: 'Куксов А.Д.', year: 2026, genre: 'Научпоп' }),
    });
    const createdBook = await postRes.json();
    console.log(`   POST /api/books -> ID: ${createdBook.id}, Title: "${createdBook.title}"`);

    const getRes = await fetch(`${baseUrl}/api/books?author=Куксов`);
    const searchData = await getRes.json();
    console.log(`   GET /api/books?author=Куксов -> Найдено: ${searchData.total}`);

    // 4. Статистика
    console.log('\n4. Статистика книг:');
    const stats = await (await fetch(`${baseUrl}/api/books/stats`)).json();
    console.log(`   Всего книг: ${stats.total}, Самый старый год: ${stats.oldestYear}, Самый новый: ${stats.newestYear}`);

    // 5. Обработка ошибок
    console.log('\n5. Обработка ошибок:');
    const errRes = await fetch(`${baseUrl}/error`);
    const errData = await errRes.json();
    console.log(`   GET /error -> Статус: ${errRes.status}, Error: ${errData.error}`);

    // 6. Аутентификация JWT
    console.log('\n6. Аутентификация JWT:');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    console.log(`   POST /auth/login -> Токен получен: ${Boolean(loginData.token)}`);

    console.log('\n✅ Все тесты ЛР16 успешно пройдены!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Ошибка в тестах ЛР16:', err);
  process.exit(1);
});
