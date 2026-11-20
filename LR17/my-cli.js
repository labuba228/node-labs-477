#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import cliProgress from 'cli-progress';
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.js';

const program = new Command();

program
  .name('my-cli')
  .description(`CLI-приложение для лабораторной работы №17 (Студент: ${CONFIG.studentName}, Группа: ${CONFIG.groupName})`)
  .version(CONFIG.version, '-V, --version', 'вывести номер версии')
  .option('-v, --verbose', 'подробный вывод');

// Задание 1: greet и info
program
  .command('greet <name>')
  .description('поприветствовать пользователя')
  .action((name) => {
    console.log(`Привет, ${name}! Добро пожаловать в CLI-приложение группы ${CONFIG.groupName}.`);
  });

program
  .command('info')
  .description('вывести информацию о группе')
  .action(() => {
    console.log(`Группа: ${CONFIG.groupName}`);
    console.log(`Студент: ${CONFIG.studentName}`);
    console.log(`Лабораторная работа: №17`);
    console.log(`Дата: ${new Date().toISOString().slice(0, 10)}`);
  });

// Задание 2: generate с опциями
program
  .command('generate')
  .description('сгенерировать отчёт')
  .option('-t, --type <type>', 'тип отчёта (html, pdf, json, csv)', 'html')
  .option('-o, --output <path>', 'путь для сохранения', './output.html')
  .option('-f, --force', 'перезаписать существующий файл')
  .option('--dry-run', 'показать что будет сделано без выполнения')
  .action((options) => {
    const validTypes = ['html', 'pdf', 'json', 'csv'];
    if (!validTypes.includes(options.type)) {
      console.error(chalk.red(`Ошибка: недопустимый тип отчёта "${options.type}".`));
      console.error(`Допустимые значения: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    if (options.dryRun) {
      console.log(`[DRY-RUN] Будет сгенерирован отчёт типа: ${options.type}`);
      console.log(`[DRY-RUN] Файл будет сохранён в: ${options.output}`);
      console.log('[DRY-RUN] Действия не выполнены (режим проверки)');
      return;
    }

    if (program.opts().verbose) {
      console.log(chalk.blue(`[VERBOSE] Запуск генерации отчёта...`));
      console.log(chalk.blue(`[VERBOSE] Тип отчёта: ${options.type}`));
      console.log(chalk.blue(`[VERBOSE] Путь сохранения: ${options.output}`));
    }

    fs.writeFileSync(options.output, `Отчет: ${options.type}\nСтудент: ${CONFIG.studentName}\nГруппа: ${CONFIG.groupName}\n`);
    console.log(chalk.green(`Отчёт успешно сгенерирован: ${options.output}`));
  });

// Задание 3 & 5: init с интерактивным и неинтерактивным режимами
program
  .command('init')
  .description('инициализировать проект')
  .option('--name <name>', 'имя проекта')
  .option('--type <type>', 'тип проекта (cli, web, lib)')
  .option('--typescript', 'использовать TypeScript')
  .option('--prettier', 'использовать Prettier')
  .option('--eslint', 'использовать ESLint')
  .option('--git', 'инициализировать Git')
  .option('--no-interactive', 'отключить интерактивный режим')
  .action(async (options) => {
    let { name, type, typescript, prettier, git } = options;

    if (!process.stdin.isTTY || options.interactive === false) {
      if (!name || !type) {
        console.error(chalk.red('Ошибка: в неинтерактивном режиме необходимо указать --name и --type'));
        process.exit(1);
      }
    } else {
      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Введите название проекта:', default: name || 'my-project' },
        { type: 'list', name: 'type', message: 'Выберите тип проекта:', choices: ['Web-приложение', 'CLI-утилита', 'Библиотека'] },
        { type: 'checkbox', name: 'features', message: 'Выберите дополнительные опции:', choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest'] },
        { type: 'confirm', name: 'git', message: 'Использовать Git?', default: true },
      ]);
      name = answers.name;
      type = answers.type;
      git = answers.git;
      typescript = answers.features.includes('TypeScript');
      prettier = answers.features.includes('Prettier');
    }

    console.log(chalk.green(`✓ Проект "${name}" успешно инициализирован!`));
    console.log(`Тип: ${type}`);
    console.log(`Опции: ${[typescript && 'TypeScript', prettier && 'Prettier'].filter(Boolean).join(', ') || 'Стандартные'}`);
    console.log(`Git: ${git ? 'да' : 'нет'}`);
  });

// Задание 4: process (спиннеры, прогресс-бары, Silence is Golden)
program
  .command('process')
  .description('обработка файлов с прогресс-баром и спиннером')
  .option('--files <files...>', 'список файлов для обработки')
  .action(async (options) => {
    const files = options.files || [];
    if (files.length === 0) {
      console.error(chalk.yellow('Предупреждение: список файлов пуст'));
      return;
    }

    const spinner = ora('Поиск файлов...').start();
    await new Promise((r) => setTimeout(r, 100));
    spinner.succeed(chalk.green(`Файлы найдены (${files.length} шт.)`));

    const isTTY = process.stdout.isTTY;
    let bar = null;
    if (isTTY) {
      bar = new cliProgress.SingleBar({
        format: 'Обработка файлов |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} файлов',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      });
      bar.start(files.length, 0);
    }

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await new Promise((r) => setTimeout(r, 30));
      results.push({ file, processed: true, time: Date.now() });
      if (bar) bar.update(i + 1);
    }
    if (bar) bar.stop();

    fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
    console.error(chalk.green('✔ Обработка завершена'));
    console.log('Результат сохранён: output.json');
  });

// Задание 5: команды build, test, deploy
program
  .command('build')
  .description('сборка проекта')
  .option('--dry-run', 'сборка в режиме проверки')
  .action(async (options) => {
    const spinner = ora('Сборка проекта...').start();
    await new Promise((r) => setTimeout(r, 150));
    spinner.succeed(chalk.green('Сборка завершена'));
    if (!options.dryRun) {
      fs.mkdirSync('./dist', { recursive: true });
      fs.writeFileSync('./dist/my-app.js', '// Compiled code\nconsole.log("App ready");\n');
    }
    console.log('Результат: dist/my-app.js');
  });

program
  .command('test')
  .description('запуск юнит- и интеграционных тестов')
  .action(async () => {
    const spinner = ora('Запуск тестов...').start();
    await new Promise((r) => setTimeout(r, 150));
    spinner.succeed(chalk.green('Пройдено: 15/15 тестов'));
    console.log(chalk.cyan('Покрытие: 87%'));
  });

program
  .command('deploy')
  .description('развертывание проекта')
  .option('--env <env>', 'среда развертывания', 'production')
  .option('--force', 'принудительное развертывание без подтверждения')
  .action(async (options) => {
    if (options.env === 'production' && !options.force) {
      console.log(chalk.yellow('⚠ Вы собираетесь развернуть проект в production!'));
    }
    const spinner = ora('Развёртывание...').start();
    await new Promise((r) => setTimeout(r, 200));
    spinner.succeed(chalk.green('Развёрнуто успешно'));
    console.log('URL: https://my-app.example.com');
  });

// Обработка неизвестной команды
program.on('command:*', (operands) => {
  console.error(chalk.red(`Ошибка: неизвестная команда "${operands[0]}"`));
  console.error('Для справки используйте: my-cli --help');
  process.exit(1);
});

export function runCli(args = process.argv) {
  if (args.length <= 2) {
    program.help();
  }
  return program.parse(args);
}

if (process.argv[1]?.endsWith('my-cli.js')) {
  runCli();
}
