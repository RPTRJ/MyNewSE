/**
 * Utility functions for handling file URLs
 * Works with both relative paths (/uploads/...) and absolute URLs (http://...)
 */

/**
 * Get API URL - works in client side only
 */
function getApiUrl(): string {
    // Server-side rendering check
    if (typeof window === 'undefined') {
        return 'http://localhost:8080';
    }
    
    const { protocol, host } = window.location;
    
    // Development mode (localhost with frontend port)
    if (host.includes('localhost:3000') || host.includes('localhost:3001')) {
        return 'http://localhost:8080';
    }
    
    // Production mode - API is at /api path
    return `${protocol}//${host}/api`;
}

/**
 * Get the full URL for a file path
 * Handles both relative paths and absolute URLs
 * 
 * @param filePath - The file path (can be relative or absolute)
 * @returns Full URL that can be used in img src or href
 * 
 * @example
 * getFileUrl('/uploads/123.png') => 'http://sutportfolio.online/api/uploads/123.png'
 * getFileUrl('http://localhost:8080/uploads/123.png') => 'http://sutportfolio.online/api/uploads/123.png'
 */
export function getFileUrl(filePath: string | undefined | null): string {
    if (!filePath) return '';
    
    const API_URL = getApiUrl();
    
    // If it's already a valid full URL with our current domain, return as-is
    if (filePath.startsWith(API_URL)) {
        return filePath;
    }
    
    // If it's an absolute URL (starts with http:// or https://)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Check if it's a localhost URL that needs to be converted
        if (filePath.includes('localhost') || filePath.includes('127.0.0.1')) {
            // Extract the path part and prepend our API URL
            try {
                const urlObj = new URL(filePath);
                const path = urlObj.pathname;
                return `${API_URL}${path}`;
            } catch {
                return filePath;
            }
        }
        return filePath;
    }
    
    // Normalize path: replace backslashes with forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Ensure path starts with /
    const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    
    return `${API_URL}${path}`;
}

/**
 * Get the filename from a file URL or path
 */
export function getFileName(fileUrl: string | undefined | null): string {
    if (!fileUrl) return '';
    return fileUrl.split('/').pop() || '';
}

/**
 * Check if a file is an image based on its extension
 */
export function isImageFile(fileName: string | undefined | null): boolean {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension || '');
}

/**
 * Check if a file is a document based on its extension
 */
export function isDocumentFile(fileName: string | undefined | null): boolean {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '');
}

/**
 * Get file type description
 */
export function getFileType(fileName: string | undefined | null): string {
    if (!fileName) return 'Unknown';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'pdf': return 'PDF Document';
        case 'doc':
        case 'docx': return 'Word Document';
        case 'xls':
        case 'xlsx': return 'Excel Spreadsheet';
        case 'jpg':
        case 'jpeg': return 'JPEG Image';
        case 'png': return 'PNG Image';
        case 'gif': return 'GIF Image';
        case 'webp': return 'WebP Image';
        case 'svg': return 'SVG Image';
        default: return 'File';
    }
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number | undefined | null): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}