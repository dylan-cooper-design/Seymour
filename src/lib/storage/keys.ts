/**
 * Typed storage keys with a single app prefix.
 * Add new keys here so they stay consistent and discoverable.
 */

const PREFIX = "seymour:";

export const storageKeys = {
  navModel: `${PREFIX}nav-model`,
  activeNavItemId: `${PREFIX}active-nav-item-id`,
  threadsByNavItemId: `${PREFIX}threads-by-nav-item-id`,
  currentGoal: `${PREFIX}current-goal`,
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];
