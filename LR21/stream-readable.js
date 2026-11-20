import { Readable } from 'node:stream';
import { CONFIG } from './config.js';

/**
 * Задание 1. Базовый Readable-поток
 */
export class StudentReadable extends Readable {
  constructor(options) {
    super(options);
    this.chunks = [
      `Группа: ${CONFIG.groupName}`,
      `Студент: ${CONFIG.studentName}`,
      'Лабораторная работа: №21',
      'Тема: Потоки в Node.js',
    ];
    this.index = 0;
  }

  _read() {
    if (this.index < this.chunks.length) {
      const chunk = this.chunks[this.index++];
      this.push(chunk);
    } else {
      this.push(null); // Конец потока
    }
  }
}

export function runReadableDemo() {
  console.log('=== Демонстрация Readable-потока ===');
  const stream = new StudentReadable();
  let chunkCount = 0;
  let totalBytes = 0;

  stream.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;
    console.log(`[CHUNK ${chunkCount}] ${chunk.toString()}`);
  });

  stream.on('end', () => {
    console.log('[END] Поток завершён');
    console.log(`Всего получено чанков: ${chunkCount}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
  });

  stream.on('error', (err) => {
    console.error('Ошибка потока:', err);
  });
}

if (process.argv[1]?.endsWith('stream-readable.js')) {
  runReadableDemo();
}
