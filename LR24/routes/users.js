import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import { UserController } from '../controllers/userController.js';
import { UserService } from '../services/userService.js';
import { CONFIG } from '../config.js';

export const authRouter = new Router({ prefix: '/api/auth' });
export const userRouter = new Router({ prefix: '/api' });

// Middleware авторизации JWT
export function authenticate(ctx, next) {
  const auth = ctx.get('Authorization');
  if (!auth) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized', status: 401 };
    return;
  }
  const token = auth.replace('Bearer ', '');
  try {
    ctx.state.user = jwt.verify(token, CONFIG.jwtSecret);
    return next();
  } catch {
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired token', status: 401 };
  }
}

// Middleware проверки ролей
export function requireRole(role) {
  return async (ctx, next) => {
    if (ctx.state.user?.role !== role) {
      ctx.status = 403;
      ctx.body = { error: `Forbidden: ${role} role required`, status: 403 };
      return;
    }
    await next();
  };
}

// Auth маршруты
authRouter.post('/register', async (ctx) => {
  const user = await UserService.registerUser(ctx.request.body);
  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, CONFIG.jwtSecret, { expiresIn: '15m' });
  ctx.status = 201;
  ctx.body = {
    data: { userId: user._id, email: user.email },
    accessToken: token,
    refreshToken: 'mock-refresh-token',
  };
});

authRouter.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body || {};
  try {
    const user = await UserService.authenticateUser(email, password);
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, CONFIG.jwtSecret, { expiresIn: '15m' });
    ctx.body = {
      accessToken: token,
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
    };
  } catch (err) {
    ctx.status = err.status || 401;
    ctx.body = { error: err.message, status: ctx.status };
  }
});

// Users маршруты
userRouter.get('/users/stats', UserController.getStats);
userRouter.get('/users/export', UserController.exportCsv);
userRouter.get('/users/search', UserController.search);
userRouter.get('/users', UserController.getAll);
userRouter.get('/users/:id', UserController.getById);

// Защищенные маршруты
userRouter.post('/users', UserController.create);
userRouter.put('/users/:id', UserController.update);
userRouter.delete('/users/:id', UserController.delete);

// Admin-only маршрут
userRouter.get('/admin/users', authenticate, requireRole('admin'), UserController.getAll);
