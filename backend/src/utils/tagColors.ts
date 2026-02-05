/**
 * Tag color configuration
 * Groups similar tags by color for better visual organization
 */

export interface TagColorConfig {
  tag: string;
  color: string;
}

// Color palette - each color represents a tag category
const COLORS = {
  housing: '#ef4444',      // Red - Housing (rent)
  subscriptions: '#f97316',  // Orange - Subscriptions
  utilities: '#eab308',     // Yellow - Bills, electricity, wifi, recharge
  food: '#22c55e',          // Green - Groceries, vegetables, fruits, food delivery
  health: '#06b6d4',        // Cyan - Medical, medicine
  education: '#8b5cf6',     // Purple - Education, books
  insurance: '#ec4899',     // Pink - Insurance
  family: '#f43f5e',        // Rose - Parent care, spouse care
  transport: '#3b82f6',     // Blue - Transportation tickets
  shopping: '#a855f7',     // Purple - Clothes, electronics, gadgets
  debt: '#6366f1',          // Indigo - Credit card, debt
  investments: '#14b8a6',   // Teal - Mutual funds, stocks, bonds
  income: '#10b981',        // Emerald - Salary, returns
  entertainment: '#f59e0b', // Amber - Outings
  misc: '#6b7280',          // Gray - Miscellaneous
};

// Tag category mappings
export const TAG_COLOR_CONFIG: TagColorConfig[] = [
  // Housing
  { tag: 'rent', color: COLORS.housing },

  // Subscriptions
  { tag: 'subscriptions', color: COLORS.subscriptions },
  { tag: 'recharge', color: COLORS.subscriptions },

  // Utilities & Bills
  { tag: 'electricity bill', color: COLORS.utilities },
  { tag: 'wifi bill', color: COLORS.utilities },
  { tag: 'creditcard bill', color: COLORS.debt },
  { tag: 'debt', color: COLORS.debt },

  // Food & Groceries
  { tag: 'groceries', color: COLORS.food },
  { tag: 'vegetables', color: COLORS.food },
  { tag: 'fruits', color: COLORS.food },
  { tag: 'swiggy', color: COLORS.food },
  { tag: 'dine in', color: COLORS.food },
  { tag: 'take out', color: COLORS.food },

  // Health
  { tag: 'medicine', color: COLORS.health },
  { tag: 'medical bill', color: COLORS.health },

  // Education
  { tag: 'education', color: COLORS.education },
  { tag: 'books', color: COLORS.education },

  // Insurance
  { tag: 'insurance', color: COLORS.insurance },

  // Family Care
  { tag: 'parent care', color: COLORS.family },
  { tag: 'spouse care', color: COLORS.family },

  // Transportation
  { tag: 'train ticket', color: COLORS.transport },
  { tag: 'auto/taxi', color: COLORS.transport },
  { tag: 'metro ticket', color: COLORS.transport },
  { tag: 'bus ticket', color: COLORS.transport },
  { tag: 'flight ticket', color: COLORS.transport },

  // Shopping
  { tag: 'cloths', color: COLORS.shopping },
  { tag: 'electronics', color: COLORS.shopping },
  { tag: 'household gadgets', color: COLORS.shopping },

  // Investments
  { tag: 'mutual funds', color: COLORS.investments },
  { tag: 'stocks', color: COLORS.investments },
  { tag: 'bonds', color: COLORS.investments },
  { tag: 'bonds returns', color: COLORS.investments },

  // Income
  { tag: 'salary', color: COLORS.income },

  // Entertainment
  { tag: 'outings', color: COLORS.entertainment },

  // Miscellaneous
  { tag: 'miscellaneous', color: COLORS.misc },
];

/**
 * Get color for a tag by name
 */
export function getTagColor(tagName: string): string | undefined {
  const config = TAG_COLOR_CONFIG.find(
    (c) => c.tag.toLowerCase() === tagName.toLowerCase()
  );
  return config?.color;
}

/**
 * Get all tags with their colors
 */
export function getTagsWithColors(): { name: string; color: string }[] {
  return TAG_COLOR_CONFIG.map((c) => ({ name: c.tag, color: c.color }));
}

/**
 * Group tags by color category
 */
export function groupTagsByColor(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const config of TAG_COLOR_CONFIG) {
    if (!groups[config.color]) {
      groups[config.color] = [];
    }
    groups[config.color].push(config.tag);
  }
  return groups;
}

/**
 * Get color palette for display
 */
export function getColorPalette() {
  return COLORS;
}
