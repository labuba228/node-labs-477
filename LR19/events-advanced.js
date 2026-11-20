import { EventEmitter } from 'node:events';
import { CONFIG } from './config.js';

/**
 * Задание 4. Продвинутые концепции (newListener, removeListener, плагины, утечки памяти)
 */
export class PluginManager extends EventEmitter {
  constructor() {
    super();
    this.on('newListener', (event) => {
      console.log(`[newListener] Добавлен слушатель "${event}"`);
    });
    this.on('removeListener', (event) => {
      console.log(`[removeListener] Удалён слушатель "${event}"`);
    });
  }

  registerPlugin(name, fn) {
    console.log(`[PLUGIN] Зарегистрирован: ${name}`);
    this.on(name.toLowerCase(), fn);
    this.emit('plugin:registered', name);
  }

  removePlugin(name, fn) {
    this.removeListener(name.toLowerCase(), fn);
    console.log(`[PLUGIN] Удалён: ${name}`);
    this.emit('plugin:removed', name);
  }
}

export async function runAdvancedEvents() {
  console.log('=== Система плагинов ===');
  const pm = new PluginManager();
  const dummyFn = () => {};

  pm.on('plugin:registered', () => {});
  pm.on('plugin:removed', () => {});

  pm.registerPlugin('LoggerPlugin', dummyFn);
  pm.registerPlugin('AlertPlugin', dummyFn);
  pm.removePlugin('LoggerPlugin', dummyFn);

  console.log('\n=== Демонстрация утечки ===');
  const leakEmitter = new EventEmitter();
  leakEmitter.setMaxListeners(2000); // избегаем предупреждения в консоли во время теста
  for (let i = 0; i < 10; i++) leakEmitter.on('leak', () => {});
  console.log(`Слушателей до: ${leakEmitter.listenerCount('leak')}`);

  for (let i = 0; i < 1000; i++) leakEmitter.on('leak', () => {});
  console.log(`Слушателей после добавления 1000: ${leakEmitter.listenerCount('leak')}`);

  leakEmitter.removeAllListeners('leak');
  console.log(`Слушателей после removeAllListeners: ${leakEmitter.listenerCount('leak')}`);

  console.log('\n=== Асинхронные слушатели ===');
  const asyncEmitter = new EventEmitter();
  asyncEmitter.on('async-task', async () => {
    await new Promise((r) => setTimeout(r, 50));
    console.log(`[${CONFIG.groupName}] async-слушатель завершён через 50ms`);
  });

  console.log(`[${CONFIG.groupName}] emit вызван (не ждёт async-слушатель)`);
  asyncEmitter.emit('async-task');
  await new Promise((r) => setTimeout(r, 70));
}

if (process.argv[1]?.endsWith('events-advanced.js')) {
  runAdvancedEvents();
}
