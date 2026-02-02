import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create account_details table for type-specific information
  await knex.schema.createTable('account_details', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('account_id').notNullable().references('accounts.id').onDelete('CASCADE');

    // Credit card specific fields
    table.decimal('credit_limit', 14, 2).nullable();
    table.decimal('available_credit', 14, 2).nullable();

    // Loan specific fields
    table.decimal('loan_amount', 14, 2).nullable();
    table.decimal('loan_balance', 14, 2).nullable();
    table.decimal('interest_rate', 5, 2).nullable(); // Annual interest rate as percentage
    table.integer('loan_term_months').nullable();
    table.date('loan_start_date').nullable();
    table.date('loan_due_date').nullable();

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['account_id']);
  });

  await knex.raw('CREATE INDEX idx_account_details_account ON account_details(account_id)');

  // Populate account_details for existing credit card accounts
  // For existing credit cards, set credit_limit equal to balance (assuming balance is the limit)
  await knex('account_details')
    .insert(
      knex('accounts')
        .select(
          knex.raw('gen_random_uuid() as id'),
          'id as account_id',
          knex.raw('balance as credit_limit'),
          knex.raw('balance as available_credit'),
          knex.raw('NULL::decimal as loan_amount'),
          knex.raw('NULL::decimal as loan_balance'),
          knex.raw('NULL::decimal as interest_rate'),
          knex.raw('NULL::int as loan_term_months'),
          knex.raw('NULL::date as loan_start_date'),
          knex.raw('NULL::date as loan_due_date'),
          knex.raw('now() as created_at'),
          knex.raw('now() as updated_at')
        )
        .where('type', 'credit_card')
    );

  // Populate account_details for existing loan accounts
  // For existing loans, set loan_balance equal to balance
  await knex.raw(`
    INSERT INTO account_details (
      id, account_id, credit_limit, available_credit,
      loan_amount, loan_balance, interest_rate, loan_term_months,
      loan_start_date, loan_due_date, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      id,
      NULL,
      NULL,
      balance,
      balance,
      NULL,
      NULL,
      NULL,
      NULL,
      NOW(),
      NOW()
    FROM accounts
    WHERE type = 'loan'
    ON CONFLICT (account_id) DO NOTHING
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_details');
}
