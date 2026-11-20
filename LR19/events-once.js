import { EventEmitter } from 'node:events';
import { CONFIG } from './config.js';

/**
 * Задание 2. Методы on, once, addListener и управление подписками
 */
export function runOnceEvents() {
  const emitter = new EventEmitter();

  let onCount = 0;
  let onceCount = 0;

  emitter.on('tick', (num) => {
    onCount++;
    console.log(`[tick #${num}] on-слушатель`);
  });

  emitter.once('tick', (num) => {
    onceCount++;
    console.log(`[tick #${num}] once-слушатель`);
  });

  console.log('=== Сравнение on и once ===');
  emitter.emit('tick', 1);
  emitter.emit('tick', 2);
  emitter.emit('tick', 3);

  console.log(`on-слушатель вызван: ${onCount} раза`);
  console.log(`once-слушатель вызван: ${onceCount} раз`);

  console.log('\n=== Управление подписками ===');
  const customEmitter = new EventEmitter();
  const listenerA = () => {};
  const listenerB = () => {};
  const listenerC = () => {};

  customEmitter.on('test', listenerA);
  customEmitter.on('test', listenerB);
  customEmitter.on('test', listenerC);

  console.log(`Слушателей до удаления: ${customEmitter.listenerCount('test')}`);
  customEmitter.removeListener('test', listenerA);
  console.log(`Слушателей после удаления одного: ${customEmitter.listenerCount('test')}`);
  customEmitter.removeAllListeners('test');
  console.log(`Слушателей после removeAllListeners: ${customEmitter.listenerCount('test')}`);

  console.log('\n=== Порядок вызова ===');
  const orderEmitter = new EventEmitter();
  orderEmitter.on('event', () => console.log(`1. Первый слушатель (группа ${CONFIG.groupName})`));
  orderEmitter.on('event', () => console.log('2. Второй слушатель'));
  orderEmitter.on('event', () => console.log('3. Третий слушатель'));
  orderEmitter.emit('event');
}

if (process.argv[1]?.endsWith('events-once.js')) {
  runOnceEvents();
}
