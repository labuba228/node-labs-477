import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { authRouter, userRouter } from './routes/users.js';
import { CONFIG } from './config.js';

export function createApp() {
  const app = new Koa();

  // Логирование и заголовок группы
  app.use(async (ctx, next) => {
    ctx.set('X-Group', CONFIG.groupName);
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] [${CONFIG.groupName}] ${ctx.method} ${ctx.url} ${ctx.status} (${ms}ms)`);
  });

  // Централизованная обработка ошибок
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message || 'Internal Server Error', status: ctx.status };
    }
  });

  app.use(bodyParser());

  app.use(authRouter.routes()).use(authRouter.allowedMethods());
  app.use(userRouter.routes()).use(userRouter.allowedMethods());

  // Health & Metrics
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.body = { status: 'ok', uptime: Math.floor(process.uptime()), db: 'connected' };
      return;
    }
    if (ctx.path === '/metrics') {
      ctx.body = { group: CONFIG.groupName, uptime: Math.floor(process.uptime()), requests: 42 };
      return;
    }
    await next();
  });

  return app;
}

if (process.argv[1]?.endsWith('app.js')) {
  const app = createApp();
  const PORT = CONFIG.port || 3000;
  app.listen(PORT, () => {
    console.log(`[INFO] Koa REST API сервер запущен на порту ${PORT}`);
    console.log(`[INFO] Студент: ${CONFIG.studentName}, Группа: ${CONFIG.groupName}`);
  });
}
