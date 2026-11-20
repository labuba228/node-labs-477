import { EventEmitter } from 'node:events';
import http from 'node:http';
import { CONFIG } from './config.js';

/**
 * Задание 5. Полноценная система событий: EventBus
 */
export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.prioritizedListeners = new Map(); // event -> [{ listener, priority, once }]
    this.wildcardListeners = [];
    this.metrics = {
      events: {},
      total: 0,
      lastCalled: null,
    };
  }

  on(event, listener, priority = 0) {
    if (!this.prioritizedListeners.has(event)) {
      this.prioritizedListeners.set(event, []);
    }
    const list = this.prioritizedListeners.get(event);
    list.push({ listener, priority, once: false });
    list.sort((a, b) => b.priority - a.priority);
    return this;
  }

  once(event, listener, priority = 0) {
    if (!this.prioritizedListeners.has(event)) {
      this.prioritizedListeners.set(event, []);
    }
    const list = this.prioritizedListeners.get(event);
    list.push({ listener, priority, once: true });
    list.sort((a, b) => b.priority - a.priority);
    return this;
  }

  onAny(listener) {
    this.wildcardListeners.push(listener);
    return this;
  }

  off(event, listener) {
    if (this.prioritizedListeners.has(event)) {
      const list = this.prioritizedListeners.get(event).filter((item) => item.listener !== listener);
      this.prioritizedListeners.set(event, list);
    }
    this.wildcardListeners = this.wildcardListeners.filter((l) => l !== listener);
    return this;
  }

  emit(event, ...args) {
    // Метрики
    this.metrics.total++;
    this.metrics.events[event] = (this.metrics.events[event] || 0) + 1;
    this.metrics.lastCalled = new Date().toISOString();

    // Wildcard
    for (const wild of this.wildcardListeners) {
      try {
        wild(event, args);
      } catch (err) {
        this.logError(event, err);
      }
    }

    // Приоритетные слушатели
    if (this.prioritizedListeners.has(event)) {
      const list = [...this.prioritizedListeners.get(event)];
      const remaining = [];
      for (const item of list) {
        try {
          item.listener(...args);
        } catch (err) {
          this.logError(event, err);
        }
        if (!item.once) {
          remaining.push(item);
        }
      }
      this.prioritizedListeners.set(event, remaining);
    }

    return true;
  }

  logError(event, err) {
    console.error(`[ERROR] [${CONFIG.groupName}] Ошибка в слушателе "${event}": ${err.message}`);
  }

  getMetrics() {
    const listenersCount = {};
    for (const [evt, list] of this.prioritizedListeners.entries()) {
      listenersCount[evt] = list.length;
    }
    return {
      group: CONFIG.groupName,
      events: this.metrics.events,
      total: this.metrics.total,
      lastCalled: this.metrics.lastCalled,
      listeners: listenersCount,
    };
  }
}

export function createMetricsServer(eventBus, port = CONFIG.port) {
  const server = http.createServer((req, res) => {
    eventBus.emit('request', req.method, req.url);

    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(eventBus.getMetrics(), null, 2));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return server;
}

export async function runEventBusDemo(port = 3003) {
  console.log(`=== EventBus (группа ${CONFIG.groupName}) ===\n`);
  const bus = new EventBus();

  // Приоритеты
  console.log('--- Приоритеты ---');
  bus.on('action', () => console.log('[priority 0] Низкий приоритет'), 0);
  bus.on('action', () => console.log('[priority 10] Высокий приоритет'), 10);
  bus.on('action', () => console.log('[priority 5] Средний приоритет'), 5);
  bus.emit('action');

  // Wildcard
  console.log('\n--- Wildcard ---');
  bus.onAny((evt, args) => {
    console.log(`[onAny] Событие "${evt}" с аргументами: ${JSON.stringify(args)}`);
  });
  bus.emit('greet', 'Иван');
  bus.emit('info', CONFIG.groupName);

  // Once-кэш
  console.log('\n--- Once-кэш ---');
  let onceCalls = 0;
  bus.once('tick', () => {
    onceCalls++;
  });
  bus.emit('tick');
  bus.emit('tick');
  bus.emit('tick');
  console.log(`[tick] Вызов 1, 2, 3 -> once-слушатель вызван: ${onceCalls} раз`);

  // Ошибки
  console.log('\n--- Обработка ошибок ---');
  bus.on('test-err', () => {
    throw new Error('Имитация сбоя в слушателе');
  });
  bus.emit('test-err');

  // Сервер метрик
  const server = createMetricsServer(bus, port);
  await new Promise((resolve) => server.listen(port, resolve));

  const res = await fetch(`http://localhost:${port}/metrics`);
  const metrics = await res.json();
  console.log('\n--- Метрики из HTTP GET /metrics ---');
  console.log(JSON.stringify(metrics, null, 2));

  server.close();
}

if (process.argv[1]?.endsWith('event-bus.js')) {
  runEventBusDemo();
}
