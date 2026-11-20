import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.js';

export class UserService {
  static async registerUser(data) {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await UserModel.create({
      ...data,
      passwordHash,
    });

    console.log(`[SERVICE] Создание пользователя: ${user.email}`);
    console.log(`[SERVICE] Email отправлен: ${user.email}`);

    return user;
  }

  static async authenticateUser(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.passwordHash) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    return user;
  }
}
