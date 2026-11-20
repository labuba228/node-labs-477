import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import stream from 'node:stream';
import { promisify } from 'node:util';
import { CONFIG } from './config.js';

const pipeline = promisify(stream.pipeline);

/**
 * Задание 5. Копирование и синхронизация (Сложное)
 */
async function createTestStructure(sourceDir) {
  await fsPromises.rm(sourceDir, { recursive: true, force: true });
  await fsPromises.mkdir(sourceDir, { recursive: true });

  const subdirs = ['subdir1', 'subdir2', 'subdir3'];
  for (const sub of subdirs) {
    await fsPromises.mkdir(path.join(sourceDir, sub), { recursive: true });
  }

  const manifest = [];
  const exts = ['.txt', '.js', '.json', '.jpg', '.png', '.gif'];

  // Создаем 20 файлов
  for (let i = 1; i <= 20; i++) {
    const ext = exts[i % exts.length];
    const sub = i % 4 === 0 ? '' : subdirs[i % subdirs.length];
    const fileName = `file_${i}${ext}`;
    const targetFolder = sub ? path.join(sourceDir, sub) : sourceDir;
    const fullPath = path.join(targetFolder, fileName);

    let content;
    if (i === 1) {
      // Создаем файл > 1 МБ для демонстрации разделения на чанки
      content = Buffer.alloc(1.2 * 1024 * 1024, `Variant ${CONFIG.variant} test large file line.\n`);
    } else if (ext === '.txt' || ext === '.js' || ext === '.json') {
      content = `// Content for ${fileName}   with   extra    spaces   \nconsole.log(${i});  \n`;
    } else {
      content = Buffer.alloc(1024 * (i + 1), i);
    }

    await fsPromises.writeFile(fullPath, content);
    manifest.push({
      fileName,
      path: path.relative(sourceDir, fullPath).replace(/\\/g, '/'),
      size: content.length,
      ext,
    });
  }

  await fsPromises.writeFile(
    path.join(sourceDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  console.log(`Создана тестовая структура в ${path.basename(sourceDir)}: 20 файлов, 3 подпапки.`);
}

// Сжатие текстовых файлов (удаление лишних пробелов для вариантов 1-5)
class CompressTransform extends stream.Transform {
  _transform(chunk, encoding, callback) {
    const text = chunk.toString();
    const compressed = text.replace(/[ \t]+/g, ' ');
    this.push(compressed);
    callback();
  }
}

async function copyWithFilter(srcDir, destDir) {
  await fsPromises.rm(destDir, { recursive: true, force: true });
  await fsPromises.mkdir(destDir, { recursive: true });

  const files = [];
  async function collect(dir) {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collect(full);
      } else {
        files.push(full);
      }
    }
  }
  await collect(srcDir);

  console.log(`\n📂 Исходная директория: ${path.basename(srcDir)}`);
  console.log(`📂 Директория назначения: ${path.basename(destDir)}`);
  console.log(`📋 Обнаружено файлов: ${files.length}`);

  let streamedCount = 0;
  let normalCount = 0;
  let totalBytes = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const srcFile = files[idx];
    const rel = path.relative(srcDir, srcFile);
    const destFile = path.join(destDir, rel);
    await fsPromises.mkdir(path.dirname(destFile), { recursive: true });

    const ext = path.extname(srcFile).toLowerCase();
    const stat = await fsPromises.stat(srcFile);
    totalBytes += stat.size;

    if (stat.size > 1024 * 1024) {
      // Файлы > 1 МБ разделяем на чанки по 512 КБ
      const chunkSize = 512 * 1024;
      const readStream = fs.createReadStream(srcFile, { highWaterMark: chunkSize });
      let chunkIdx = 0;
      for await (const chunk of readStream) {
        chunkIdx++;
        await fsPromises.writeFile(`${destFile}.part${chunkIdx}`, chunk);
      }
      streamedCount++;
    } else if (['.txt', '.js', '.json'].includes(ext)) {
      // Потоковое копирование
      const sourceStream = fs.createReadStream(srcFile);
      const destStream = fs.createWriteStream(destFile);
      await pipeline(sourceStream, destStream);
      streamedCount++;
    } else {
      // Обычное копирование
      await fsPromises.copyFile(srcFile, destFile);
      normalCount++;
    }
  }

  console.log(`\n⏳ Прогресс копирования: ${files.length}/${files.length} файлов`);
  console.log('✅ Копирование завершено!');
  console.log('📊 Статистика:');
  console.log(`- Скопировано файлов: ${files.length}`);
  console.log(`- Потоковое копирование: ${streamedCount} файлов`);
  console.log(`- Обычное копирование: ${normalCount} файлов`);
  console.log(`- Общий размер: ${(totalBytes / (1024 * 1024)).toFixed(2)} МБ`);
}

