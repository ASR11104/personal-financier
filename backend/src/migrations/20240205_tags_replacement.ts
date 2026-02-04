import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop foreign key constraints first by dropping the columns that reference sub_categories
  // This is safer than trying to drop the constraints individually
  await knex.schema.alterTable('expenses', (table) => {
    table.dropForeign(['sub_category_id']);
    table.dropColumn('sub_category_id');
  });

  await knex.schema.alterTable('recurring_expenses', (table) => {
    table.dropForeign(['sub_category_id']);
    table.dropColumn('sub_category_id');
  });

  await knex.schema.alterTable('incomes', (table) => {
    table.dropForeign(['sub_category_id']);
    table.dropColumn('sub_category_id');
  });

  // Now we can safely drop the sub_categories table
  await knex.schema.dropTableIfExists('sub_categories');

  // Create tags table (independent, not under category)
  await knex.schema.createTable('tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('color', 7).nullable().defaultTo('#3B82F6'); // Default blue color
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'name']);
  });

  await knex.raw('CREATE INDEX idx_tags_user ON tags(user_id)');

  // Create expense_tags junction table (many-to-many)
  await knex.schema.createTable('expense_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('expense_id').notNullable().references('expenses.id').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('tags.id').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['expense_id', 'tag_id']);
  });

  await knex.raw('CREATE INDEX idx_expense_tags_expense ON expense_tags(expense_id)');
  await knex.raw('CREATE INDEX idx_expense_tags_tag ON expense_tags(tag_id)');

  // Create income_tags junction table (many-to-many)
  await knex.schema.createTable('income_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('income_id').notNullable().references('incomes.id').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('tags.id').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['income_id', 'tag_id']);
  });

  await knex.raw('CREATE INDEX idx_income_tags_income ON income_tags(income_id)');
  await knex.raw('CREATE INDEX idx_income_tags_tag ON income_tags(tag_id)');

  // Add credit_card_account_id and loan_account_id columns to expenses for direct linking
  await knex.schema.alterTable('expenses', (table) => {
    table.uuid('credit_card_account_id').nullable();
    table.uuid('loan_account_id').nullable();
  });

  await knex.raw('CREATE INDEX idx_expenses_credit_card ON expenses(credit_card_account_id)');
  await knex.raw('CREATE INDEX idx_expenses_loan ON expenses(loan_account_id)');
}

export async function down(knex: Knex): Promise<void> {
  // Drop junction tables first (due to foreign key constraints)
  await knex.schema.dropTableIfExists('income_tags');
  await knex.schema.dropTableIfExists('expense_tags');

  // Drop tags table
  await knex.schema.dropTableIfExists('tags');

  // Remove new columns from expenses
  await knex.schema.alterTable('expenses', (table) => {
    table.dropColumn('credit_card_account_id');
    table.dropColumn('loan_account_id');
  });

  // Re-add sub_category_id columns (we can't restore data since user cleaned it up)
  await knex.schema.alterTable('expenses', (table) => {
    table.uuid('sub_category_id').nullable();
  });

  await knex.schema.alterTable('recurring_expenses', (table) => {
    table.uuid('sub_category_id').nullable();
  });

  await knex.schema.alterTable('incomes', (table) => {
    table.uuid('sub_category_id').nullable();
  });

  // Recreate sub_categories table (empty)
  await knex.schema.createTable('sub_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('category_id').notNullable().references('categories.id').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('description', 256).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE UNIQUE INDEX idx_sub_categories_category_name ON sub_categories (category_id, name)');
}
