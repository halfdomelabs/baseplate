import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  UP_MIGRATION;
}

export async function down(knex: Knex): Promise<void> {
  DOWN_MIGRATION;
}
