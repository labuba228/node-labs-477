import { runReadableDemo } from './stream-readable.js';
import { runWritableDemo } from './stream-writable.js';
import { runPipeDemo } from './stream-pipe.js';
import { runTransformDemo } from './stream-transform.js';
import { runPipelineDemo } from './stream-pipeline.js';

async function testAll() {
  console.log('=== Запуск тестов Лабораторной работы №21 (Потоки) ===\n');

  console.log('--- 1. Readable-поток ---');
  runReadableDemo();

  console.log('\n--- 2. Writable-поток и Backpressure ---');
  await runWritableDemo();

  console.log('\n--- 3. pipe() и pipeline() ---');
  await runPipeDemo();

  console.log('\n--- 4. Transform-потоки ---');
  await runTransformDemo();

  console.log('\n--- 5. Конвейер с мониторингом ---');
  await runPipelineDemo(10000);

  console.log('\n✅ Все задания ЛР21 успешно выполнены!');
}

testAll().catch((err) => {
  console.error('Ошибка в ЛР21:', err);
  process.exit(1);
});
