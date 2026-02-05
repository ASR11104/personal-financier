import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Alter the interest_rate column to allow up to 10 decimal places
  await knex.schema.alterTable('account_details', (table) => {
    table.decimal('interest_rate', 15, 10).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert back to original precision
  await knex.schema.alterTable('account_details', (table) => {
    table.decimal('interest_rate', 5, 2).nullable().alter();
  });
}
