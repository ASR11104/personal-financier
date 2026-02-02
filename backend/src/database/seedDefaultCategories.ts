import { db } from './connection';

interface DefaultCategory {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  subCategories: { name: string; description?: string }[];
}

const defaultCategories: DefaultCategory[] = [
  {
    name: 'Food',
    type: 'expense',
    description: 'Food and dining expenses',
    subCategories: [
      { name: 'Dine In', description: 'Restaurant dining' },
      { name: 'Take Out', description: 'Takeout orders' },
      { name: 'Swiggy', description: 'Swiggy orders' },
    ],
  },
  {
    name: 'Shopping',
    type: 'expense',
    description: 'Shopping expenses',
    subCategories: [
      { name: 'Amazon', description: 'Amazon purchases' },
      { name: 'Online Merchant', description: 'Other online stores' },
      { name: 'Retail Merchant', description: 'In-store purchases' },
      { name: 'Groceries', description: 'Grocery shopping' },
      { name: 'Swiggy Instamart', description: 'Swiggy Instamart orders' },
    ],
  },
  {
    name: 'Bill',
    type: 'expense',
    description: 'Bill payments',
    subCategories: [
      { name: 'Electricity', description: 'Electricity bill' },
      { name: 'Wifi', description: 'Internet/Wifi bill' },
      { name: 'Rent', description: 'Rent payment' },
      { name: 'Term Insurance', description: 'Term insurance premium' },
    ],
  },
  {
    name: 'Credit Card',
    type: 'expense',
    description: 'Credit card payments',
    subCategories: [],
  },
  {
    name: 'Loan',
    type: 'expense',
    description: 'Loan payments',
    subCategories: [],
  },
];

export async function seedDefaultCategories(): Promise<void> {
  try {
    for (const category of defaultCategories) {
      // Check if category already exists (system-wide, user_id is null)
      const existingCategory = await db('categories')
        .where('name', category.name)
        .whereNull('user_id')
        .first();

      if (!existingCategory) {
        // Create the category
        const [newCategory] = await db('categories')
          .insert({
            name: category.name,
            type: category.type,
            description: category.description,
          })
          .returning('*');

        // Create subcategories
        for (const subCat of category.subCategories) {
          await db('sub_categories').insert({
            category_id: newCategory.id,
            name: subCat.name,
            description: subCat.description,
          });
        }

        console.log(`Created category: ${category.name}`);
      } else {
        // Check and add missing subcategories
        for (const subCat of category.subCategories) {
          const existingSubCat = await db('sub_categories')
            .where('category_id', existingCategory.id)
            .where('name', subCat.name)
            .first();

          if (!existingSubCat) {
            await db('sub_categories').insert({
              category_id: existingCategory.id,
              name: subCat.name,
              description: subCat.description,
            });
            console.log(`Created subcategory: ${subCat.name} for ${category.name}`);
          }
        }
      }
    }
    console.log('Default categories seeded successfully');
  } catch (error) {
    console.error('Error seeding default categories:', error);
  }
}
