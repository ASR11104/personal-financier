import { Knex } from 'knex';
import { TAG_COLOR_CONFIG } from '../utils/tagColors';

export async function up(knex: Knex): Promise<void> {
  // Update all system user tags with their corresponding colors
  for (const config of TAG_COLOR_CONFIG) {
    await knex('tags')
      .where('name', config.tag)
      .update({ color: config.color });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Reset all tags to default blue color
  await knex('tags')
    .update({ color: '#3B82F6' });
}
