import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create incomes table
  await knex.schema.createTable('incomes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('category_id').notNullable().references('categories.id');
    table.uuid('sub_category_id').nullable().references('sub_categories.id');
    table.decimal('amount', 14, 2).notNullable();
    table.text('description').nullable();
    table.date('income_date').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.check('amount > 0');
  });

  await knex.raw('CREATE INDEX idx_incomes_user ON incomes(user_id)');
  await knex.raw('CREATE INDEX idx_incomes_account ON incomes(account_id)');
  await knex.raw('CREATE INDEX idx_incomes_date ON incomes(income_date)');

  // Update ledger_entries table to add income_id reference
  await knex.schema.table('ledger_entries', (table) => {
    table.uuid('income_id').nullable().references('incomes.id');
  });

  await knex.raw('CREATE INDEX idx_ledger_income ON ledger_entries(income_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('ledger_entries', (table) => {
    table.dropColumn('income_id');
  });

  await knex.schema.dropTableIfExists('incomes');
}
