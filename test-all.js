import { runConnectDemo } from './mongodb-connect.js';
import { runCrudDemo } from './mongodb-crud.js';
import { runAdvancedDemo } from './mongodb-advanced.js';
import { runTransactionsDemo } from './mongodb-transactions.js';
import { createApp } from './mongodb-koa.js';
import http from 'node:http';

async function testAll() {
  console.log('=== Запуск комплексного тестирования ЛР23 (MongoDB) ===\n');

  console.log('--- 1. Подключение и Heartbeat ---');
  await runConnectDemo();

  console.log('\n--- 2. CRUD-операции ---');
  await runCrudDemo();

  console.log('\n--- 3. Курсоры, агрегации и индексы ---');
  await runAdvancedDemo();

  console.log('\n--- 4. Транзакции и Change Streams ---');
  await runTransactionsDemo();

  console.log('\n--- 5. Koa.js + MongoDB API ---');
  const { app } = createApp();
  const server = http.createServer(app.callback());
  const port = 3011;
  await new Promise((r) => server.listen(port, r));

  try {
    const res = await (await fetch(`http://localhost:${port}/api/students?limit=3`)).json();
    console.log(`GET /api/students -> Получено: ${res.data.length}, Всего: ${res.total}`);

    const stats = await (await fetch(`http://localhost:${port}/api/students/stats`)).json();
    console.log(`GET /api/students/stats -> Всего: ${stats.total}, Средний балл: ${stats.averageGrade}`);
  } finally {
    server.close();
  }

  console.log('\n✅ Все задания ЛР23 успешно выполнены!');
}

testAll().catch((err) => {
  console.error('Ошибка в тестах ЛР23:', err);
  process.exit(1);
});
