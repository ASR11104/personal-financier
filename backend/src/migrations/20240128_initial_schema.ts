import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).nullable();
    table.string('default_currency', 3).notNullable().defaultTo('USD');
    table.string('timezone', 50).notNullable().defaultTo('UTC');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE UNIQUE INDEX users_email_ci ON users (LOWER(email))');

  // Create accounts table
  await knex.schema.createTable('accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('type', 30).notNullable();
    table.string('currency', 3).notNullable();
    table.decimal('balance', 14, 2).notNullable().defaultTo(0);
    table.string('institution_name', 100).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.check('type IN (\'checking\',\'savings\',\'credit_card\',\'cash\',\'investment\',\'loan\')');
  });

  await knex.raw('CREATE INDEX idx_accounts_user ON accounts(user_id)');

  // Create categories table
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().references('users.id').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('type', 20).notNullable();
    table.string('description', 256).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check('type IN (\'income\',\'expense\',\'transfer\')');
  });

  await knex.raw('CREATE UNIQUE INDEX idx_categories_user_name ON categories (user_id, name)');

  // Create sub_categories table
  await knex.schema.createTable('sub_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('category_id').notNullable().references('categories.id').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('description', 256).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE UNIQUE INDEX idx_sub_categories_category_name ON sub_categories (category_id, name)');

  // Create recurring_expenses table
  await knex.schema.createTable('recurring_expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('category_id').notNullable().references('categories.id');
    table.uuid('sub_category_id').nullable().references('sub_categories.id');
    table.decimal('amount', 14, 2).notNullable();
    table.string('frequency', 20).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check('frequency IN (\'daily\',\'weekly\',\'monthly\',\'yearly\')');
    table.check('amount > 0');
  });

  // Create expenses table
  await knex.schema.createTable('expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('category_id').notNullable().references('categories.id');
    table.uuid('sub_category_id').nullable().references('sub_categories.id');
    table.uuid('recurring_expense_id').nullable().references('recurring_expenses.id');
    table.decimal('amount', 14, 2).notNullable();
    table.text('description').nullable();
    table.date('expense_date').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.check('amount > 0');
  });

  await knex.raw('CREATE INDEX idx_expenses_user ON expenses(user_id)');
  await knex.raw('CREATE INDEX idx_expenses_account ON expenses(account_id)');
  await knex.raw('CREATE INDEX idx_expenses_date ON expenses(expense_date)');

  // Create ledger_entries table
  await knex.schema.createTable('ledger_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('expense_id').nullable().references('expenses.id');
    table.decimal('amount', 14, 2).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_ledger_account ON ledger_entries(account_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ledger_entries');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('recurring_expenses');
  await knex.schema.dropTableIfExists('sub_categories');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('users');
}
