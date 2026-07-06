export const WORKSPACE_COLORS = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#78716C',
];

export const BOARD_COLORS = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#78716C',
];

export const autoAssignColor = (existingCount, palette = WORKSPACE_COLORS) => {
  return palette[existingCount % palette.length];
};
