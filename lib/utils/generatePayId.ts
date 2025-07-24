// lib/utils/generatePayId.ts

/**
 * Generates a unique PayID string.
 * Adjust this implementation to fit your requirements.
 */
export function generatePayId(): string {
  // Example: prefix + random hex
  return 'PAY-' + Math.random().toString(16).slice(2).toUpperCase();
}
