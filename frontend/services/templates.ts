const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// API functions for templates

// Fetch all templates from the backend
export async function fetchTemplates() {
    const response = await fetch(`${API}/templates`);
    if (!response.ok) {
        throw new Error("Failed to fetch templates");
    }
    return response.json();
}

// Fetch a single template by ID from the backend
export async function fetchTemplateById(templateId: number) {
    const response = await fetch(`${API}/templates/${templateId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch template");
    }
    return response.json();
}

// Create a new template
export async function createTemplate(templateData: any) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API}/templates`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(templateData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create template");
    }
    return response.json();
}

// Update a template by ID
export async function updateTemplate(templateId: number, templateData: any) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API}/templates/${templateId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(templateData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update template");
    }
    return response.json();
}

// Delete a template by ID
export async function deleteTemplate(templateId: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API}/templates/${templateId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete template");
    }
    return response.json();
}

