import { EventEmitter } from 'node:events';
import { CONFIG } from './config.js';

/**
 * Задание 1. Базовый EventEmitter
 */
export function runBasicEvents() {
  const emitter = new EventEmitter();

  emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
  });

  emitter.on('info', () => {
    console.log(`[info] Группа: ${CONFIG.groupName}`);
  });

  emitter.on('bye', () => {
    console.log('[bye] До свидания!');
  });

  console.log('=== Демонстрация EventEmitter ===');
  emitter.emit('greet', CONFIG.studentName.split(' ')[1] || 'Александр');
  emitter.emit('info');
  emitter.emit('bye');

  const hasUnknown = emitter.emit('unknown');
  console.log(`Событие "unknown" без слушателей: ${hasUnknown}`);

  const hasGreet = emitter.emit('greet', 'Студент');
  console.log(`Событие "greet" со слушателями: ${hasGreet}`);
}

if (process.argv[1]?.endsWith('events-basic.js')) {
  runBasicEvents();
}