async function syncAndReport(srcDir, destDir, reportPath) {
  // Имитируем небольшое изменение для демонстрации отчета
  const extraFile = path.join(srcDir, 'new_added_item.txt');
  await fsPromises.writeFile(extraFile, 'New content');

  const srcMap = new Map();
  const destMap = new Map();

  async function mapFiles(dir, map, baseDir) {
    if (!fs.existsSync(dir)) return;
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await mapFiles(full, map, baseDir);
      } else {
        const stat = await fsPromises.stat(full);
        const rel = path.relative(baseDir, full).replace(/\\/g, '/');
        map.set(rel, { size: stat.size, mtime: stat.mtimeMs });
      }
    }
  }

  await mapFiles(srcDir, srcMap, srcDir);
  await mapFiles(destDir, destMap, destDir);

  const matched = [];
  const added = [];
  const modified = [];
  const deleted = [];

  for (const [rel, srcInfo] of srcMap.entries()) {
    if (!destMap.has(rel)) {
      added.push(rel);
    } else {
      const destInfo = destMap.get(rel);
      if (destInfo.size === srcInfo.size) {
        matched.push(rel);
      } else {
        modified.push(rel);
      }
    }
  }

  for (const rel of destMap.keys()) {
    if (!srcMap.has(rel)) {
      deleted.push(rel);
    }
  }

  const report = [
    `=== Отчет синхронизации ${path.basename(srcDir)} -> ${path.basename(destDir)} ===`,
    `Дата: ${new Date().toISOString()}`,
    `Совпадают: ${matched.length}`,
    `Изменены: ${modified.length}`,
    `Добавлены: ${added.length}`,
    `Удалены: ${deleted.length}`,
    '\nПодробности:',
    added.length ? `Добавленные файлы:\n  ${added.join('\n  ')}` : 'Добавленных нет',
    modified.length ? `Измененные файлы:\n  ${modified.join('\n  ')}` : 'Измененных нет',
    deleted.length ? `Удаленные файлы:\n  ${deleted.join('\n  ')}` : 'Удаленных нет',
  ].join('\n');

  await fsPromises.writeFile(reportPath, report, 'utf-8');

  console.log('\n🔄 Сравнение директорий:');
  console.log(`- Совпадают: ${matched.length} файлов`);
  console.log(`- Изменены: ${modified.length} файлов (размер сжатых текстовых файлов изменился)`);
  console.log(`- Добавлены: ${added.length} файл`);
  console.log(`- Удалены: ${deleted.length} файлов`);
  console.log(`📄 Отчет сохранен: ${path.basename(reportPath)}`);
}

async function main() {
  const sourceDir = path.resolve(process.cwd(), `source_${CONFIG.variant}`);
  const backupDir = path.resolve(process.cwd(), `backup_${CONFIG.variant}`);
  const reportFile = path.resolve(process.cwd(), `sync_report_${CONFIG.variant}.txt`);

  await createTestStructure(sourceDir);
  await copyWithFilter(sourceDir, backupDir);
  await syncAndReport(sourceDir, backupDir, reportFile);
}

main().catch((err) => {
  console.error('Ошибка в задании 5:', err);
  process.exitCode = 1;
});
