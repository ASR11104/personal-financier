import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Make amount nullable for SIP investments
  await knex.schema.alterTable('investments', (table) => {
    table.decimal('amount', 14, 2).nullable().alter();
  });

  // Update the check constraint to allow null amount for SIP
  // First drop the old constraint if it exists
  try {
    await knex.raw(`
      ALTER TABLE investments
      DROP CONSTRAINT IF EXISTS check_amount_positive
    `);
  } catch (e) {
    // Constraint might not exist or have different name
  }

  // Add new check constraint that allows null for SIP
  try {
    await knex.raw(`
      ALTER TABLE investments
      ADD CONSTRAINT check_investments_amount
      CHECK (amount IS NULL OR amount > 0)
    `);
  } catch (e) {
    // Constraint might already exist
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert amount to NOT NULL (with default check)
  await knex.schema.alterTable('investments', (table) => {
    table.decimal('amount', 14, 2).notNullable().alter();
  });

  // Drop the new constraint
  try {
    await knex.raw(`
      ALTER TABLE investments
      DROP CONSTRAINT IF EXISTS check_investments_amount
    `);
  } catch (e) {
    // Constraint might not exist
  }

  // Add back the old constraint
  try {
    await knex.raw(`
      ALTER TABLE investments
      ADD CONSTRAINT check_amount_positive
      CHECK (amount > 0)
    `);
  } catch (e) {
    // Constraint might already exist
  }
}
