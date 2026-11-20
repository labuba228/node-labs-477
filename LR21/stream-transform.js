import { Transform, Readable } from 'node:stream';
import { CONFIG } from './config.js';

/**
 * Задание 4. Transform-потоки и Object Mode
 */
export class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const upper = chunk.toString().toUpperCase();
    this.push(`[${CONFIG.groupName}] ${upper}`);
    callback();
  }
}

export class JsonParserTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          this.push(JSON.parse(line));
        } catch {
          // пропуск некорректных
        }
      }
    }
    callback();
  }
}

export class FilterTransform extends Transform {
  constructor(group = CONFIG.groupName) {
    super({ objectMode: true });
    this.targetGroup = group;
  }

  _transform(obj, encoding, callback) {
    if (obj.group === this.targetGroup) {
      this.push(obj);
    }
    callback();
  }
}

export async function runTransformDemo() {
  console.log('=== Демонстрация Transform-потока ===');
  const t = new UpperCaseTransform();
  t.on('data', (d) => console.log(`Выход: "${d.toString().trim()}"`));
  console.log(`Вход: "группа ${CONFIG.groupName}"`);
  t.write(`группа ${CONFIG.groupName}\n`);
  console.log('Вход: "студент куксов"');
  t.write('студент куксов\n');

  console.log('\n=== Демонстрация Object Mode ===');
  const mockStudents = [
    { id: 1, name: 'Иван', group: CONFIG.groupName },
    { id: 2, name: 'Мария', group: 'ДругаяГруппа' },
    { id: 3, name: 'Петр', group: CONFIG.groupName },
  ];

  for (const s of mockStudents) {
    console.log('[OBJECT]', s);
  }

  console.log(`\nПосле фильтрации (только ${CONFIG.groupName}):`);
  const filter = new FilterTransform(CONFIG.groupName);
  filter.on('data', (obj) => console.log('[OBJECT]', obj));
  for (const s of mockStudents) filter.write(s);

  console.log('\n=== Демонстрация async iterator ===');
  const asyncStream = Readable.from(['Данные 1', 'Данные 2', 'Данные 3']);
  let idx = 1;
  for await (const chunk of asyncStream) {
    console.log(`[ASYNC] Получен чанк ${idx++}: "${chunk}"`);
  }
  console.log('[ASYNC] Поток завершён');
}

if (process.argv[1]?.endsWith('stream-transform.js')) {
  runTransformDemo();
}
