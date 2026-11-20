import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.js';

/**
 * Задание 4. Мониторинг системы в реальном времени
 */
function getCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

export async function runMonitor(cycles = 3, intervalMs = 1000) {
  console.log(`Мониторинг (группа ${CONFIG.groupName}). Тестовый цикл: ${cycles} замеров.\n`);
  const logPath = path.resolve(process.cwd(), 'monitor.log');
  let warningsCount = 0;

  let prevCpu = getCpuTimes();

  for (let i = 1; i <= cycles; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const currentCpu = getCpuTimes();

    const idleDiff = currentCpu.idle - prevCpu.idle;
    const totalDiff = currentCpu.total - prevCpu.total;
    const cpuUsage = totalDiff > 0 ? (100 - (idleDiff / totalDiff) * 100).toFixed(1) : '0.0';
    prevCpu = currentCpu;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(2);
    const freeMemPercent = (100 - parseFloat(usedMemPercent)).toFixed(1);

    let warnSymbol = '';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (parseFloat(cpuUsage) > 80) {
      warnSymbol = ' ⚠⚠ (КРИТИЧЕСКАЯ ЗАГРУЗКА CPU)';
      warningsCount++;
      fs.appendFileSync(logPath, `[${now}] [${CONFIG.groupName}] Предупреждение: Высокая загрузка CPU (${cpuUsage}%)\n`);
    } else if (parseFloat(cpuUsage) > 50) {
      warnSymbol = ' ⚠';
      warningsCount++;
      fs.appendFileSync(logPath, `[${now}] [${CONFIG.groupName}] Предупреждение: Повышенная загрузка CPU (${cpuUsage}%)\n`);
    }

    if (parseFloat(freeMemPercent) < 10) {
      warnSymbol += ' ⚠ (Мало памяти)';
      warningsCount++;
      fs.appendFileSync(logPath, `[${now}] [${CONFIG.groupName}] Предупреждение: Мало свободной памяти (${freeMemGB} ГБ)\n`);
    }

    console.log(`CPU: ${cpuUsage}% | RAM: ${usedMemPercent}% (${freeMemGB} ГБ свободно)${warnSymbol}`);
  }

  console.log(`\nМониторинг остановлен. Предупреждений зафиксировано: ${warningsCount}`);
  if (fs.existsSync(logPath)) {
    console.log(`Лог сохранён: monitor.log`);
  }
}

if (process.argv[1]?.endsWith('os-monitor.js')) {
  runMonitor(5, 1000);
}
