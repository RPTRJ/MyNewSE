export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`, // ✅ ใส่ Token ตรงนี้ทีเดียวจบ
  };
};

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  includeImages?: boolean;
  includeBlocks?: boolean;
}

// Fetch user's portfolios - WITH PAGINATION SUPPORT
export async function fetchMyPortfolios(options: FetchOptions = {}) {
  const { page = 1, limit = 10, includeBlocks = true } = options;
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    include_blocks: includeBlocks.toString(),
    _t: Date.now().toString(), // Force refresh
  });

  const response = await fetch(`${API}/portfolio/my?${params}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  const result = await response.json();

  // Normalize image URLs
  if (result.data && Array.isArray(result.data)) {
    result.data = result.data.map((p: any) => ({
      ...p,
      cover_image: getImageUrl(p.cover_image),
      CoverImage: getImageUrl(p.CoverImage)
    }));
  }

  return result;
}

function getImageUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API}${url}`;
  return `${API}/${url}`;
}

// Use a template (create portfolio from template)
export async function useTemplate(templateId: number) {
  const response = await fetch(`${API}/portfolio/use-template/${templateId}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error("Failed to use template");
  }
  return response.json();
}

// Create a new custom portfolio (no template)
export async function createPortfolio(data: { portfolio_name: string; template_id?: number }) {
  const response = await fetch(`${API}/portfolio`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const msg = `Create portfolio failed: ${response.status} ${response.statusText} ${text}`;
    console.error(msg);
    throw new Error("Failed to create portfolio");
  }
  return response.json();
}

// Create a new template (using portfolio controller)
export async function createTemplate(data: { template_name: string }) {
  const response = await fetch(`${API}/portfolio/template`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create template");
  }
  return response.json();
}

// Fetch activities - WITH PAGINATION SUPPORT
export async function fetchActivities(options: FetchOptions = {}) {
  const { page = 1, limit = 20, includeImages = false } = options;
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    include_images: includeImages.toString(),
  });

  const response = await fetch(`${API}/portfolio/activities?${params}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }
  return response.json();
}

// Fetch workings - WITH PAGINATION SUPPORT
export async function fetchWorkings(options: FetchOptions = {}) {
  const { page = 1, limit = 20, includeImages = false } = options;
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    include_images: includeImages.toString(),
  });

  const response = await fetch(`${API}/portfolio/workings?${params}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch workings");
  }
  return response.json();
}

// Create a new section
export async function createSection(data: {
  section_title: string;
  section_port_key: string;
  portfolio_id: number;
  section_order: number;
  is_enabled: boolean;
}) {
  const response = await fetch(`${API}/portfolio/section`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create section");
  }
  return response.json();
}

// Update a section (including is_enabled toggle)
export async function updateSection(sectionId: number, data: Partial<{
  section_title: string;
  is_enabled: boolean;
  section_order: number;
}>) {
  const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update section");
  }
  return response.json();
}

// Create a new portfolio block
export async function createBlock(data: {
  portfolio_section_id: number;
  block_order: number;
  content: any;
}) {
  const response = await fetch(`${API}/portfolio/block`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create block");
  }
  return response.json();
}

// Update a portfolio block
export async function updateBlock(blockId: number, data: {
  content?: any;
  block_order?: number;
}) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update block");
  }
  return response.json();
}

// Delete a portfolio block
export async function deleteBlock(blockId: number) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete block");
  }
  return response.json();
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload image");
  return response.json();
}

export async function updatePortfolio(id: number, data: any) {
  const response = await fetch(`${API}/portfolio/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update portfolio");
  return response.json();
}

export async function deletePortfolio(id: number) {
  const response = await fetch(`${API}/portfolio/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete portfolio");
  return response.json();
}


// สร้าง Portfolio จาก Template โดยใช้ UseTemplate API
export const createPortfolioFromTemplate = async (portfolioName: string, templateId: number) => {
  try {
    // ใช้ UseTemplate API ที่จัดการ sections/blocks ให้แล้วที่ backend
    const response = await fetch(`${API}/portfolio/use-template/${templateId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ portfolio_name: portfolioName }),
    });

    if (!response.ok) {
      throw new Error("Failed to create portfolio from template");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Error creating portfolio from template:", error);
    throw error;
  }
};

export async function fetchPortfolioByStatusActive() {
  const response = await fetch(`${API}/portfolio`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch portfolio");
  return response.json();
}







export const fetchPortfolioById = async (portfolioId: number) => {
  const token = localStorage.getItem("token") || "";

  console.log(`[fetchPortfolioById] Fetching portfolio ${portfolioId} from ${API}/portfolio/${portfolioId}`);

  // Use the same pattern as other portfolio endpoints
  const response = await fetch(`${API}/portfolio/${portfolioId}?include_blocks=true`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(`[fetchPortfolioById] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[fetchPortfolioById] Error response: ${response.status} - ${errorText}`);
    // Return null for 404 (not found) instead of throwing - allows graceful fallback
    if (response.status === 404) {
      console.warn(`[fetchPortfolioById] Portfolio ${portfolioId} not found`);
      return null;
    }
    throw new Error(`Failed to fetch portfolio (${response.status}): ${errorText}`);
  }

  const text = await response.text();
  console.log(`[fetchPortfolioById] Response body length: ${text?.length || 0}`);

  if (!text) {
    // Return null instead of throwing for empty response - allows graceful fallback
    console.warn(`[fetchPortfolioById] Empty response for portfolio ${portfolioId}`);
    return null;
  }

  try {
    const result = JSON.parse(text);
    return result.data || result;
  } catch (e) {
    console.error('[fetchPortfolioById] Invalid JSON response:', text);
    throw new Error("Invalid JSON response from server");
  }
};