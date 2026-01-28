/**
 * Image URL Validation Utility
 * Filters out invalid URLs (blob:, file://) and returns a fallback
 */

// Import the default avatar as a local asset
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DEFAULT_AVATAR_LOCAL = require('../assets/default-avatar.jpg');
const DEFAULT_POST_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';

/**
 * Checks if a URL is valid (http/https or data:image)
 */
const isValidUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;

  // Invalid URL patterns
  if (url.startsWith('blob:')) return false;
  if (url.startsWith('file:///')) return false;
  if (url.startsWith('content://')) return false;

  // Valid URL patterns
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('data:image')) return true;

  return false;
};

/**
 * Validates an image URL and returns a fallback if invalid
 * @deprecated Use getAvatarSource() for avatar images instead
 */
export const getValidImageUrl = (url: string | undefined | null, fallback?: string): string => {
  const defaultFallback = fallback || DEFAULT_POST_IMAGE;
  return isValidUrl(url) ? url! : defaultFallback;
};

/**
 * Get valid avatar URL - returns either the valid URL or undefined
 * Used for backward compatibility
 */
export const getAvatarUrl = (url: string | undefined | null): string | undefined => {
  return isValidUrl(url) ? url! : undefined;
};

/**
 * Get the proper Image source for avatars
 * Returns { uri: string } for valid URLs, or the local require() asset for fallback
 * Use this with <Image source={getAvatarSource(url)} />
 */
export const getAvatarSource = (url: string | undefined | null): { uri: string } | number => {
  if (isValidUrl(url)) {
    return { uri: url! };
  }
  return DEFAULT_AVATAR_LOCAL;
};

/**
 * Get valid post image URL with default post image fallback
 */
export const getPostImageUrl = (url: string | undefined | null): string => {
  return isValidUrl(url) ? url! : DEFAULT_POST_IMAGE;
};

const DEFAULT_COVER_LOCAL = require('../assets/monochrome_mountain_forest_header_1769824937927.jpg');

/**
 * Get the proper Image source for cover photos
 */
export const getCoverSource = (url: string | undefined | null): { uri: string } | number => {
  if (isValidUrl(url)) {
    return { uri: url! };
  }
  return DEFAULT_COVER_LOCAL;
};

export default { getValidImageUrl, getAvatarUrl, getAvatarSource, getPostImageUrl, getCoverSource };


