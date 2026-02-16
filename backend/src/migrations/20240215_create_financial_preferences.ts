import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('financial_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.integer('expected_retirement_age').defaultTo(60);
    table.decimal('monthly_retirement_expense', 14, 2).nullable();
    table.decimal('expected_annual_return', 5, 2).defaultTo(8.00);
    table.decimal('expected_inflation_rate', 5, 2).defaultTo(6.00);
    table.integer('life_expectancy').defaultTo(80);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('financial_preferences');
}
