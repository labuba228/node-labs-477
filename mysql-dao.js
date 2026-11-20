import { CONFIG } from './config.js';

/**
 * Задание 4. Data Access Object (StudentDAO)
 */
export class StudentDAO {
  constructor() {
    this.students = [];
    this.nextId = 1;
    this.seed();
  }

  seed() {
    const names = ['Иван', 'Мария', 'Петр', 'Александр', 'Елена', 'Дмитрий', 'Ольга'];
    for (let i = 1; i <= 100; i++) {
      this.students.push({
        id: this.nextId++,
        name: names[i % names.length],
        group_name: i % 2 === 0 ? CONFIG.groupName : '478',
        course: (i % 4) + 1,
        grade: Number((3.0 + (i % 20) * 0.1).toFixed(2)),
        created_at: new Date(),
      });
    }
  }

  async create(data) {
    if (!data.name || data.name.length < 2) {
      throw new Error('name слишком короткое (мин. 2 символа)');
    }
    if (!data.group_name) {
      throw new Error('group_name обязательно');
    }
    const student = {
      id: this.nextId++,
      name: data.name,
      group_name: data.group_name,
      course: data.course || 1,
      grade: data.grade ? Number(data.grade) : null,
      created_at: new Date(),
    };
    this.students.push(student);
    return student;
  }

  async findById(id) {
    return this.students.find((s) => s.id === id) || null;
  }

  async findAll(options = {}) {
    let result = [...this.students];
    if (options.group_name) {
      result = result.filter((s) => s.group_name === options.group_name);
    }
    if (options.course) {
      result = result.filter((s) => s.course === options.course);
    }
    if (options.grade_min !== undefined) {
      result = result.filter((s) => s.grade >= options.grade_min);
    }
    if (options.grade_max !== undefined) {
      result = result.filter((s) => s.grade <= options.grade_max);
    }

    const total = result.length;
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    const pages = Math.ceil(total / limit);

    return {
      total,
      page,
      pages,
      data: result.slice(offset, offset + limit),
    };
  }

  async search(query) {
    const q = query.toLowerCase();
    return this.students.filter((s) => s.name.toLowerCase().includes(q));
  }

  async getStats() {
    const total = this.students.length;
    const grades = this.students.map((s) => s.grade).filter(Boolean);
    const avg = (grades.reduce((a, b) => a + b, 0) / (grades.length || 1)).toFixed(2);
    const min = Math.min(...grades).toFixed(2);
    const max = Math.max(...grades).toFixed(2);

    const byGroup = {};
    const byCourse = {};
    for (const s of this.students) {
      byGroup[s.group_name] = (byGroup[s.group_name] || 0) + 1;
      byCourse[`${s.course} курс`] = (byCourse[`${s.course} курс`] || 0) + 1;
    }

    return {
      total,
      averageGrade: avg,
      minGrade: min,
      maxGrade: max,
      byGroup,
      byCourse,
    };
  }
}

export async function runDaoDemo() {
  console.log(`=== StudentDAO (группа ${CONFIG.groupName}) ===\n`);
  const dao = new StudentDAO();

  console.log('--- Создание с валидацией ---');
  try {
    const created = await dao.create({ name: 'Александр', group_name: CONFIG.groupName, course: 3, grade: 4.8 });
    console.log(`✔ Создан: id=${created.id}, name=${created.name}`);
  } catch (err) {
    console.error('Ошибка:', err.message);
  }

  try {
    await dao.create({ name: 'A', group_name: CONFIG.groupName });
  } catch (err) {
    console.log(`✖ Ошибка валидации: ${err.message}`);
  }

  console.log('\n--- Пагинация ---');
  const page1 = await dao.findAll({ limit: 3, offset: 0 });
  console.log(`findAll({ limit: 3, offset: 0 }): Всего: ${page1.total}, Страница: ${page1.page}/${page1.pages}`);
  page1.data.forEach((s) => console.log(`  id=${s.id}, name=${s.name}, group=${s.group_name}, grade=${s.grade}`));

  console.log('\n--- Фильтры ---');
  const filtered = await dao.findAll({ group_name: CONFIG.groupName, course: 2 });
  console.log(`findAll({ group_name: '${CONFIG.groupName}', course: 2 }): Найдено: ${filtered.total} студентов`);

  console.log('\n--- Поиск ---');
  const searchRes = await dao.search('Иван');
  console.log(`search('Иван'): Найдено: ${searchRes.length} студента(ов)`);

  console.log('\n--- Статистика ---');
  const stats = await dao.getStats();
  console.log(`Всего студентов: ${stats.total}`);
  console.log(`Средний балл:    ${stats.averageGrade}`);
  console.log(`Минимальная/макс: ${stats.minGrade} / ${stats.maxGrade}`);
  console.log('По группам:', stats.byGroup);
}

if (process.argv[1]?.endsWith('mysql-dao.js')) {
  runDaoDemo();
}
