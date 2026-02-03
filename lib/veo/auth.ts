/**
 * Database access key validation
 * Supports multiple keys for different users/teams
 */

/**
 * Validate if provided key is authorized to access D1 database
 */
export function isValidDatabaseKey(userKey: string | null): boolean {
  if (!userKey) return false;

  const validKeys = process.env.DATABASE_ACCESS_KEYS;
  if (!validKeys) return false;

  // Support comma-separated multiple keys
  const keyList = validKeys.split(',').map(k => k.trim());

  return keyList.includes(userKey);
}

/**
 * Extract database key from request headers
 */
export function extractDatabaseKey(headers: Headers): string | null {
  return headers.get('x-database-key');
}
