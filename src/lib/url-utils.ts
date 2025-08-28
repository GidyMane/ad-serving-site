/**
 * Ensures a URL has a protocol (https:// by default)
 * @param url - The URL that might be missing a protocol
 * @param defaultProtocol - The protocol to use if missing (default: 'https://')
 * @returns The URL with proper protocol
 */
export function ensureProtocol(url?: string, defaultProtocol = 'https://'): string {
  if (!url) {
    throw new Error('URL is required');
  }
  
  // If URL already has a protocol, return as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  
  // Add the default protocol
  return `${defaultProtocol}${url}`;
}

/**
 * Creates a full URL from a base URL and path
 * @param baseUrl - The base URL (will ensure it has a protocol)
 * @param path - The path to append
 * @returns The complete URL
 */
export function createUrl(baseUrl: string, path: string): string {
  const normalizedBase = ensureProtocol(baseUrl);
  return new URL(path, normalizedBase).toString();
}
