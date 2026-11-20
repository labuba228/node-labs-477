import { CONFIG } from '../config.js';

let usersDb = [];
let nextId = 1;

// Начальное наполнение тестовыми пользователями
const sampleNames = ['Иван Иванов', 'Мария Петрова', 'Александр Куксов', 'Петр Сидоров', 'Елена Смирнова'];
for (let i = 0; i < 25; i++) {
  const name = sampleNames[i % sampleNames.length] + (i >= sampleNames.length ? ` ${i}` : '');
  usersDb.push({
    _id: `654be1ad00000000000000${String(nextId++).padStart(2, '0')}`,
    name,
    email: `user${i + 1}@example.com`,
    group_name: i % 2 === 0 ? CONFIG.groupName : '478',
    age: 18 + (i % 8),
    course: (i % 4) + 1,
    role: i === 0 ? 'admin' : 'user',
    created_at: new Date(Date.now() - i * 86400000),
  });
}

export class UserModel {
  static async findAll(filter = {}, options = {}) {
    let result = [...usersDb];

    if (filter.group_name) result = result.filter((u) => u.group_name === filter.group_name);
    if (filter.course) result = result.filter((u) => u.course === Number(filter.course));
    if (filter.age_min) result = result.filter((u) => u.age >= Number(filter.age_min));
    if (filter.age_max) result = result.filter((u) => u.age <= Number(filter.age_max));
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (options.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    else if (options.sort === '-name') result.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    else if (options.sort === 'age') result.sort((a, b) => a.age - b.age);
    else if (options.sort === '-age') result.sort((a, b) => b.age - a.age);
    else if (options.sort === '-created_at') result.sort((a, b) => b.created_at - a.created_at);

    const total = result.length;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: result.slice(offset, offset + limit),
    };
  }

  static async findById(id) {
    return usersDb.find((u) => u._id === id || u.id === Number(id)) || null;
  }

  static async findByEmail(email) {
    return usersDb.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async create(data) {
    const user = {
      _id: `654be1ad00000000000000${String(nextId++).padStart(2, '0')}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash || null,
      group_name: data.group_name || CONFIG.groupName,
      age: Number(data.age || 20),
      course: Number(data.course || 1),
      role: data.role || 'user',
      created_at: new Date(),
    };
    usersDb.push(user);
    return user;
  }

  static async update(id, data) {
    const user = await this.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  static async delete(id) {
    const idx = usersDb.findIndex((u) => u._id === id || u.id === Number(id));
    if (idx === -1) return false;
    usersDb.splice(idx, 1);
    return true;
  }

  static async getStats() {
    const total = usersDb.length;
    const avgAge = Number((usersDb.reduce((s, u) => s + u.age, 0) / (total || 1)).toFixed(1));
    const byGroup = {};
    const byCourse = {};
    for (const u of usersDb) {
      byGroup[u.group_name] = (byGroup[u.group_name] || 0) + 1;
      byCourse[u.course] = (byCourse[u.course] || 0) + 1;
    }
    return {
      total,
      averageAge: avgAge,
      byGroup,
      byCourse,
    };
  }
}
