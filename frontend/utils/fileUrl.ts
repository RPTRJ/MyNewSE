/**
 * Utility functions for handling file URLs
 * รองรับทั้ง relative paths และ absolute URLs
 */

/**
 * Get API URL dynamically
 * - Client-side: ใช้ NEXT_PUBLIC_API_URL
 * - Server-side: fallback to localhost (for SSR)
 */
function getApiUrl(): string {
    // Server-side rendering
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    }

    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

/**
 * แปลง file path เป็น full URL ที่ใช้งานได้
 *
 * @param filePath - Path ที่ backend ส่งมา (อาจเป็น relative หรือ absolute)
 * @returns Full URL ที่พร้อมใช้งาน
 *
 * @example
 * // Production (backend return relative path)
 * getFileUrl('/uploads/123.png')
 * => 'https://sutportfolio.online/api/uploads/123.png'
 *
 * // Development (backend return absolute URL)
 * getFileUrl('http://localhost:8080/uploads/123.png')
 * => 'http://localhost:8080/uploads/123.png'
 *
 * // Already correct
 * getFileUrl('https://sutportfolio.online/api/uploads/123.png')
 * => 'https://sutportfolio.online/api/uploads/123.png'
 */
export function getFileUrl(filePath: string | undefined | null): string {
    if (!filePath) return '';

    const API_URL = getApiUrl();

    // ถ้าเป็น absolute URL แล้ว (starts with http:// or https://)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // ถ้าเป็น relative path ให้ prepend API_URL
    // Normalize path: replace backslashes with forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Ensure path starts with /
    const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

    // เช่น: /uploads/123.png => https://sutportfolio.online/api/uploads/123.png
    return `${API_URL}${path}`;
}

/**
 * ดึงชื่อไฟล์จาก URL
 */
export function getFileName(fileUrl: string | undefined | null): string {
    if (!fileUrl) return '';
    return fileUrl.split('/').pop() || '';
}

/**
 * ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
 */
export function isImageFile(fileName: string | undefined | null): boolean {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension || '');
}

/**
 * ตรวจสอบว่าเป็นไฟล์เอกสารหรือไม่
 */
export function isDocumentFile(fileName: string | undefined | null): boolean {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '');
}

/**
 * ดึงประเภทไฟล์
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
        case 'ppt':
        case 'pptx': return 'PowerPoint Presentation';
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
 * แปลงขนาดไฟล์เป็น human-readable
 */
export function formatFileSize(bytes: number | undefined | null): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
