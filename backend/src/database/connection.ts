import knex, { Knex } from 'knex';
import { config } from '../config';

let db: Knex;

try {
  db = knex({
    client: 'pg',
    connection: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    },
    pool: {
      min: 2,
      max: 10,
    },
  });

  db.raw('SELECT 1')
    .then(() => {
      console.log('Database connected successfully');
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });
} catch (error) {
  console.error('Database initialization error:', error);
  process.exit(1);
}

export { db };
export default db;
