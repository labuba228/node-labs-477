import fs from 'node:fs/promises';
import path from 'node:path';
import { CONFIG } from './config.js';

/**
 * Задание 3. Поиск и фильтрация файлов
 */
async function scanDirectory(targetDir, statsResult) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      statsResult.totalDirs++;
      await scanDirectory(fullPath, statsResult);
    } else if (entry.isFile()) {
      const fileStat = await fs.stat(fullPath);

      // Варианты 11-15: Анализировать только файлы с расширениями .js, .json, .txt, .md
      const ext = path.extname(entry.name).toLowerCase();
      const allowedExts = ['.js', '.json', '.txt', '.md'];
      if (!allowedExts.includes(ext)) {
        continue;
      }
      statsResult.totalFiles++;
      statsResult.totalSizeBytes += fileStat.size;

      if (!statsResult.extensions[ext]) {
        statsResult.extensions[ext] = { count: 0, bytes: 0 };
      }
      statsResult.extensions[ext].count++;
      statsResult.extensions[ext].bytes += fileStat.size;

      statsResult.filesList.push({
        path: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
        size: fileStat.size,
      });
    }
  }
}

async function main() {
  const inputPath = process.argv[2] || '.';
  const targetDir = path.resolve(process.cwd(), inputPath);

  const stats = {
    totalFiles: 0,
    totalDirs: 0,
    totalSizeBytes: 0,
    extensions: {},
    filesList: [],
  };

  try {
    await scanDirectory(targetDir, stats);

    // Сортировка по размеру
    const sorted = [...stats.filesList].sort((a, b) => b.size - a.size);
    const top5Largest = sorted.slice(0, 5);
    const top5Smallest = [...stats.filesList].sort((a, b) => a.size - b.size).slice(0, 5);

    const formatBytes = (bytes) => {
      const kb = (bytes / 1024).toFixed(2);
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      return `${mb} МБ (${kb} КБ, ${bytes} байт)`;
    };

    console.log(`\n📊 Анализ директории: ${inputPath}`);
    console.log(`📁 Общее количество папок: ${stats.totalDirs}`);
    console.log(`📄 Общее количество файлов: ${stats.totalFiles}`);
    console.log(`💾 Общий размер: ${formatBytes(stats.totalSizeBytes)}`);

    console.log('\n📂 Расширения файлов:');
    for (const [ext, data] of Object.entries(stats.extensions)) {
      const kb = (data.bytes / 1024).toFixed(1);
      console.log(`  ${ext}: ${data.count} файлов (${kb} КБ)`);
    }

    console.log('\n🏆 Топ-5 самых больших файлов:');
    top5Largest.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.path} - ${(f.size / 1024).toFixed(1)} КБ`);
    });

    console.log('\n📉 Топ-5 самых маленьких файлов:');
    top5Smallest.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.path} - ${f.size} байт`);
    });

    // Сохранение в report_N.json
    const reportFileName = `report_${CONFIG.variant}.json`;
    const reportData = {
      variant: CONFIG.variant,
      analyzedPath: inputPath,
      date: new Date().toISOString(),
      summary: {
        totalFiles: stats.totalFiles,
        totalDirs: stats.totalDirs,
        totalSizeBytes: stats.totalSizeBytes,
      },
      extensions: stats.extensions,
      top5Largest,
      top5Smallest,
    };

    await fs.writeFile(
      path.resolve(process.cwd(), reportFileName),
      JSON.stringify(reportData, null, 2),
      'utf-8'
    );
    console.log(`\n📄 Отчет сохранен: ${reportFileName}`);
  } catch (error) {
    console.error('Ошибка в задании 3:', error.message);
    process.exitCode = 1;
  }
}

main();
