import path from 'path';

export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: env('DATABASE_URL', {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'elcaldito'),
      user: env('DATABASE_USERNAME', 'elcaldito'),
      password: env('DATABASE_PASSWORD', 'elcaldito'),
      ssl: env.bool('DATABASE_SSL', false),
    }),
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});
