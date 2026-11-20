# Лабораторные работы по Node.js (ЛР 14 – 24)

- **Студент:** Куксов Александр Денисович
- **Группа:** 477
- **Вариант:** 13

---

## Структура репозитория

| Папка | Тема работы | Задания |
|---|---|---|
| [LR14](./LR14) | Исследование методов работы с файловой системой средствами Node.js | Задания 1–5 (fs.promises, стримы, статистика, бэкап) |
| [LR15](./LR15) | Исследование методов создания простого сервера с использованием фреймворка Koa.js | Задания 1–5 (HTTP, REST API, middleware, поиск, пагинация) |
| [LR16](./LR16) | Исследование методов создания простого сервера с использованием фреймворка Express.js | Задания 1–5 (Express, сжатие, rate limit, JWT, Swagger) |
| [LR17](./LR17) | Исследование методов создания CLI-приложений | Задания 1–5 (Commander, Inquirer, Chalk, Ora, бинарники) |
| [LR18](./LR18) | Исследование методов работы модуля OS | Задания 1–4 (ОС, CPU, RAM, сеть, мониторинг в реальном времени) |
| [LR19](./LR19) | Исследование методов работы модуля Events | Задания 1–5 (EventEmitter, once, DatabaseConnection, плагины, EventBus) |
| [LR20](./LR20) | Исследование методов управления маршрутами с использованием объекта HTTP Request | Задания 1–5 (модуль http, заголовки, чтение тела, статика, ETag, метрики) |
| [LR21](./LR21) | Исследование методов работы с потоками в Node.js | Задания 1–5 (Readable, Writable, backpressure, Transform, ObjectMode, pipeline) |
| [LR22](./LR22) | Исследование методов подключения к серверу MySQL и работы с БД | Задания 1–5 (mysql2, пул, CRUD, DAO, микросервис Koa) |
| [LR23](./LR23) | Исследование методов работы с MongoDB средствами Node.js | Задания 1–5 (MongoClient, CRUD, агрегации, индексы, транзакции, Change Streams) |
| [LR24](./LR24) | Исследование методов создания REST API для работы с пользователями при помощи MongoDB и Koa.js | Задания 1–5 (MVC, Joi валидация, JWT, RBAC, Docker, CI/CD) |

---

## Запуск тестов

### Тестирование всех лабораторных работ сразу:
```bash
node test-all-labs.js
```

### Запуск конкретной лабораторной работы:
- **ЛР 14:** `npm run test:lr14` (или `cd LR14 && node task1.js`)
- **ЛР 15:** `npm run test:lr15` (или `cd LR15 && node test-all.js`)
- **ЛР 16:** `npm run test:lr16` (или `cd LR16 && node test-all.js`)
- **ЛР 17:** `npm run test:lr17` (или `cd LR17 && node test-all.js`)
- **ЛР 18:** `npm run test:lr18` (или `cd LR18 && node test-all.js`)
- **ЛР 19:** `npm run test:lr19` (или `cd LR19 && node test-all.js`)
- **ЛР 20:** `npm run test:lr20` (или `cd LR20 && node test-all.js`)
- **ЛР 21:** `npm run test:lr21` (или `cd LR21 && node test-all.js`)
- **ЛР 22:** `npm run test:lr22` (или `cd LR22 && node test-all.js`)
- **ЛР 23:** `npm run test:lr23` (или `cd LR23 && node test-all.js`)
- **ЛР 24:** `npm run test:lr24` (или `cd LR24 && node test-all.js`)
