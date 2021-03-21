// Update with your config settings.

import * as fs from 'fs';
import { Config } from 'knex';
import config from '../../config';
import path from 'path';

const DB_FOLDER = path.join(__dirname, '../../../db');

const SQLITE_CONFIG: Config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(DB_FOLDER, 'db.sqlite3'),
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

const isSqlite = config.DB_CONNECTION_STRING === 'sqlite';

if (isSqlite) {
  if (!fs.existsSync(DB_FOLDER)) {
    fs.mkdirSync(DB_FOLDER);
  }
}

export const development = isSqlite ? SQLITE_CONFIG : POSTGRES_CONFIG;

export const staging = POSTGRES_CONFIG;

export const production = POSTGRES_CONFIG;
