import Knex from 'knex';
import { Model } from 'objection';
import * as knexfile from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = knexfile as Record<string, Knex.Config>;

if (!knexConfig[environment]) {
  throw new Error(`Unknown environment for knexfile ${environment}`);
}

// default to development knexfile
const knex = Knex(knexConfig[environment]);

export function getKnex(): Knex {
  return knex;
}

export function initializeObjection(): void {
  Model.knex(knex);
}
