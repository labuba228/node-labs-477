export const CONFIG = {
  variant: 13,
  studentName: 'Куксов Александр Денисович',
  groupName: '477',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '3306', 10),
  dbUser: process.env.DB_USER || 'student',
  dbPassword: process.env.DB_PASSWORD || 'password',
  dbName: process.env.DB_NAME || 'bbmo_477_13',
  port: 3007,
};
