import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add user profile fields for ML data collection
  await knex.schema.table('users', (table) => {
    table.date('date_of_birth').nullable();
    table.integer('age').nullable();
    table.string('gender', 20).nullable();
    table.string('marital_status', 30).nullable();
    table.integer('number_of_dependants').nullable().defaultTo(0);
    table.string('country', 100).nullable();
    table.string('state', 100).nullable();
    table.string('district', 100).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.dropColumn('date_of_birth');
    table.dropColumn('age');
    table.dropColumn('gender');
    table.dropColumn('marital_status');
    table.dropColumn('number_of_dependants');
    table.dropColumn('country');
    table.dropColumn('state');
    table.dropColumn('district');
  });
}
