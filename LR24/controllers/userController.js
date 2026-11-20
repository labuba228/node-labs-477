import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.js';
import { UserService } from '../services/userService.js';
import { CONFIG } from '../config.js';

const userCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  group_name: Joi.string().required(),
  age: Joi.number().integer().min(16).max(100).optional(),
  course: Joi.number().integer().min(1).max(4).optional(),
  role: Joi.string().valid('user', 'admin').optional(),
});

export class UserController {
  static async getAll(ctx) {
    const { group_name, course, age_min, age_max, search, sort, page, limit } = ctx.query;
    const filter = { group_name, course, age_min, age_max, search };
    const options = {
      sort,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
    };

    if (options.page < 1 || options.limit < 1) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: [{ message: 'page и limit должны быть больше 0' }] };
      return;
    }

    const result = await UserModel.findAll(filter, options);
    ctx.body = result;
  }

  static async getById(ctx) {
    const user = await UserModel.findById(ctx.params.id);
    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found', status: 404 };
      return;
    }
    ctx.body = { data: user };
  }

  static async create(ctx) {
    const { error, value } = userCreateSchema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        details: error.details.map((d) => ({ field: d.path[0], message: d.message })),
      };
      return;
    }

    if (value.password) {
      const user = await UserService.registerUser(value);
      ctx.status = 201;
      ctx.body = { data: user };
    } else {
      const existing = await UserModel.findByEmail(value.email);
      if (existing) {
        ctx.status = 409;
        ctx.body = { error: 'Email already exists', status: 409 };
        return;
      }
      const user = await UserModel.create(value);
      ctx.status = 201;
      ctx.body = { data: user };
    }
  }

  static async update(ctx) {
    const updated = await UserModel.update(ctx.params.id, ctx.request.body);
    if (!updated) {
      ctx.status = 404;
      ctx.body = { error: 'User not found', status: 404 };
      return;
    }
    ctx.body = { data: updated };
  }

  static async delete(ctx) {
    const success = await UserModel.delete(ctx.params.id);
    if (!success) {
      ctx.status = 404;
      ctx.body = { error: 'User not found', status: 404 };
      return;
    }
    ctx.body = { message: 'User deleted successfully', id: ctx.params.id };
  }

  static async search(ctx) {
    const q = ctx.query.q || '';
    const result = await UserModel.findAll({ search: q }, { limit: 20 });
    ctx.body = {
      found: result.total,
      data: result.data.map((u) => ({ ...u, score: 1.5 })),
    };
  }

  static async getStats(ctx) {
    ctx.body = await UserModel.getStats();
  }

  static async exportCsv(ctx) {
    const { data } = await UserModel.findAll({}, { limit: 1000 });
    const header = 'id,name,email,group_name,age,course\n';
    const rows = data.map((u) => `"${u._id}","${u.name}","${u.email}","${u.group_name}",${u.age},${u.course}`).join('\n');
    ctx.set('Content-Type', 'text/csv');
    ctx.set('Content-Disposition', 'attachment; filename="users.csv"');
    ctx.body = header + rows;
  }
}
