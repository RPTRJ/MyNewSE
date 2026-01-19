import { getFileUrl } from "@/utils/fileUrl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Interfaces
export interface TypeActivity {
    ID: number;
    type_name: string;
}

export interface LevelActivity {
    ID: number;
    level_name: string;
}

export interface Reward {
    ID: number;
    level_name: string;
}

export interface ActivityImage {
    ID: number;
    image_url: string;
    activity_detail_id: number;
}

export interface ActivityDetail {
    ID?: number;
    activity_at: string;
    institution: string;
    description: string;
    type_activity_id: number;
    level_activity_id: number;
    type_activity?: TypeActivity;
    level_activity?: LevelActivity;
    images?: ActivityImage[];
}

export interface Activity {
    ID: number;
    activity_name: string;
    activity_detail_id: number;
    user_id: number;
    reward_id: number;

    activity_detail?: ActivityDetail;
    reward?: Reward;
}

export interface CreateActivityPayload {
    activity_name: string;
    reward_id: number;
    activity_detail: {
        activity_at: string;
        institution: string;
        description: string;
        type_activity_id: number;
        level_activity_id: number;
        images?: { image_url: string }[];
    };
    user_id?: number;
}

export interface UpdateActivityPayload {
    activity_name?: string;
    reward_id?: number;
    activity_detail?: {
        activity_at?: string;
        institution?: string;
        description?: string;
        type_activity_id?: number;
        level_activity_id?: number;
        images?: { image_url: string }[];
    };
}

// API Functions

export const uploadImage = async (file: File): Promise<string> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Failed to upload image");
    }
    const json = await res.json();
    const rawUrl = json?.url || json?.path || json?.file_path;
    if (!rawUrl) {
        throw new Error("Upload response missing file URL");
    }
    // Return raw URL from backend (relative path like /uploads/123.png)
    // Frontend will use getFileUrl() only for display purposes
    return rawUrl;
};

// Pagination options
export interface FetchOptions {
    page?: number;
    limit?: number;
    includeImages?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export const getActivities = async (options: FetchOptions = {}): Promise<Activity[]> => {
    const { page = 1, limit = 20, includeImages = true } = options;
    const token = localStorage.getItem("token");

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        include_images: includeImages.toString(),
    });

    const res = await fetch(`${API_URL}/activities?${params}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch activities");
    }
    const data = await res.json();
    return data.data;
};

export const getActivitiesWithMeta = async (options: FetchOptions = {}): Promise<PaginatedResponse<Activity>> => {
    const { page = 1, limit = 20, includeImages = true } = options;
    const token = localStorage.getItem("token");

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        include_images: includeImages.toString(),
    });

    const res = await fetch(`${API_URL}/activities?${params}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch activities");
    }
    return await res.json();
};

export const createActivity = async (payload: CreateActivityPayload) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create activity");
    }
    return res.json();
};

export const updateActivity = async (id: number, payload: UpdateActivityPayload) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/activities/${id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update activity");
    }
    return res.json();
};

export const deleteActivity = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/activities/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to delete activity");
    }
    return res.json();
};

export const getTypeActivities = async (): Promise<TypeActivity[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/type_activities`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
};

export const getLevelActivities = async (): Promise<LevelActivity[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/level_activities`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
};

export const getRewards = async (): Promise<Reward[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/rewards`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
};

//fueng add - WITH PAGINATION SUPPORT
export const getActivitiesByUser = async (userId: number, options: FetchOptions = {}): Promise<Activity[]> => {
    const { page = 1, limit = 20, includeImages = true } = options;
    const token = localStorage.getItem("token");

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        include_images: includeImages.toString(),
    });

    const res = await fetch(`${API_URL}/activities/user/${userId}?${params}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch activities");
    }

    const data = await res.json();
    return data.data || data; // ✅ Handle both formats
};


