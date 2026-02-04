import { db } from './connection';
import { SYSTEM_USER_ID, SYSTEM_USER_EMAIL, SYSTEM_USER_NAME } from '../constants';

interface DefaultCategory {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
}

const defaultCategories: DefaultCategory[] = [
  {
    name: 'Income',
    type: 'income',
    description: 'Salary and other income',
  },
  {
    name: 'Investment',
    type: 'income',
    description: 'Investment income',
  },
  {
    name: 'Life Style',
    type: 'expense',
    description: 'Lifestyle and personal expenses',
  },
  {
    name: 'Travel',
    type: 'expense',
    description: 'Travel-related expenses',
  },
  {
    name: 'Food',
    type: 'expense',
    description: 'Food and dining expenses',
  },
  {
    name: 'Shopping',
    type: 'expense',
    description: 'Shopping expenses',
  },
  {
    name: 'Household',
    type: 'expense',
    description: 'Household expenses',
  },
  {
    name: 'Credit Card',
    type: 'expense',
    description: 'Credit card payments',
  },
  {
    name: 'Loan',
    type: 'expense',
    description: 'Loan payments',
  },
];

export async function seedDefaultCategories(): Promise<void> {
  try {
    // Ensure system user exists
    const existingUser = await db('users').where('id', SYSTEM_USER_ID).first();
    
    if (!existingUser) {
      await db('users').insert({
        id: SYSTEM_USER_ID,
        email: SYSTEM_USER_EMAIL,
        first_name: SYSTEM_USER_NAME,
        password_hash: 'system',
        created_at: new Date(),
      });
      console.log('Created system user for default categories');
    }
    
    for (const category of defaultCategories) {
      // Check if category already exists for system user
      const existingCategory = await db('categories')
        .where('name', category.name)
        .where('user_id', SYSTEM_USER_ID)
        .first();

      if (!existingCategory) {
        // Create the category for system user
        await db('categories').insert({
          name: category.name,
          type: category.type,
          description: category.description,
          user_id: SYSTEM_USER_ID,
        });
        console.log(`Created category: ${category.name}`);
      }
    }
    console.log('Default categories seeded successfully');
  } catch (error) {
    console.error('Error seeding default categories:', error);
  }
}
