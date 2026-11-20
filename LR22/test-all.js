import { runConnectDemo } from './mysql-connect.js';
import { runCrudDemo } from './mysql-crud.js';
import { runErrorsDemo } from './mysql-errors.js';
import { runDaoDemo } from './mysql-dao.js';
import { createApp } from './app.js';

async function testAll() {
  console.log('=== Запуск комплексного тестирования ЛР22 (MySQL) ===\n');

  console.log('--- 1. Подключение и пул ---');
  await runConnectDemo();

  console.log('\n--- 2. CRUD-операции ---');
  await runCrudDemo();

  console.log('\n--- 3. Ошибки, стриминг и транзакции ---');
  await runErrorsDemo();

  console.log('\n--- 4. DAO Слой ---');
  await runDaoDemo();

  console.log('\n--- 5. Koa REST API Микросервис ---');
  const app = createApp();
  const server = app.listen(3008);
  try {
    const rStudents = await (await fetch('http://localhost:3008/api/students?limit=2')).json();
    console.log(`GET /api/students -> Получено: ${rStudents.data.length}, Всего: ${rStudents.total}`);

    const rStats = await (await fetch('http://localhost:3008/api/students/stats')).json();
    console.log(`GET /api/students/stats -> Средний балл: ${rStats.averageGrade}`);

    const rMetrics = await (await fetch('http://localhost:3008/api/metrics')).json();
    console.log(`GET /api/metrics -> Группа: ${rMetrics.group}, Запросов: ${rMetrics.queries}`);
  } finally {
    server.close();
  }

  console.log('\n✅ Все задания ЛР22 успешно выполнены!');
}

testAll().catch((err) => {
  console.error('Ошибка в ЛР22:', err);
  process.exit(1);
});
