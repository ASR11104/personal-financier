import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add withdrawal_amount column to track partial withdrawals
  await knex.schema.alterTable('investments', (table) => {
    table.decimal('withdrawal_amount', 14, 2).nullable().defaultTo(0);
  });

  // Update existing withdrawn investments to set withdrawal_amount = amount
  await knex('investments')
    .where('status', 'withdrawn')
    .update({ withdrawal_amount: knex.ref('amount') });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('investments', (table) => {
    table.dropColumn('withdrawal_amount');
  });
}
