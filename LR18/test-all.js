import { getOsInfo } from './os-info.js';
import { getResourcesInfo } from './os-resources.js';
import { getNetworkAndUserInfo } from './os-network.js';
import { runMonitor } from './os-monitor.js';

async function testAll() {
  console.log('=== Запуск тестов Лабораторной работы №18 (Модуль OS) ===\n');

  console.log('--- 1. Базовая информация об ОС ---');
  getOsInfo();

  console.log('\n--- 2. Ресурсы процессора и памяти ---');
  getResourcesInfo();

  console.log('\n--- 3. Сеть и пользователь ---');
  getNetworkAndUserInfo();

  console.log('\n--- 4. Мониторинг в реальном времени ---');
  await runMonitor(2, 500);

  console.log('\n✅ Все задания ЛР18 успешно выполнены!');
}

testAll().catch((err) => {
  console.error('Ошибка в тестах ЛР18:', err);
  process.exit(1);
});
