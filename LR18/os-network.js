import os from 'node:os';
import { CONFIG } from './config.js';

/**
 * Задание 3. Сетевые интерфейсы и информация о пользователе
 */
export function getNetworkAndUserInfo() {
  const nets = os.networkInterfaces();
  console.log('=== Сетевые интерфейсы ===');

  let primaryInterface = null;
  let totalInterfaces = 0;

  for (const [name, netList] of Object.entries(nets)) {
    if (!netList) continue;
    totalInterfaces++;
    for (const net of netList) {
      // Маскирование MAC адреса (AA:BB:CC:**:**:**)
      const rawMac = net.mac || '00:00:00:00:00:00';
      const parts = rawMac.split(':');
      const maskedMac = parts.length === 6 ? `${parts.slice(0, 3).join(':')}:**:**:**` : rawMac;

      if (!primaryInterface && !net.internal && net.family === 'IPv4') {
        primaryInterface = { name, address: net.address };
      }

      console.log(`Интерфейс:   ${name} (${net.family})`);
      console.log(`  IP:        ${net.address}`);
      console.log(`  MAC:       ${maskedMac}`);
      console.log(`  Внутренний: ${net.internal ? 'да' : 'нет'}`);
    }
  }

  console.log(`\nВсего интерфейсов:  ${totalInterfaces}`);
  if (primaryInterface) {
    console.log(`Основной интерфейс: ${primaryInterface.name} (${primaryInterface.address})`);
  }

  console.log('\n=== Информация о пользователе ===');
  try {
    const user = os.userInfo();
    console.log(`Имя пользователя:    ${user.username}`);
    console.log(`UID:                 ${user.uid}`);
    console.log(`Домашняя директория: ${user.homedir}`);
    console.log(`Оболочка:            ${user.shell || 'cmd.exe / powershell'}`);
    console.log(`Группа:              ${CONFIG.groupName}`);
    console.log(`Проверка root:       ${user.uid === 0 ? 'да (root)' : 'нет'}`);
  } catch (err) {
    console.log(`Не удалось получить userInfo: ${err.message}`);
  }
}

if (process.argv[1]?.endsWith('os-network.js')) {
  getNetworkAndUserInfo();
}
