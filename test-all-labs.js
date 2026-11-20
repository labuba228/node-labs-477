import { execSync } from 'node:child_process';

const labs = [
  { name: 'ЛР 14: Работа с файловой системой Node.js', cmd: 'npm run test:lr14' },
  { name: 'ЛР 15: Сервер и REST API на Koa.js', cmd: 'npm run test:lr15' },
  { name: 'ЛР 16: Сервер и REST API на Express.js', cmd: 'npm run test:lr16' },
  { name: 'ЛР 17: Создание CLI-приложений', cmd: 'npm run test:lr17' },
  { name: 'ЛР 18: Работа с модулем OS', cmd: 'npm run test:lr18' },
  { name: 'ЛР 19: Модуль Events и EventBus', cmd: 'npm run test:lr19' },
  { name: 'ЛР 20: Управление маршрутами с HTTP Request', cmd: 'npm run test:lr20' },
  { name: 'ЛР 21: Потоки данных (Streams) в Node.js', cmd: 'npm run test:lr21' },
  { name: 'ЛР 22: MySQL и Node.js', cmd: 'npm run test:lr22' },
  { name: 'ЛР 23: MongoDB и Node.js', cmd: 'npm run test:lr23' },
  { name: 'ЛР 24: REST API пользователей (MongoDB + Koa.js)', cmd: 'npm run test:lr24' },
];

console.log('================================================================');
console.log('   ИТОГОВОЕ ТЕСТИРОВАНИЕ ВСЕХ ЛАБОРАТОРНЫХ РАБОТ (ЛР 14-24)');
console.log('   Студент: Куксов Александр Денисович');
console.log('   Группа:  477 | Вариант: 13');
console.log('================================================================\n');

let passed = 0;
for (const lab of labs) {
  process.stdout.write(`⏳ Запуск ${lab.name}... `);
  try {
    execSync(lab.cmd, { stdio: 'pipe' });
    console.log('✅ ПРОЙДЕНО');
    passed++;
  } catch (err) {
    console.log('❌ ОШИБКА');
    console.error(err.stderr?.toString() || err.message);
  }
}

console.log('\n================================================================');
console.log(`РЕЗУЛЬТАТ: ${passed} из ${labs.length} лабораторных работ успешно пройдены!`);
console.log('================================================================');
if (passed !== labs.length) {
  process.exit(1);
}
