import os from 'node:os';
import { CONFIG } from './config.js';

/**
 * Задание 1. Базовая информация об ОС
 */
export function getOsInfo() {
  const platform = os.platform();
  const uptimeSec = Math.floor(os.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  console.log(`=== Информация о системе (группа ${CONFIG.groupName}) ===`);
  console.log(`Платформа:   ${platform}`);
  console.log(`Тип ОС:      ${os.type()}`);
  console.log(`Архитектура: ${os.arch()}`);
  console.log(`Версия ОС:   ${os.release()}`);
  console.log(`Имя хоста:   ${os.hostname()}`);
  console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек\n`);

  if (platform === 'win32') {
    console.log('Вы работаете в Windows');
  } else if (platform === 'linux') {
    console.log('Вы работаете в Linux');
  } else if (platform === 'darwin') {
    console.log('Вы работаете в macOS');
  } else {
    console.log('Неизвестная платформа');
  }
}

if (process.argv[1]?.endsWith('os-info.js')) {
  getOsInfo();
}
