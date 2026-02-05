import { db } from './connection';
import { SYSTEM_USER_ID, SYSTEM_USER_EMAIL, SYSTEM_USER_NAME } from '../constants';
import { TAG_COLOR_CONFIG } from '../utils/tagColors';

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
    
    for (const config of TAG_COLOR_CONFIG) {
      // Check if tag already exists for system user
      const existingTag = await db('tags')
        .where('name', config.tag)
        .where('user_id', SYSTEM_USER_ID)
        .first();

      if (!existingTag) {
        await db('tags').insert({
          name: config.tag,
          user_id: SYSTEM_USER_ID,
          color: config.color,
        });
        console.log(`Created tag: ${config.tag} with color ${config.color}`);
      } else {
        // Update existing tag with color if not set
        if (!existingTag.color) {
          await db('tags')
            .where('id', existingTag.id)
            .update({ color: config.color });
          console.log(`Updated tag: ${config.tag} with color ${config.color}`);
        }
      }
    }
    console.log('Default tags seeded/updated successfully');
  } catch (error) {
    console.error('Error seeding default tags:', error);
  }
}
