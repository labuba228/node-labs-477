import os from 'node:os';
import { CONFIG } from './config.js';

/**
 * Задание 2. Информация о процессоре и памяти
 */
export function getResourcesInfo() {
  const cpus = os.cpus();
  const totalCores = cpus.length;
  const model = cpus[0]?.model || 'Unknown';
  const avgSpeed = Math.round(cpus.reduce((sum, c) => sum + c.speed, 0) / (totalCores || 1));

  const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
  const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
  const usedMemPercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1);
  const freeMemPercent = (100 - parseFloat(usedMemPercent)).toFixed(1);

  const loadAvg = os.loadavg();

  console.log('=== Информация о процессоре ===');
  console.log(`Количество логических ядер: ${totalCores}`);
  console.log(`Модель процессора:          ${model}`);
  console.log(`Средняя частота:            ${avgSpeed} МГц`);

  console.log('\n=== Информация о памяти ===');
  console.log(`Общий объём:                ${totalMemGB} ГБ`);
  console.log(`Свободно:                   ${freeMemGB} ГБ (${freeMemPercent}%)`);
  console.log(`Использовано:               ${usedMemPercent}%`);

  console.log('\n=== Средняя загрузка системы ===');
  if (os.platform() === 'win32') {
    console.log('Загрузка (1, 5, 15 мин):   [0, 0, 0] (в Windows loadavg недоступен)');
  } else {
    console.log(`Загрузка (1, 5, 15 мин):   ${loadAvg.map((l) => l.toFixed(2)).join(', ')}`);
  }

  console.log(`\nГруппа: ${CONFIG.groupName}`);
  if (parseFloat(freeMemPercent) < 20) {
    console.log('ВНИМАНИЕ: Свободной памяти меньше 20%!');
  } else {
    console.log('Память в норме');
  }
}

if (process.argv[1]?.endsWith('os-resources.js')) {
  getResourcesInfo();
}
