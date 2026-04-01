/**
 * Generate a URL-safe slug from a string
 * @param str - The input string to convert to a slug
 * @returns A URL-safe slug in lowercase
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]/g, '') // Remove non-word characters except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading or trailing hyphens
}

/**
 * Truncate a slug to a maximum length
 * @param slug - The slug to truncate
 * @param maxLength - Maximum length of the slug
 * @returns Truncated slug
 */
export function truncateSlug(slug: string, maxLength: number = 128): string {
  if (slug.length <= maxLength) {
    return slug;
  }

  // Remove trailing hyphen if truncation ends with one
  return slug.substring(0, maxLength).replace(/-+$/, '');
}
