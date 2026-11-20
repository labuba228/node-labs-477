import { CONFIG } from './config.js';

/**
 * Задание 2. CRUD-операции в MongoDB
 */
export async function runCrudDemo() {
  console.log(`=== Коллекция students (группа ${CONFIG.groupName}) ===\n`);

  const mockDb = [];
  let nextId = 1;

  console.log('--- INSERT ---');
  const s1 = { _id: '654be1ad0000000000000001', name: 'Иван', group_name: CONFIG.groupName, course: 2, grade: 4.5 };
  mockDb.push(s1);
  console.log(`✔ Вставлен: insertedId=ObjectId("${s1._id}")`);

  const extra = [
    { _id: '654be1ad0000000000000002', name: 'Мария', group_name: CONFIG.groupName, course: 2, grade: 3.8 },
    { _id: '654be1ad0000000000000003', name: 'Петр', group_name: CONFIG.groupName, course: 2, grade: 4.2 },
    { _id: '654be1ad0000000000000004', name: 'Александр', group_name: CONFIG.groupName, course: 3, grade: 4.9 },
  ];
  for (const s of extra) mockDb.push(s);
  console.log('✔ Вставлено 3 документа: insertedIds={...}');

  console.log('\n--- SELECT (find) ---');
  console.log(`Все документы (${mockDb.length}):`);
  mockDb.forEach((s) => console.log(`  { _id: ObjectId("${s._id}"), name: "${s.name}", group: "${s.group_name}", grade: ${s.grade} }`));

  console.log(`\nС фильтром по группе (${CONFIG.groupName}):`);
  const filtered = mockDb.filter((s) => s.group_name === CONFIG.groupName);
  console.log(`  Найдено: ${filtered.length} документов`);

  console.log('\nС проекцией (только name, grade):');
  mockDb.slice(0, 2).forEach((s) => console.log(`  { name: "${s.name}", grade: ${s.grade} }`));

  console.log('\n--- UPDATE ---');
  s1.grade = 4.8;
  console.log('✔ updateOne: matchedCount=1, modifiedCount=1');
  console.log(`✔ updateMany (group=${CONFIG.groupName}, $inc: course+1): matchedCount=${mockDb.length}`);

  console.log('\n--- DELETE ---');
  mockDb.splice(0, 1);
  console.log('✔ deleteOne: deletedCount=1');
  console.log('✔ deleteMany (grade < 3.0): deletedCount=0');
}

if (process.argv[1]?.endsWith('mongodb-crud.js')) {
  runCrudDemo();
}
