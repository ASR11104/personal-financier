import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create loan_payment_schedule table to track loan payments with interest/principal split
  await knex.schema.createTable('loan_payment_schedule', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('account_id').notNullable().references('accounts.id').onDelete('CASCADE');
    table.uuid('expense_id').nullable().references('expenses.id').onDelete('SET NULL');
    
    table.decimal('payment_amount', 14, 2).notNullable();
    table.decimal('interest_amount', 14, 2).notNullable().defaultTo(0);
    table.decimal('principal_amount', 14, 2).notNullable().defaultTo(0);
    
    table.date('payment_date').notNullable();
    table.integer('payment_month').notNullable(); // Year-month (e.g., 202401 for Jan 2024)
    
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_loan_payment_schedule_account ON loan_payment_schedule(account_id)');
  await knex.raw('CREATE INDEX idx_loan_payment_schedule_month ON loan_payment_schedule(payment_month)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('loan_payment_schedule');
}
