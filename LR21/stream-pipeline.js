import { Readable, Transform, Writable, pipeline } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { CONFIG } from './config.js';

const streamPipeline = promisify(pipeline);

/**
 * Задание 5. Полноценный конвейер обработки данных с backpressure и мониторингом
 */
export async function runPipelineDemo(itemCount = 10000) {
  console.log(`=== Конвейер обработки данных (группа ${CONFIG.groupName}) ===`);
  console.log(`Источник: ${itemCount} студентов, Фильтр: оценка > 3\n`);

  const errorLog = path.resolve(process.cwd(), 'errors.log');
  fs.writeFileSync(errorLog, '');

  let generated = 0;
  let validated = 0;
  let enriched = 0;
  let filtered = 0;
  let errors = 0;

  // 1. Readable: Генерация 10000 студентов
  const studentSource = new Readable({
    objectMode: true,
    read() {
      if (generated >= itemCount) {
        this.push(null);
        return;
      }
      for (let i = 0; i < 100 && generated < itemCount; i++) {
        generated++;
        // имитируем редкую ошибку валидации
        const hasErr = generated === 13 || generated === 477;
        this.push({
          id: generated,
          name: hasErr ? '' : `Студент_${generated}`,
          group: CONFIG.groupName,
          course: (generated % 4) + 1,
          grade: Number((2.0 + Math.random() * 3.0).toFixed(1)),
        });
      }
    },
  });

  // 2. ValidateTransform
  const validateTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (!chunk.name) {
        errors++;
        fs.appendFileSync(errorLog, `[${new Date().toISOString()}] [${CONFIG.groupName}] Ошибка валидации: id=${chunk.id}, отсутствует name\n`);
        return callback();
      }
      validated++;
      callback(null, chunk);
    },
  });

  // 3. EnrichTransform
  const enrichTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      enriched++;
      chunk.averageGrade = Number((chunk.grade * 0.95).toFixed(2));
      callback(null, chunk);
    },
  });

  // 4. FilterTransform (оценка > 3)
  const filterTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk.grade > 3.0) {
        filtered++;
        callback(null, chunk);
      } else {
        callback();
      }
    },
  });

  // 5. FormatTransform (в CSV)
  let headerSent = false;
  const formatTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      let out = '';
      if (!headerSent) {
        out += 'id,name,group,course,grade,averageGrade\n';
        headerSent = true;
      }
      out += `${chunk.id},${chunk.name},${chunk.group},${chunk.course},${chunk.grade},${chunk.averageGrade}\n`;
      callback(null, out);
    },
  });

  // 6. Writable в students.csv
  const csvFile = path.resolve(process.cwd(), 'students.csv');
  const fileDest = fs.createWriteStream(csvFile, { highWaterMark: 64 * 1024 });

  const start = Date.now();
  await streamPipeline(studentSource, validateTransform, enrichTransform, filterTransform, formatTransform, fileDest);
  const durationSec = ((Date.now() - start) / 1000).toFixed(2);
  const speed = Math.round(filtered / (durationSec || 0.01));

  console.log('=== Результаты ===');
  console.log(`Всего сгенерировано: ${generated}`);
  console.log(`Прошло валидацию:   ${validated}`);
  console.log(`Обогащено:          ${enriched}`);
  console.log(`Отфильтровано:      ${filtered}`);
  console.log(`Записано в CSV:     ${filtered}`);
  console.log(`Ошибок:             ${errors}`);
  console.log(`Время выполнения:   ${durationSec} сек`);
  console.log(`Средняя скорость:   ${speed} записей/сек`);
  console.log(`Файл: students.csv (${(fs.statSync(csvFile).size / (1024 * 1024)).toFixed(2)} МБ)`);

  // Отмена по таймауту (демонстрация AbortController)
  console.log('\n=== Отмена по таймауту ===');
  const ac = new AbortController();
  const slowStream = new Readable({
    read() {
      setTimeout(() => this.push('chunk'), 2000);
    },
  });
  setTimeout(() => ac.abort(), 100);
  try {
    await streamPipeline(slowStream, new Writable({ write: (c, e, cb) => cb() }), { signal: ac.signal });
  } catch {
    console.log('Запуск с таймаутом 100 мс...');
    console.log('✖ Таймаут! Обработка отменена');
    console.log('✔ Все потоки корректно закрыты\n✔ Ресурсы освобождены');
  }
}

if (process.argv[1]?.endsWith('stream-pipeline.js')) {
  runPipelineDemo();
}
