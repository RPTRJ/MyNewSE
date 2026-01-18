/**
 * Normalize image URL to work in both development and production
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  placeholder: string = "/placeholder.jpg"
): string {
  if (!url || url.trim() === "") return placeholder;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (pathname.includes("/uploads/")) {
      const uploadsIndex = pathname.indexOf("/uploads/");
      return pathname.substring(uploadsIndex);
    }
    return pathname || placeholder;
  } catch (e) {
    // Handle localhost URLs
    const localhostPattern = /^https?:\/\/localhost(:\d+)?/;
    if (localhostPattern.test(url)) {
      return url.replace(localhostPattern, "");
    }
    const productionPattern = /^https?:\/\/sutportfolio\.online/;
    if (productionPattern.test(url)) {
      return url.replace(productionPattern, "");
    }
    return url;
  }
}

export const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0U1RTdFQiIvPjwvc3ZnPg==";