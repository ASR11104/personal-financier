import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if investments table exists
  const investmentsTableExists = await knex.schema.hasTable('investments');
  
  if (investmentsTableExists) {
    // Add SIP columns if they don't exist
    const hasIsSip = await knex.schema.hasColumn('investments', 'is_sip');
    if (!hasIsSip) {
      await knex.schema.alterTable('investments', (table) => {
        table.boolean('is_sip').notNullable().defaultTo(false);
        table.decimal('sip_amount', 14, 2).nullable();
        table.string('sip_frequency', 20).nullable();
        table.date('sip_start_date').nullable();
        table.date('sip_end_date').nullable();
        table.integer('sip_day_of_month').nullable();
        table.integer('sip_installments_completed').notNullable().defaultTo(0);
        table.integer('sip_total_installments').nullable();
      });
    }

    // Add check constraints if they don't exist
    try {
      await knex.raw(`
        ALTER TABLE investments
        ADD CONSTRAINT check_investments_is_sip_amount
        CHECK (is_sip = false OR (is_sip = true AND sip_amount IS NOT NULL))
      `);
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await knex.raw(`
        ALTER TABLE investments
        ADD CONSTRAINT check_investments_sip_frequency
        CHECK (is_sip = false OR (is_sip = true AND sip_frequency IS NOT NULL))
      `);
    } catch (e) {
      // Constraint might already exist
    }
  }

  // Create sip_transactions table if it doesn't exist
  const sipTransactionsExists = await knex.schema.hasTable('sip_transactions');
  if (!sipTransactionsExists) {
    await knex.schema.createTable('sip_transactions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('investment_id').notNullable().references('investments.id').onDelete('CASCADE');
      table.uuid('account_id').notNullable().references('accounts.id');
      table.uuid('expense_id').nullable().references('expenses.id');
      table.decimal('amount', 14, 2).notNullable();
      table.date('transaction_date').notNullable();
      table.string('status', 20).notNullable().defaultTo('completed');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('processed_at').nullable();

      table.check('status IN (\'pending\',\'completed\',\'failed\')');
      table.check('amount > 0');
    });

    // Create indexes for sip_transactions
    await knex.raw('CREATE INDEX idx_sip_transactions_investment ON sip_transactions(investment_id)');
    await knex.raw('CREATE INDEX idx_sip_transactions_status ON sip_transactions(status)');
  }

  // Check if investment_types table exists
  const investmentTypesExists = await knex.schema.hasTable('investment_types');
  if (!investmentTypesExists) {
    await knex.schema.createTable('investment_types', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 50).notNullable();
      table.string('description', 256).nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.check('name IN (\'stocks\',\'mutual_funds\',\'bonds\',\'etfs\',\'real_estate\',\'crypto\',\'other\')');
    });

    // Insert default investment types
    await knex('investment_types').insert([
      { name: 'stocks', description: 'Individual stocks and shares' },
      { name: 'mutual_funds', description: 'Mutual fund investments' },
      { name: 'bonds', description: 'Government and corporate bonds' },
      { name: 'etfs', description: 'Exchange Traded Funds' },
      { name: 'real_estate', description: 'Real estate investments' },
      { name: 'crypto', description: 'Cryptocurrency investments' },
      { name: 'other', description: 'Other investment types' },
    ]);
  }

  // Check if ledger_entries has investment_id column
  const hasLedgerInvestmentId = await knex.schema.hasColumn('ledger_entries', 'investment_id');
  if (!hasLedgerInvestmentId) {
    await knex.schema.alterTable('ledger_entries', (table) => {
      table.uuid('investment_id').nullable().references('investments.id');
    });
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_ledger_investment ON ledger_entries(investment_id)');
  }

  // Create indexes if they don't exist
  try {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_investments_is_sip ON investments(is_sip)');
  } catch (e) {
    // Index might already exist
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS idx_ledger_investment');
  await knex.raw('DROP INDEX IF EXISTS idx_sip_transactions_status');
  await knex.raw('DROP INDEX IF EXISTS idx_sip_transactions_investment');
  await knex.raw('DROP INDEX IF EXISTS idx_investments_is_sip');

  // Drop tables
  await knex.schema.dropTableIfExists('sip_transactions');
  await knex.schema.dropTableIfExists('investment_types');

  // Remove column from ledger_entries
  const hasLedgerInvestmentId = await knex.schema.hasColumn('ledger_entries', 'investment_id');
  if (hasLedgerInvestmentId) {
    await knex.schema.alterTable('ledger_entries', (table) => {
      table.dropColumn('investment_id');
    });
  }

  // Drop SIP columns from investments
  const columnsToDrop = [
    'sip_total_installments',
    'sip_installments_completed',
    'sip_day_of_month',
    'sip_end_date',
    'sip_start_date',
    'sip_frequency',
    'sip_amount',
    'is_sip',
  ];

  for (const column of columnsToDrop) {
    const hasColumn = await knex.schema.hasColumn('investments', column);
    if (hasColumn) {
      await knex.schema.alterTable('investments', (table) => {
        table.dropColumn(column);
      });
    }
  }
}
