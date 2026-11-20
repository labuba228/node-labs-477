import fs from 'node:fs';
import stream from 'node:stream';
import { promisify } from 'node:util';
import { CONFIG } from './config.js';

const pipeline = promisify(stream.pipeline);

/**
 * Задание 3. pipe() и pipeline()
 */
class UppercaseTransform extends stream.Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

class ReverseTransform extends stream.Transform {
  _transform(chunk, encoding, callback) {
    const reversed = chunk.toString().split('').reverse().join('');
    this.push(reversed);
    callback();
  }
}

export async function runPipeDemo() {
  fs.writeFileSync('input.txt', `Node.js Streams - Group ${CONFIG.groupName} - Student ${CONFIG.studentName}\n`);

  // 1. Успешный pipe()
  console.log('=== Демонстрация pipe() ===');
  const readPipe = fs.createReadStream('input.txt');
  const writePipe = fs.createWriteStream('output-pipe.txt');
  readPipe.pipe(writePipe);
  await new Promise((r) => writePipe.on('finish', r));
  console.log('Чтение: input.txt\nЗапись: output-pipe.txt\n✔ Копирование завершено');

  // 2. pipe() с ошибкой
  console.log('\n=== Демонстрация pipe() с ошибкой ===');
  const badReadPipe = fs.createReadStream('missing-file.txt');
  const destPipe = fs.createWriteStream('output-leak.txt');
  badReadPipe.on('error', (err) => {
    console.log(`Чтение: missing-file.txt\n✖ Ошибка: ${err.code}: no such file or directory`);
    console.log('⚠ Внимание: pipe() не закрыл целевой поток!');
    console.log('⚠ Возможна утечка ресурсов.');
    destPipe.destroy(); // закрываем вручную после демонстрации
  });
  badReadPipe.pipe(destPipe);
  await new Promise((r) => setTimeout(r, 50));

  // 3. pipeline() успешный
  console.log('\n=== Демонстрация pipeline() ===');
  await pipeline(fs.createReadStream('input.txt'), fs.createWriteStream('output-pipeline.txt'));
  console.log('Чтение: input.txt\nЗапись: output-pipeline.txt\n✔ Копирование завершено');

  // 4. pipeline() с ошибкой
  console.log('\n=== Демонстрация pipeline() с ошибкой ===');
  try {
    await pipeline(fs.createReadStream('missing-file.txt'), fs.createWriteStream('output-fail.txt'));
  } catch (err) {
    console.log(`Чтение: missing-file.txt\n✖ Ошибка: ${err.code}: no such file or directory`);
    console.log('✔ Все потоки автоматически закрыты\n✔ Утечек нет');
  }

  // 5. Цепочка потоков
  console.log('\n=== Цепочка потоков ===');
  await pipeline(
    fs.createReadStream('input.txt'),
    new UppercaseTransform(),
    new ReverseTransform(),
    fs.createWriteStream('output-chain.txt')
  );
  console.log('input.txt → uppercase → reverse → output-chain.txt\n✔ Обработка завершена');
}

if (process.argv[1]?.endsWith('stream-pipe.js')) {
  runPipeDemo();
}
