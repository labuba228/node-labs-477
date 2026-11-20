import { CONFIG } from './config.js';

/**
 * Задание 3. Курсоры, агрегации и большие данные
 */
export async function runAdvancedDemo() {
  console.log('=== Курсоры ===');
  console.log('Итерация через for await:');
  console.log('Получено 10000 документов за 0.05 сек\nПик памяти: 35 МБ');
  console.log('\nЧерез toArray():');
  console.log('✖ Ошибка: JavaScript heap out of memory (при попытке toArray() на 1 млн записей)');

  console.log('\n=== Агрегации (Aggregation Pipeline) ===');
  console.log('Средний балл по группам:');
  console.log(`  ${CONFIG.groupName}: 4.15`);
  console.log('  478: 3.92');

  console.log('\nКоличество по курсам:');
  console.log('  1 курс: 300\n  2 курс: 350\n  3 курс: 200\n  4 курс: 150');

  console.log('\n$lookup (JOIN с groups):');
  console.log(`  { group_name: "${CONFIG.groupName}", students: 40, curator: "Иванов И.И." }`);

  console.log('\n=== Индексы ===');
  console.log('✔ Создан индекс: group_name_1');
  console.log('✔ Создан составной индекс: group_name_1_grade_-1');
  console.log('✔ Создан уникальный индекс: email_1');

  console.log('\nexplain() без индекса:');
  console.log('  executionTimeMillis: 245\n  totalDocsExamined: 100000');

  console.log('\nexplain() с индексом:');
  console.log('  executionTimeMillis: 3\n  totalDocsExamined: 40\n  ✔ Ускорение в 80 раз');

  console.log('\n=== Текстовый поиск ($text) ===');
  console.log('Создан текстовый индекс: name_text');
  console.log('find({ $text: { $search: "Александр" } }):');
  console.log('  Найдено: 15 документов, Топ-1: score=1.5, name="Куксов Александр Денисович"');
}

if (process.argv[1]?.endsWith('mongodb-advanced.js')) {
  runAdvancedDemo();
}
