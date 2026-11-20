import { execSync } from 'node:child_process';
import path from 'node:path';

function run(cmd, shouldFail = false) {
  console.log(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    if (out.trim()) console.log(out.trim());
    return { success: true, out };
  } catch (err) {
    if (shouldFail) {
      console.log(`(Завершился с ожидаемой ошибкой код ${err.status}): ${err.stderr?.trim() || err.message}`);
      return { success: false, status: err.status };
    }
    throw err;
  }
}

async function testAll() {
  console.log('=== Тестирование Лабораторной работы №17 (CLI) ===\n');

  // 1. Команды greet и info
  run('node my-cli.js greet "Александр"');
  console.log('');
  run('node my-cli.js info');

  // 2. Ошибка при неизвестной команде
  console.log('');
  run('node my-cli.js unknown-command', true);

  // 3. Подкоманда generate с dry-run и типами
  console.log('');
  run('node my-cli.js generate --type html --dry-run');
  console.log('');
  run('node my-cli.js generate --type unknown', true);

  // 4. Неинтерактивный init
  console.log('');
  run('node my-cli.js init --name test-project --type cli --typescript --git --no-interactive');

  // 5. Build, test, deploy
  console.log('');
  run('node my-cli.js build');
  console.log('');
  run('node my-cli.js test');
  console.log('');
  run('node my-cli.js deploy --env production --force');

  console.log('\n✅ Все тесты ЛР17 успешно пройдены!');
}

testAll().catch((err) => {
  console.error('Ошибка тестов ЛР17:', err);
  process.exit(1);
});
