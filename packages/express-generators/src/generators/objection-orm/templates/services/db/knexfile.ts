// Update with your config settings.

import { Config } from 'knex';
import config from '../../config';
import path from 'path';

const SQLITE_CONFIG: Config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../../db/db.sqlite3'),
  },
  useNullAsDefault: true,
};

const POSTGRES_CONFIG: Config = {
  client: 'postgresql',
  connection: config.DB_CONNECTION_STRING,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
};

export const development =
  config.DB_CONNECTION_STRING === 'sqlite' ? SQLITE_CONFIG : POSTGRES_CONFIG;

export const staging = POSTGRES_CONFIG;

export const production = POSTGRES_CONFIG;
