import fs from 'node:fs/promises';
import path from 'node:path';
import { CONFIG } from './config.js';

/**
 * Задание 2. Работа с каталогами
 */
async function printTree(dirPath, prefix = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    console.log(`${prefix}${branch}${entry.name}`);
    if (entry.isDirectory()) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      await printTree(path.join(dirPath, entry.name), childPrefix);
    }
  }
}

async function main() {
  const projectDir = path.resolve(process.cwd(), `project_${CONFIG.variant}`);

  try {
    // Очистка предыдущего запуска, если был
    await fs.rm(projectDir, { recursive: true, force: true });

    // 1. Создание структуры каталогов
    const dirs = [
      path.join(projectDir, 'src', 'modules'),
      path.join(projectDir, 'src', 'components'),
      path.join(projectDir, 'src', 'utils'),
      path.join(projectDir, 'data', 'input'),
      path.join(projectDir, 'data', 'output'),
      path.join(projectDir, 'temp'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Дополнительное условие варианта:
    if (CONFIG.variant % 2 !== 0) {
      // Нечетный вариант: в папке src/components создать 3 вложенные папки от 1 до 3
      for (const num of ['1', '2', '3']) {
        await fs.mkdir(path.join(projectDir, 'src', 'components', num), { recursive: true });
      }
    } else {
      // Четный вариант: README.md с текущей датой в каждой папке
      const today = new Date().toISOString();
      for (const dir of dirs) {
        await fs.writeFile(path.join(dir, 'README.md'), `# Date: ${today}`, 'utf-8');
      }
    }

    // 2. Создание info.txt в каждой созданной папке
    const allDirs = [
      projectDir,
      path.join(projectDir, 'src'),
      ...dirs,
      ...(CONFIG.variant % 2 !== 0
        ? ['1', '2', '3'].map((n) => path.join(projectDir, 'src', 'components', n))
        : []),
    ];

    for (const d of allDirs) {
      const rel = path.relative(projectDir, d) || 'root';
      await fs.writeFile(path.join(d, 'info.txt'), `Назначение каталога: ${rel}\n`, 'utf-8');
    }

    // 3. Вывод полного дерева созданной структуры
    console.log(`\nСтруктура ${path.basename(projectDir)}/:`);
    console.log(path.basename(projectDir) + '/');
    await printTree(projectDir);

    // 4. Перемещение папки temp внутрь data
    const tempSrc = path.join(projectDir, 'temp');
    const tempDest = path.join(projectDir, 'data', 'temp');
    await fs.rename(tempSrc, tempDest);

    // 5. Переименование папки data/output в data/results
    const outputDir = path.join(projectDir, 'data', 'output');
    const resultsDir = path.join(projectDir, 'data', 'results');
    await fs.rename(outputDir, resultsDir);

    // 6. Удаление temp со всем содержимым
    await fs.rm(tempDest, { recursive: true, force: true });

    // 7. Вывод обновленного дерева структуры
    console.log(`\nОбновленная структура ${path.basename(projectDir)}/:`);
    console.log(path.basename(projectDir) + '/');
    await printTree(projectDir);
  } catch (error) {
    console.error('Ошибка в задании 2:', error.message);
    process.exitCode = 1;
  }
}

main();
