import { get } from "http";

export const API = process.env.NEXT_PUBLIC_API_URL || "/api";

// Color Theme
export const theme = {
    primary: '#FF6B35',
    primaryLight: '#FFE5DC',
    primaryDark: '#E85A2A',
    secondary: '#FFA500',
    accent: '#FF8C5A',
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export async function fetchMyPortfolios() {
    const response = await fetch(`${API}/portfolio/my`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch portfolios");
    return response.json();
}

export async function fetchActivities() {
    const response = await fetch(`${API}/portfolio/activities?include_images=true`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch activities");
    return response.json();
}

export async function fetchWorkings() {
    const response = await fetch(`${API}/portfolio/workings?include_images=true`,{
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch workings");
    return response.json();
}

export async function createSection(data: any) {
    const response = await fetch(`${API}/portfolio/section`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create section");
    return response.json();
}

export async function updateSection(sectionId: number, data: any) {
    const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update section");
    return response.json();
}

export async function createBlock(data: any) {
    const response = await fetch(`${API}/portfolio/block`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create block");
    return response.json();
}

export async function updateBlock(blockId: number, data: any) {
    const response = await fetch(`${API}/portfolio/block/${blockId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update block");
    return response.json();
}

export async function deleteBlock(blockId: number) {
    const response = await fetch(`${API}/portfolio/block/${blockId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete block");
    return response.json();
}

export async function deleteSection(sectionId: number) {
    const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete section");
    return response.json();
}

export async function updatePortfolio(id: number, data: any) {
    const res = await fetch(`${API}/portfolio/${id}`, { // ตรวจสอบ Route ของ Backend คุณว่าใช้ path นี้หรือไม่
        method: "PATCH", // หรือ PUT ขึ้นอยู่กับ Backend
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update portfolio");
    return res.json();
}