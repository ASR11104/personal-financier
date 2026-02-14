import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create investment_types table for different types of investments
  await knex.schema.createTable('investment_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 50).notNullable();
    table.string('description', 256).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check('name IN (\'stocks\',\'mutual_funds\',\'bonds\',\'etfs\',\'real_estate\',\'crypto\',\'other\')');
  });

  // Create investments table with SIP support
  await knex.schema.createTable('investments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('investment_type_id').notNullable().references('investment_types.id');
    table.string('name', 200).notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('units', 50).nullable();
    table.decimal('purchase_price', 14, 4).nullable();
    table.date('purchase_date').notNullable();
    table.text('description').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    
    // SIP-related fields
    table.boolean('is_sip').notNullable().defaultTo(false);
    table.decimal('sip_amount', 14, 2).nullable();
    table.string('sip_frequency', 20).nullable(); // 'monthly', 'weekly', 'yearly'
    table.date('sip_start_date').nullable();
    table.date('sip_end_date').nullable();
    table.integer('sip_day_of_month').nullable(); // 1-28 for monthly SIPs
    table.integer('sip_installments_completed').notNullable().defaultTo(0);
    table.integer('sip_total_installments').nullable(); // null for infinite
    
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.check('status IN (\'active\',\'sold\',\'withdrawn\')');
    table.check('amount > 0');
    table.check('is_sip = false OR (is_sip = true AND sip_amount IS NOT NULL)');
    table.check('is_sip = false OR (is_sip = true AND sip_frequency IS NOT NULL)');
  });

  // Create SIP transactions table to track each SIP installment
  await knex.schema.createTable('sip_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('investment_id').notNullable().references('investments.id').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('accounts.id');
    table.uuid('expense_id').nullable().references('expenses.id');
    table.decimal('amount', 14, 2).notNullable();
    table.date('transaction_date').notNullable();
    table.string('status', 20).notNullable().defaultTo('completed'); // 'pending', 'completed', 'failed'
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();

    table.check('status IN (\'pending\',\'completed\',\'failed\')');
    table.check('amount > 0');
  });

  // Add investment_id column to ledger_entries table
  await knex.schema.alterTable('ledger_entries', (table) => {
    table.uuid('investment_id').nullable().references('investments.id');
  });

  // Create indexes for faster queries
  await knex.raw('CREATE INDEX idx_investments_user ON investments(user_id)');
  await knex.raw('CREATE INDEX idx_investments_account ON investments(account_id)');
  await knex.raw('CREATE INDEX idx_investments_status ON investments(status)');
  await knex.raw('CREATE INDEX idx_investments_is_sip ON investments(is_sip)');
  await knex.raw('CREATE INDEX idx_sip_transactions_investment ON sip_transactions(investment_id)');
  await knex.raw('CREATE INDEX idx_sip_transactions_status ON sip_transactions(status)');
  await knex.raw('CREATE INDEX idx_ledger_investment ON ledger_entries(investment_id)');

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

export async function down(knex: Knex): Promise<void> {
  // Drop indexes first
  await knex.raw('DROP INDEX IF EXISTS idx_ledger_investment');
  await knex.raw('DROP INDEX IF EXISTS idx_sip_transactions_status');
  await knex.raw('DROP INDEX IF EXISTS idx_sip_transactions_investment');
  await knex.raw('DROP INDEX IF EXISTS idx_investments_is_sip');
  await knex.raw('DROP INDEX IF EXISTS idx_investments_status');
  await knex.raw('DROP INDEX IF EXISTS idx_investments_account');
  await knex.raw('DROP INDEX IF EXISTS idx_investments_user');

  // Drop tables
  await knex.schema.dropTableIfExists('sip_transactions');
  await knex.schema.dropTableIfExists('investments');
  await knex.schema.dropTableIfExists('investment_types');

  // Remove column from ledger_entries
  await knex.schema.alterTable('ledger_entries', (table) => {
    table.dropColumn('investment_id');
  });
}
