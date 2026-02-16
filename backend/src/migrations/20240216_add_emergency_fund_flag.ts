import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('investments', (table) => {
        table.boolean('is_emergency_fund').notNullable().defaultTo(false);
    });

    // Partial index for efficient emergency fund queries
    await knex.raw('CREATE INDEX idx_investments_emergency_fund ON investments(is_emergency_fund) WHERE is_emergency_fund = true');
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('DROP INDEX IF EXISTS idx_investments_emergency_fund');

    await knex.schema.alterTable('investments', (table) => {
        table.dropColumn('is_emergency_fund');
    });
}
