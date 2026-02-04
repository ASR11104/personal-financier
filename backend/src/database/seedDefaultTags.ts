import { db } from './connection';
import { SYSTEM_USER_ID, SYSTEM_USER_EMAIL, SYSTEM_USER_NAME } from '../constants';

const defaultTags: string[] = [
  'rent',
  'subscriptions',
  'recharge',
  'groceries',
  'vegetables',
  'fruits',
  'medicine',
  'medical bill',
  'debt',
  'swiggy',
  'dine in',
  'take out',
  'education',
  'insurance',
  'outings',
  'electricity bill',
  'wifi bill',
  'parent care',
  'spouse care',
  'miscellaneous',
  'train ticket',
  'auto/taxi',
  'metro ticket',
  'bus ticket',
  'flight ticket',
  'cloths',
  'electronics',
  'household gadgets',
  'books',
  'creditcard bill',
  'mutual funds',
  'stocks',
  'bonds',
  'salary',
  'bonds returns'
];

async function ensureSystemUser(): Promise<string> {
  // Check if system user exists
  const existingUser = await db('users').where('id', SYSTEM_USER_ID).first();
  
  if (!existingUser) {
    // Create system user
    await db('users').insert({
      id: SYSTEM_USER_ID,
      email: SYSTEM_USER_EMAIL,
      first_name: SYSTEM_USER_NAME,
      password_hash: 'system', // Dummy hash, this user won't be used for auth
      created_at: new Date(),
    });
    console.log('Created system user for default tags');
  }
  
  return SYSTEM_USER_ID;
}

export async function seedDefaultTags(): Promise<void> {
  try {
    await ensureSystemUser();
    
    for (const tag of defaultTags) {
      // Check if tag already exists for system user
      const existingTag = await db('tags')
        .where('name', tag)
        .where('user_id', SYSTEM_USER_ID)
        .first();

      if (!existingTag) {
        await db('tags').insert({
          name: tag,
          user_id: SYSTEM_USER_ID,
        });
        console.log(`Created tag: ${tag}`);
      }
    }
    console.log('Default tags seeded successfully');
  } catch (error) {
    console.error('Error seeding default tags:', error);
  }
}
