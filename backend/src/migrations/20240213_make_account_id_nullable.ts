import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Make account_id nullable in investments table
  await knex.schema.alterTable('investments', (table) => {
    table.uuid('account_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert account_id to not nullable
  await knex.schema.alterTable('investments', (table) => {
    table.uuid('account_id').notNullable().alter();
  });
}
