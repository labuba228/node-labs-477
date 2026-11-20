import { Writable } from 'node:stream';
import { CONFIG } from './config.js';

/**
 * Задание 2. Writable-поток и backpressure
 */
export class SlowWritable extends Writable {
  constructor(options = {}) {
    super({ ...options, highWaterMark: options.highWaterMark || 16 });
    this.writeCount = 0;
  }

  _write(chunk, encoding, callback) {
    this.writeCount++;
    console.log(`[WRITE] ${chunk.toString().trim()}`);
    // Имитация небольшой задержки обработки
    setTimeout(() => {
      callback();
    }, 20);
  }
}

export async function runWritableDemo() {
  console.log('=== Демонстрация Writable-потока ===');
  const writable = new SlowWritable({ highWaterMark: 16 });

  writable.on('finish', () => {
    console.log('[FINISH] Все данные записаны');
    console.log(`Всего записано: ${writable.writeCount} чанка`);
  });

  writable.on('drain', () => {
    console.log('[DRAIN] Буфер освобождён, продолжаем запись');
  });

  const messages = [
    `Группа: ${CONFIG.groupName}`,
    `Студент: ${CONFIG.studentName}`,
    'Лабораторная работа: №21 с длинным текстом для переполнения буфера',
    'Тема: Потоки в Node.js',
  ];

  for (const msg of messages) {
    const canWrite = writable.write(msg + '\n');
    console.log(`write() вернул: ${canWrite}${canWrite ? '' : ' ← буфер переполнен!'}`);
    if (!canWrite) {
      await new Promise((resolve) => writable.once('drain', resolve));
    }
  }

  writable.end();
}

if (process.argv[1]?.endsWith('stream-writable.js')) {
  runWritableDemo();
}
