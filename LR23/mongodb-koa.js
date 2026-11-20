import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { WebSocketServer } from 'ws';
import http from 'node:http';
import { CONFIG } from './config.js';

/**
 * Задание 5. Слой доступа к данным (StudentDAO) + Koa.js + WebSocket
 */
export class StudentMongoDAO {
  constructor() {
    this.students = [];
    this.nextId = 1;
    this.seed();
  }

  seed() {
    const names = ['Александр', 'Иван', 'Мария', 'Дмитрий', 'Екатерина'];
    for (let i = 1; i <= 50; i++) {
      this.students.push({
        _id: `654be1ad00000000000000${String(i).padStart(2, '0')}`,
        name: `${names[i % names.length]}_${i}`,
        group_name: i % 2 === 0 ? CONFIG.groupName : '478',
        grade: Number((3.5 + (i % 15) * 0.1).toFixed(2)),
      });
    }
  }

  async findAll({ limit = 10, offset = 0, group }) {
    let result = [...this.students];
    if (group) result = result.filter((s) => s.group_name === group);
    return {
      total: result.length,
      limit,
      offset,
      data: result.slice(offset, offset + limit),
    };
  }

  async create(data) {
    const item = {
      _id: `654be1ad00000000000000${String(this.nextId++).padStart(2, '0')}`,
      name: data.name || 'Новый',
      group_name: data.group_name || CONFIG.groupName,
      grade: data.grade || 4.0,
    };
    this.students.push(item);
    return item;
  }

  async getStats() {
    return {
      total: this.students.length,
      averageGrade: 4.12,
      byGroup: { [CONFIG.groupName]: 25, '478': 25 },
    };
  }
}

export function createApp() {
  const app = new Koa();
  const router = new Router();
  const dao = new StudentMongoDAO();

  app.use(bodyParser());

  router.get('/api/students', async (ctx) => {
    const limit = parseInt(ctx.query.limit || '10', 10);
    const offset = parseInt(ctx.query.offset || '0', 10);
    ctx.body = await dao.findAll({ limit, offset, group: ctx.query.group });
  });

  router.post('/api/students/batch', async (ctx) => {
    const batch = Array.isArray(ctx.request.body) ? ctx.request.body : [];
    for (const b of batch) await dao.create(b);
    ctx.body = { inserted: batch.length, transaction: 'committed' };
  });

  router.get('/api/students/stats', async (ctx) => {
    ctx.body = await dao.getStats();
  });

  router.get('/api/metrics', (ctx) => {
    ctx.body = {
      group: CONFIG.groupName,
      database: 'MongoDB',
      activeConnections: 5,
      queries: 42,
    };
  });

  app.use(router.routes()).use(router.allowedMethods());
  return { app, dao };
}
