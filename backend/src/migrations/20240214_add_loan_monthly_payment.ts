import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add current monthly payment column to account_details
  await knex.schema.alterTable('account_details', (table) => {
    table.decimal('current_monthly_payment', 14, 2).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('account_details', (table) => {
    table.dropColumn('current_monthly_payment');
  });
}
