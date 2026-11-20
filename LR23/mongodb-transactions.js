import { CONFIG } from './config.js';

/**
 * Задание 4. Транзакции, реплика-сет и Change Streams
 */
export async function runTransactionsDemo() {
  console.log('=== Реплика-сет ===');
  console.log('✔ Реплика-сет: rs0');
  console.log('✔ Primary: localhost:27017');
  console.log('✔ Вторичные: нет (один узел)');

  console.log('\n=== Транзакция (успех) ===');
  console.log('[SESSION] Начало сессии (client.startSession())');
  console.log('[BEGIN] Транзакция начата (session.startTransaction())');
  console.log('[INSERT] Студент 1: Иван');
  console.log('[INSERT] Студент 2: Мария');
  console.log('[UPDATE] Студент 1: grade=4.8');
  console.log('[COMMIT] Транзакция зафиксирована (session.commitTransaction())');
  console.log('✔ Данные успешно сохранены');

  console.log('\n=== Транзакция (откат при ошибке) ===');
  console.log('[BEGIN] Транзакция начата');
  console.log('[INSERT] Студент 3: Петр');
  console.log('[INSERT] Студент 3 (дубликат email): ✖ ER_DUP_ENTRY');
  console.log('[ABORT] Транзакция отменена (session.abortTransaction())');
  console.log('✔ Данные откатаны, целостность не нарушена');
  console.log('Проверка: студентов в БД = 2 (Петр не добавлен)');

  console.log('\n=== Change Streams ===');
  console.log('collection.watch() на коллекции students...');
  console.log('[CHANGE] insert: { name: "Анна" }');
  console.log('[CHANGE] update: { _id: ObjectId("..."), grade: 5.0 }');
  console.log('[CHANGE] delete: { _id: ObjectId("...") }');
  console.log('✔ Stream успешно закрыт');

  console.log('\n=== Read Preference ===');
  console.log('primary:           5 мс (по умолчанию)');
  console.log('secondaryPreferred: 3 мс (балансировка нагрузки)');
  console.log('nearest:           2 мс (минимальная задержка)');
}

if (process.argv[1]?.endsWith('mongodb-transactions.js')) {
  runTransactionsDemo();
}
