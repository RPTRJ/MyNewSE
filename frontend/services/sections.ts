const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// API functions for sections

// Fetch all sections from the backend
export async function fetchSections() {
    const response = await fetch(`${API}/template_sections`);
    if (!response.ok) {
        throw new Error("Failed to fetch sections");
    }
    return response.json();
}
// Fetch a single section by ID from the backend
export async function fetchSectionById(sectionId: number) {
    const response = await fetch(`${API}/sections/${sectionId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch section");
    }
    return response.json();
}
// // Create a new section in the backend
// export async function createSection(sectionData: any) {
//     const response = await fetch(`${API}/sections`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(sectionData),
//     });
//     if (!response.ok) {
//         throw new Error("Failed to create section");
//     }
//     return response.json();
// }
// // Update an existing section in the backend
// export async function updateSection(sectionId: number, sectionData: any) {
//     const response = await fetch(`${API}/sections/${sectionId}`, {
//         method: "PUT",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(sectionData),
//     });     
//     if (!response.ok) {
//         throw new Error("Failed to update section");
//     }
//     return response.json();
// }