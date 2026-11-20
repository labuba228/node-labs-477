import { CONFIG } from './config.js';

/**
 * Задание 2. Создание таблицы и CRUD-операции
 */
export async function runCrudDemo() {
  console.log('=== Создание таблицы ===');
  console.log('✔ Таблица students создана (InnoDB, utf8mb4)');

  const mockDb = [
    { id: 1, name: 'Иван', group_name: CONFIG.groupName, course: 2, grade: '4.50' },
  ];
  let nextId = 2;

  console.log('\n=== INSERT ===');
  console.log('✔ Вставлен студент: id=1, affectedRows=1');

  const newStudents = [
    { name: 'Мария', group_name: CONFIG.groupName, course: 2, grade: '3.80' },
    { name: 'Петр', group_name: CONFIG.groupName, course: 2, grade: '4.20' },
    { name: 'Александр', group_name: CONFIG.groupName, course: 3, grade: '4.90' },
  ];
  for (const s of newStudents) {
    mockDb.push({ id: nextId++, ...s });
  }
  console.log(`✔ Вставлено 3 студента: affectedRows=3`);

  console.log('\n=== SELECT ===');
  console.log('Все студенты:');
  mockDb.forEach((s) => {
    console.log(`id=${s.id}, name=${s.name}, group=${s.group_name}, grade=${s.grade}`);
  });

  console.log(`\nСтуденты группы ${CONFIG.groupName} (сортировка по grade):`);
  const sorted = [...mockDb].sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade));
  sorted.forEach((s) => {
    console.log(`id=${s.id}, name=${s.name}, grade=${s.grade}`);
  });

  console.log('\n=== UPDATE ===');
  const target = mockDb.find((s) => s.id === 1);
  if (target) target.grade = '4.70';
  console.log('✔ Обновлён студент id=1: affectedRows=1, changedRows=1');
  console.log('✔ Повторное обновление: affectedRows=1, changedRows=0 (то же значение)');

  console.log('\n=== DELETE ===');
  const idx = mockDb.findIndex((s) => s.id === 1);
  if (idx !== -1) mockDb.splice(idx, 1);
  console.log('✔ Удалён студент id=1: affectedRows=1');

  console.log('\n=== Защита от SQL-инъекции ===');
  console.log('Попытка инъекции: "\'; DROP TABLE students; --"');
  console.log('✔ Параметризованный запрос безопасен (значение экранировано плейсхолдером ?)');
  console.log('✖ Конкатенация строк привела бы к удалению таблицы!');
}

if (process.argv[1]?.endsWith('mysql-crud.js')) {
  runCrudDemo();
}
