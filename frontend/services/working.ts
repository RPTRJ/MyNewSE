import { getFileUrl } from "@/utils/fileUrl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface TypeWorking {
    ID: number;
    type_name: string;
}

export interface WorkingImage {
    ID: number;
    working_image_url: string;
}

export interface WorkingLink {
    ID: number;
    working_link: string;
}

export interface WorkingDetail {
    working_at: string;
    description: string;
    type_working_id: number;
    type_working?: TypeWorking;
    images?: WorkingImage[];
    links?: WorkingLink[];
}

export interface Working {
    ID: number;
    working_name: string;
    status: string;
    working_detail_id: number;
    working_detail?: WorkingDetail;
    user_id?: number;
}

export interface CreateWorkingPayload {
    working_name: string;
    status: string;
    working_detail: {
        working_at: string;
        description: string;
        type_working_id: number;
        images?: { working_image_url: string }[];
        links?: { working_link: string }[];
    };
    user_id?: number;
}

export async function getWorkings(): Promise<Working[]> {
    const res = await fetch(`${API_URL}/workings`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch workings");
    const json = await res.json();
    return json.data;
}

export async function getTypeWorkings(): Promise<TypeWorking[]> {
    const res = await fetch(`${API_URL}/type_workings`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch types");
    return res.json();
}

export async function createWorking(
    payload: CreateWorkingPayload
): Promise<Working> {
    const res = await fetch(`${API_URL}/workings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create working");
    }
    const json = await res.json();
    return json.data;
}

export async function deleteWorking(id: number) {
    const res = await fetch(`${API_URL}/workings/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!res.ok) throw new Error("Failed to delete");
    return res.json();
}

export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload image");
    const json = await res.json();
    const rawUrl = json?.url || json?.path || json?.file_path;
    if (!rawUrl) {
        throw new Error("Upload response missing file URL");
    }
    return getFileUrl(rawUrl) || rawUrl;
}

export async function updateWorking(
    id: number,
    payload: CreateWorkingPayload
): Promise<Working> {
    const res = await fetch(`${API_URL}/workings/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update working");
    }
    const json = await res.json();
    return json.data;
}

export async function getWorkingsByUser(userId: number): Promise<Working[]> {
    const res = await fetch(`${API_URL}/workings/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch workings");
    const json = await res.json();
    return json.data || json; // Handle potential different response structure
}

export async function getWorkingsByUserWithMeta(userId: number): Promise<{ data: Working[], total: number }> {
    const res = await fetch(`${API_URL}/workings/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch workings");
    const json = await res.json();
    return json;
}
