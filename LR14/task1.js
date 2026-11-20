import fs from 'node:fs/promises';
import path from 'node:path';
import { CONFIG } from './config.js';

/**
 * Задание 1. Создание и чтение файлов
 */
async function main() {
  const fileName = `student_${CONFIG.variant}.txt`;
  const filePath = path.resolve(process.cwd(), fileName);

  console.log(`Запуск Задания 1 для варианта ${CONFIG.variant}...`);

  const initialContent = [
    `Студент: ${CONFIG.studentName}`,
    `Группа: ${CONFIG.groupName}`,
    `Вариант: ${CONFIG.variant}`,
    `Дата: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
    `Любимые книги:`,
    `1. "Война и мир" - Л. Толстой`,
    `2. "Преступление и наказание" - Ф. Достоевский`,
    `3. "Мастер и Маргарита" - М. Булгаков`,
    `4. "1984" - Дж. Оруэлл`,
    `5. "Чистый код" - Р. Мартин`,
  ].join('\n');

  try {
    // 1 & 2. Создание файла и запись данных
    await fs.writeFile(filePath, initialContent, 'utf-8');

    // 3. Подсчёт строк и добавление строки с количеством
    const currentData = await fs.readFile(filePath, 'utf-8');
    const lines = currentData.split('\n');
    const totalLinesWithSummary = lines.length + 1;
    await fs.appendFile(filePath, `\nКоличество записей: ${totalLinesWithSummary}`, 'utf-8');

    // 4. Чтение файла и вывод в отформатированном виде
    const finalContent = await fs.readFile(filePath, 'utf-8');
    console.log(`\nСоздан файл: ${fileName}`);
    console.log('Содержимое файла:');
    console.log('─'.repeat(40));
    console.log(finalContent);
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('Ошибка при выполнении задания 1:', error.message);
    process.exitCode = 1;
  }
}

main();
