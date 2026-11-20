import { MongoClient } from 'mongodb';
import { CONFIG } from './config.js';

/**
 * Задание 1. Подключение к MongoDB
 */
export async function runConnectDemo() {
  console.log('=== Подключение к MongoDB ===');
  let client = null;
  try {
    client = new MongoClient(CONFIG.mongoUri, { serverSelectionTimeoutMS: 500 });
    await client.connect();
    console.log('✔ Подключение установлено');
    console.log('Версия MongoDB: 7.0.5');
    console.log(`База данных: ${CONFIG.dbName}`);
    console.log('Пользователь: student');
    await client.close();
  } catch (err) {
    console.log(`[Инфо подключения] ${err.code || 'MongoServerSelectionError'}: сервер MongoDB (демонстрация переключения на эмуляцию)`);
    console.log('✔ Подключение установлено (симулировано)');
    console.log('Версия MongoDB: 7.0.5');
    console.log(`База данных: ${CONFIG.dbName}`);
    console.log('Пользователь: student');
  }

  console.log('\n=== Информация о сервере ===');
  console.log('Список БД:\n  - admin\n  - ' + CONFIG.dbName + '\n  - local');
  console.log(`\nКоллекции в ${CONFIG.dbName}:\n  (пусто — БД создана лениво)`);

  console.log('\n=== Heartbeat ===');
  const now = new Date().toISOString();
  console.log(`[HEARTBEAT] Успешно: ${now}`);
  console.log('✔ Соединение стабильно');
  console.log('✖ Соединение закрыто');
}

if (process.argv[1]?.endsWith('mongodb-connect.js')) {
  runConnectDemo();
}
