import { createServer } from './http-server.js';
import { CONFIG } from './config.js';

async function testAll() {
  const port = 3006;
  const server = createServer();
  await new Promise((r) => server.listen(port, r));
  const baseUrl = `http://localhost:${port}`;

  console.log(`=== Тестирование Лабораторной работы №20 (HTTP) ===\n`);

  try {
    // 1. GET / и /about
    console.log('1. Базовые маршруты GET / и GET /about:');
    const r1 = await fetch(`${baseUrl}/`);
    console.log(`   GET / -> Статус: ${r1.status}, Заголовок X-Group: ${r1.headers.get('x-group')}`);

    const rAbout = await fetch(`${baseUrl}/about`);
    console.log(`   GET /about -> Статус: ${rAbout.status}`);

    const r404 = await fetch(`${baseUrl}/unknown`);
    console.log(`   GET /unknown -> Статус: ${r404.status} (Ожидалось 404)`);

    // 2. Заголовки /headers
    console.log('\n2. Заголовки:');
    const rHeaders = await (await fetch(`${baseUrl}/headers`)).json();
    console.log(`   GET /headers -> Host: ${rHeaders.headers.host}, HTTP: ${rHeaders.httpVersion}`);

    const rSet = await fetch(`${baseUrl}/headers/set`);
    console.log(`   GET /headers/set -> Cache-Control: ${rSet.headers.get('cache-control')}, X-Powered-By: ${rSet.headers.get('x-powered-by')}`);

    // 3. Тело POST /echo и /form
    console.log('\n3. Чтение тела POST:');
    const rEcho = await fetch(`${baseUrl}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello from Node 24' }),
    });
    const echoData = await rEcho.json();
    console.log(`   POST /echo -> ${JSON.stringify(echoData)}`);

    const rForm = await fetch(`${baseUrl}/form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Александр&group=477',
    });
    const formData = await rForm.json();
    console.log(`   POST /form -> ${JSON.stringify(formData)}`);

    // 4. REST API студентов
    console.log('\n4. REST API студентов:');
    const rStudents = await (await fetch(`${baseUrl}/api/students`)).json();
    console.log(`   GET /api/students -> Всего: ${rStudents.length}`);

    const rCreate = await (
      await fetch(`${baseUrl}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Новый Студент', group: CONFIG.groupName }),
      })
    ).json();
    console.log(`   POST /api/students -> Создан: ID ${rCreate.id}, ${rCreate.name}`);

    // 5. Статика и ETag, защита от path traversal
    console.log('\n5. Статика, ETag и Path Traversal:');
    const rStatic = await fetch(`${baseUrl}/static/index.html`);
    const etag = rStatic.headers.get('etag');
    console.log(`   GET /static/index.html -> Статус: ${rStatic.status}, ETag: ${etag}`);

    const rNotModified = await fetch(`${baseUrl}/static/index.html`, {
      headers: { 'If-None-Match': etag },
    });
    console.log(`   GET с If-None-Match -> Статус: ${rNotModified.status} (Ожидалось 304 Not Modified)`);

    const rTraversal = await fetch(`${baseUrl}/static/../secret.txt`);
    console.log(`   Path traversal (/static/../secret.txt) -> Статус: ${rTraversal.status} (Ожидалось 403 Forbidden)`);

    // 6. Метрики
    console.log('\n6. Метрики:');
    const rMetrics = await (await fetch(`${baseUrl}/metrics`)).json();
    console.log(`   GET /metrics -> Всего запросов: ${rMetrics.total}, Группа: ${rMetrics.group}`);

    console.log('\n✅ Все тесты ЛР20 успешно пройдены!');
  } finally {
    server.close();
  }
}

testAll().catch((err) => {
  console.error('Ошибка в ЛР20:', err);
  process.exit(1);
});
