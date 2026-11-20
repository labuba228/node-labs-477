import { runBasicEvents } from './events-basic.js';
import { runOnceEvents } from './events-once.js';
import { runClassEvents } from './events-class.js';
import { runAdvancedEvents } from './events-advanced.js';
import { runEventBusDemo } from './event-bus.js';

async function testAll() {
  console.log('=== Запуск комплексного тестирования ЛР19 (Events) ===\n');

  console.log('--- 1. Базовый EventEmitter ---');
  runBasicEvents();

  console.log('\n--- 2. On, Once и подписки ---');
  runOnceEvents();

  console.log('\n--- 3. DatabaseConnection (EventEmitter) ---');
  await runClassEvents();

  console.log('\n--- 4. Плагины и утечки ---');
  await runAdvancedEvents();

  console.log('\n--- 5. EventBus и метрики ---');
  await runEventBusDemo(3004);

  console.log('\n✅ Все задания ЛР19 успешно выполнены!');
}

testAll().catch((err) => {
  console.error('Ошибка в ЛР19:', err);
  process.exit(1);
});
