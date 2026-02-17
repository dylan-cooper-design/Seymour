/**
 * Typed localStorage helper. Client-side only.
 * Use from components or client-side agent code; do not call during SSR.
 */

import { storageKeys } from "./keys";

function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or other storage errors
  }
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Get a value by key. Returns null if missing or invalid.
 */
export function getStorage<T>(key: keyof typeof storageKeys): T | null {
  return getItem<T>(storageKeys[key as keyof typeof storageKeys]);
}

/**
 * Set a value by key. Only call in the browser.
 */
export function setStorage<T>(
  key: keyof typeof storageKeys,
  value: T
): void {
  setItem(storageKeys[key as keyof typeof storageKeys], value);
}

/**
 * Remove a value by key.
 */
export function removeStorage(key: keyof typeof storageKeys): void {
  removeItem(storageKeys[key as keyof typeof storageKeys]);
}

export { storageKeys };
