import { EventEmitter } from 'node:events';
import { CONFIG } from './config.js';

/**
 * Задание 3. Наследование от EventEmitter (DatabaseConnection)
 */
export class DatabaseConnection extends EventEmitter {
  constructor(groupName = CONFIG.groupName) {
    super();
    this.groupName = groupName;
  }

  connect() {
    console.log('[EVENT] Подключение к БД...');
    setTimeout(() => {
      this.emit('connect');
    }, 50);
  }

  query(sql) {
    console.log(`[EVENT] Выполнение запроса: ${sql}`);
    setTimeout(() => {
      const result = sql.includes('INSERT') ? '1 запись добавлена' : '50 записей';
      this.emit('query', sql, result);
    }, 50);
  }

  close() {
    console.log('[EVENT] Закрытие соединения');
    setTimeout(() => {
      this.emit('close');
    }, 50);
  }

  triggerError(msg) {
    this.emit('error', new Error(msg));
  }
}

export async function runClassEvents() {
  console.log(`=== DatabaseConnection (группа ${CONFIG.groupName}) ===`);
  const db = new DatabaseConnection();

  db.on('connect', () => console.log('[EVENT] Соединение установлено'));
  db.on('query', (sql, res) => console.log(`[EVENT] Результат: ${res}`));
  db.on('close', () => console.log('[EVENT] Соединение закрыто'));
  db.on('error', (err) => console.log(`[EVENT] Ошибка: ${err.message}`));

  db.connect();
  await new Promise((r) => setTimeout(r, 60));

  db.query('SELECT * FROM students');
  await new Promise((r) => setTimeout(r, 60));

  db.query('INSERT INTO students');
  await new Promise((r) => setTimeout(r, 60));

  db.close();
  await new Promise((r) => setTimeout(r, 60));

  console.log('\n=== Демонстрация ошибки ===');
  db.triggerError('Connection timeout');
  console.log('(без слушателя error — процесс упал бы с исключением)');
}

if (process.argv[1]?.endsWith('events-class.js')) {
  runClassEvents();
}
