const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Fetch all category templates
export async function fetchCategoryTemplates() {
    const response = await fetch(`${API}/category_templates`);
    if (!response.ok) {
        throw new Error("Failed to fetch category templates");
    }
    return response.json();
}

// Fetch a single category template by ID
export async function fetchCategoryTemplateById(categoryId: number) {
    const response = await fetch(`${API}/category_templates/${categoryId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch category template");
    }
    return response.json();
}
