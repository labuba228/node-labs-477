import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { CONFIG } from './config.js';

/**
 * Задание 4. Потоковая обработка данных (Сложное)
 */
async function generateDataFile(filePath, totalLines = 100000) {
  if (fs.existsSync(filePath)) {
    return;
  }
  console.log(`Генерация файла ${path.basename(filePath)} на ${totalLines} строк...`);
  const writeStream = fs.createWriteStream(filePath, { highWaterMark: 64 * 1024 });

  for (let i = 1; i <= totalLines; i++) {
    const randomNum = Math.floor(Math.random() * 1000) + 1;
    const line = `${i}, ${randomNum}, Вариант ${CONFIG.variant}\n`;
    if (!writeStream.write(line)) {
      await new Promise((resolve) => writeStream.once('drain', resolve));
    }
  }
  await new Promise((resolve) => writeStream.end(resolve));
  console.log('Генерация завершена.');
}

async function processDataFile(sourcePath, resultPath) {
  console.log(`\n📊 Обработка файла: ${path.basename(sourcePath)}`);
  const stat = fs.statSync(sourcePath);
  console.log(`Размер файла: ${(stat.size / (1024 * 1024)).toFixed(2)} МБ`);

  const startTime = Date.now();
  const readStream = fs.createReadStream(sourcePath, { highWaterMark: 64 * 1024 });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  let totalLines = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let evens = 0;
  let odds = 0;
  const filteredLines = [];

  // Оценочное количество строк для прогресса
  const estimatedTotal = 100000;
  let lastReportedPercent = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    totalLines++;
    const parts = line.split(',');
    if (parts.length >= 2) {
      const num = parseInt(parts[1].trim(), 10);
      if (!Number.isNaN(num)) {
        sum += num;
        if (num < min) min = num;
        if (num > max) max = num;
        if (num % 2 === 0) evens++;
        else odds++;

        // Варианты 11-15: дополнительно записать только строки с числами > 500
        if (num > 500) {
          filteredLines.push(line);
        }
      }
    }

    const currentPercent = Math.floor((totalLines / estimatedTotal) * 10) * 10;
    if (currentPercent > lastReportedPercent && currentPercent <= 100) {
      console.log(`⏳ Прогресс: ${currentPercent}% (${totalLines.toLocaleString()} строк обработано)`);
      lastReportedPercent = currentPercent;
    }
  }

  // Запись отфильтрованных строк > 500 для вариантов 11-15
  const filteredFile = path.resolve(process.cwd(), `filtered_gt500_${CONFIG.variant}.txt`);
  fs.writeFileSync(filteredFile, filteredLines.join('\n'), 'utf-8');
  console.log(`📄 Дополнительный файл с числами > 500: ${path.basename(filteredFile)} (${filteredLines.length.toLocaleString()} строк)`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avg = totalLines > 0 ? (sum / totalLines).toFixed(2) : 0;

  const resultText = [
    `Результаты обработки файла: ${path.basename(sourcePath)}`,
    `Всего строк: ${totalLines.toLocaleString()}`,
    `Сумма чисел: ${sum.toLocaleString()}`,
    `Среднее значение: ${avg}`,
    `Максимальное число: ${max}`,
    `Минимальное число: ${min}`,
    `Четных чисел: ${evens.toLocaleString()}`,
    `Нечетных чисел: ${odds.toLocaleString()}`,
    `Время выполнения: ${durationSec} сек`,
  ].join('\n');

  fs.writeFileSync(resultPath, resultText, 'utf-8');

  console.log('✅ Обработка завершена!');
  console.log('📊 Результаты:');
  console.log(`- Всего строк: ${totalLines.toLocaleString()}`);
  console.log(`- Сумма чисел: ${sum.toLocaleString()}`);
  console.log(`- Среднее значение: ${avg}`);
  console.log(`- Максимальное число: ${max}`);
  console.log(`- Минимальное число: ${min}`);
  console.log(`- Четных чисел: ${evens.toLocaleString()}`);
  console.log(`- Нечетных чисел: ${odds.toLocaleString()}`);
  console.log(`📄 Результаты сохранены в: ${path.basename(resultPath)}`);
  console.log(`⏱ Время выполнения: ${durationSec} сек`);
}

async function main() {
  const dataFile = path.resolve(process.cwd(), `data_${CONFIG.variant}.txt`);
  const processedFile = path.resolve(process.cwd(), `processed_${CONFIG.variant}.txt`);

  await generateDataFile(dataFile);
  await processDataFile(dataFile, processedFile);
}

main().catch((err) => {
  console.error('Ошибка в задании 4:', err);
  process.exitCode = 1;
});
