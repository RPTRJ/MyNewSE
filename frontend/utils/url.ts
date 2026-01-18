/**
 * Utility functions for handling file URLs
 * Works with both localhost development and production VM deployment
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Convert a file path to an absolute URL
 * @param filePath - Can be relative path, absolute path, or full URL
 * @returns Absolute URL or null if filePath is empty
 */
export function getFileUrl(filePath?: string | null): string | null {
  if (!filePath) return null;
  
  // Already a full URL (http:// or https://)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Normalize path: replace backslashes with forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Ensure path starts with /
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  // Return absolute URL using API base URL
  return `${API_URL}${cleanPath}`;
}

/**
 * Get image URL from various possible image object formats
 * @param image - Image object with various possible property names
 * @param fallback - Fallback URL if no image found (default: '/placeholder.jpg')
 * @returns Image URL
 */
export function getImageUrl(image: any, fallback: string = '/placeholder.jpg'): string {
  const imagePath = image?.file_path || 
                   image?.FilePath || 
                   image?.image_url || 
                   image?.ImageUrl || 
                   image?.working_image_url;
  
  return getFileUrl(imagePath) || fallback;
}

/**
 * Get profile image URL
 * @param profileImageUrl - Profile image URL from user object
 * @returns Absolute URL or null
 */
export function getProfileImageUrl(profileImageUrl?: string | null): string | null {
  return getFileUrl(profileImageUrl);
}
