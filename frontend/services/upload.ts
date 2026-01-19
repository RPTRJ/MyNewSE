import { getFileUrl } from "@/utils/fileUrl";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Upload file to backend server
 * @param file - File to upload
 * @returns Promise with uploaded file URL
 */
export async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload file");
    }

    const data = await response.json();
    const rawUrl = data?.url || data?.path || data?.file_path;
    if (!rawUrl) {
        throw new Error("Upload response missing file URL");
    }
    return getFileUrl(rawUrl) || rawUrl;
}

/**
 * Delete file from backend server
 * @param fileUrl - Full URL of the file to delete
 * @returns Promise<void>
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    // Extract filename from URL (e.g., "http://localhost:8080/uploads/abc123.png" -> "abc123.png")
    const filename = fileUrl.split('/').pop();
    if (!filename) {
        throw new Error("Invalid file URL");
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const response = await fetch(`${API}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        // Don't throw error if file doesn't exist (404)
        if (response.status !== 404) {
            throw new Error("Failed to delete file");
        }
    }
}

/**
 * Upload image file to backend server
 * @param file - Image file to upload
 * @returns Promise with uploaded image URL
 */
export async function uploadImage(file: File): Promise<string> {
    // Validate image file extension (works in all browsers including Edge)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    // Edge may not set file.type correctly, so we primarily check extension
    if (!hasValidExtension) {
        throw new Error("File must be an image (JPG, PNG, GIF, WEBP, SVG, BMP, ICO)");
    }

    return uploadFile(file);
}
