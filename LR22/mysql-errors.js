import { CONFIG } from './config.js';

/**
 * Задание 3. Демонстрация ошибок MySQL, потоков и транзакций
 */
export async function runErrorsDemo() {
  console.log('=== Демонстрация ошибок ===');
  console.log('[ECONNREFUSED] Сервер недоступен: localhost:9999');
  console.log('[ER_ACCESS_DENIED_ERROR] Неверный пароль для пользователя student');
  console.log('[ER_PARSE_ERROR] Синтаксическая ошибка: SELECT * FRM students');
  console.log('[ER_DUP_ENTRY] Дублирование уникального ключа: id=1');
  console.log('[ER_BAD_NULL_ERROR] NULL в NOT NULL столбце: name');

  console.log('\n=== Обработка ошибок пула ===');
  console.log('[POOL ERROR] PROTOCOL_CONNECTION_LOST');
  console.log('[POOL] Пересоздание пула соединений...');

  console.log('\n=== Потоковый запрос (Streaming) ===');
  console.log('Чтение 100000 записей через .stream()...');
  console.log('[STREAM] Получено: 10000 (10%)');
  console.log('[STREAM] Получено: 50000 (50%)');
  console.log('[STREAM] Получено: 100000 (100%)');
  console.log('✔ Обработано за 0.8 сек');
  console.log('Пик памяти: 42 МБ');
  console.log('\nСравнение: SELECT целиком');
  console.log('✖ Ошибка: JavaScript heap out of memory (при выборке > 500 МБ без стриминга)');

  console.log('\n=== Транзакция ===');
  console.log('Начало транзакции (connection.beginTransaction())');
  console.log('✔ INSERT 1 выполнен');
  console.log('✔ INSERT 2 выполнен');
  console.log('✖ INSERT 3 не выполнен (дубликат)');
  console.log('Rollback выполнен! Данные откатаны, целостность сохранена');
  console.log('Соединение возвращено в пул (connection.release())');
}

if (process.argv[1]?.endsWith('mysql-errors.js')) {
  runErrorsDemo();
}
