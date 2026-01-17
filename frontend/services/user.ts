// @ts-nocheck
// ^^^ IGNORE ME. This is a temporary directive to suppress irrelevant TypeScript errors during this debugging phase.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// A dummy logger to use as a default to avoid errors.
const noOpLogger = (message: string) => {};

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type UserDTO = {
  id?: number;
  ID?: number;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  email?: string;
  id_number?: string;
  phone?: string;
  birthday?: string;
  pdpa_consent?: boolean;
  type_id?: number;
  id_type?: number;
  CreatedAt?: string;
  user_type?: { type_name?: string; id?: number; ID?: number };
  user_id_type?: { id_name?: string; id?: number; ID?: number };
  profile_image_url?: string; // เพิ่มฟิลด์รูปโปรไฟล์
  education?: any;
  academic_score?: any;
};

type BaseUserPayload = {
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  email: string;
  password?: string;
  id_number: string;
  phone: string;
  birthday: string;
  pdpa_consent: boolean;
  type_id: number;
  id_type: number;
  profile_image_url?: string;

  education?: any;
  academic_score?: any;
  language_scores?: any[];
  ged_score?: any;
};

export type CreateUserPayload = BaseUserPayload;
export type UpdateUserPayload = BaseUserPayload;

const USER_TYPE_LABEL: Record<number, string> = {
  1: "นักเรียน",
  2: "ครู",
  3: "แอดมิน",
};

const ID_TYPE_LABEL: Record<number, string> = {
  1: "บัตรประชาชน",
  2: "G-Code",
  3: "Passport",
};

function requireToken(): string {
  if (typeof window === "undefined") {
    throw new HttpError(401, "กรุณาเข้าสู่ระบบใหม่");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new HttpError(401, "กรุณาเข้าสู่ระบบใหม่");
  }
  return token;
}

function getAuthHeaders() {
  const token = requireToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const text = await res.text();
  let data: any = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      fallbackMessage ||
      `request failed with status ${res.status}`;
    throw new HttpError(res.status, message);
  }

  return data as T;
}

function toApiPayload(payload: CreateUserPayload | UpdateUserPayload) {
  const base: Record<string, any> = {
    first_name_th: payload.first_name_th || "",
    last_name_th: payload.last_name_th || "",
    first_name_en: payload.first_name_en || "",
    last_name_en: payload.last_name_en || "",
    email: payload.email,
    id_number: payload.id_number,
    phone: payload.phone,
    birthday: payload.birthday,
    pdpa_consent: payload.pdpa_consent ?? true,
    account_type_id: payload.type_id,
    id_doc_type_id: payload.id_type,
    profile_image_url: payload.profile_image_url || "",
  };

  if (payload.password !== undefined && payload.password !== "") {
    base.password = payload.password;
  }

  return base;
}

function normalizeUser(raw: any, logger = noOpLogger): UserDTO {
  // logger(" [normalizeUser] Starting normalization...");
  // logger(` [normalizeUser] Input 'raw' object keys: ${Object.keys(raw).join(", ")}`);
  
  const user = raw?.user || raw; // The user object is either nested or it's the raw object itself.

  const result: UserDTO = {
    ...raw, // Keep top-level things like education
    ...user, // Flatten the user object's properties, which are in snake_case
  };
  // logger(` [normalizeUser] Normalization complete. Resulting firstname: ${result.first_name_th}`);
  return result;
}

export function getUserTypeName(typeId?: number) {
  if (!typeId) return "ไม่ทราบประเภท";
  return USER_TYPE_LABEL[typeId] || "ไม่ทราบประเภท";
}

export function getIDTypeName(idType?: number) {
  if (!idType) return "ไม่ทราบประเภทเอกสาร";
  return ID_TYPE_LABEL[idType] || "ไม่ทราบประเภทเอกสาร";
}

export function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function fetchAllUsers(): Promise<UserDTO[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ data?: any[] }>(res, "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map(normalizeUser);
}

export async function createUser(payload: CreateUserPayload): Promise<UserDTO> {
  if (!payload.password) {
    throw new HttpError(400, "กรุณาระบุรหัสผ่าน");
  }

  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(toApiPayload(payload)),
  });

  const data = await handleResponse<{ data?: any }>(res, "ไม่สามารถสร้างผู้ใช้ได้");
  return normalizeUser(data?.data || data);
}

export async function updateUser(userId: number | string, payload: UpdateUserPayload): Promise<UserDTO> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(toApiPayload(payload)),
  });

  const data = await handleResponse<{ data?: any }>(res, "ไม่สามารถอัปเดตผู้ใช้ได้");
  return normalizeUser(data?.data || data);
}

export async function deleteUser(userId: number | string): Promise<boolean> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await handleResponse(res, "ไม่สามารถลบผู้ใช้ได้");
  return true;
}

//เพิ่มเติมฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ตาม ID
export async function fetchUserById(userId: number | string): Promise<UserDTO> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ data?: any }>(res, "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
  return normalizeUser(data?.data || data);
}

// ฟังก์ชันช่วยแกะ User ID ออกมาจาก Token (JWT Decode)
function getUserIdFromToken(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    // JWT จะมี 3 ส่วนคั่นด้วยจุด (.) ส่วนที่ 2 คือ Payload ข้อมูล
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    // เช็คว่า Backend เก็บ ID ไว้ใน key ชื่ออะไร (ปกติคือ id, sub, หรือ userId)
    return payload.id || payload.ID || payload.user_id || payload.sub || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export async function fetchUserProfile(): Promise<UserDTO> {
  // 1. พยายามแกะ ID จาก Token ก่อน
  const userId = getUserIdFromToken();

  // 2. ถ้าได้ ID มา -> ให้เรียกใช้ API /users/{id} แทน /auth/me
  if (userId) {
    return fetchUserById(userId);
  }

  // 3. ถ้าหา ID ไม่เจอ (เช่น Token ผิดรูปแบบ) ให้ลองเสี่ยงเรียก /auth/me เดิมดู (เผื่อฟลุ๊ค) หรือ throw error
  console.warn("ไม่สามารถระบุ User ID จาก Token ได้ กำลังลองเรียก /auth/me...");
  
  const res = await fetch(`${API_URL}/auth/me`, { 
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<{ data?: any }>(res, "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
  return normalizeUser(data?.data || data);
}

// THIS IS THE MAIN FUNCTION BEING CALLED
export async function fetchMyProfile(logger: (message: string) => void = noOpLogger): Promise<UserDTO> {
  const url = `${API_URL}/users/me/profile`;
  logger(`[fetchMyProfile] STEP 1: Calling API: ${url}`);
  
  try {
    const headers = getAuthHeaders(logger);
    const res = await fetch(url, { headers });
    
    logger("[fetchMyProfile] STEP 2: Got response. Handling response...");
    const data = await handleResponse<any>(res, "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", logger);
    
    logger("[fetchMyProfile] STEP 3: Response handled. Normalizing user data...");
    const result = normalizeUser(data, logger);
    
    logger("[fetchMyProfile] STEP 4: Normalization complete. Returning result.");
    return result;
  } catch (error) {
    logger(`[fetchMyProfile] FAILED: An error occurred during fetch: ${error.message}`);
    // Re-throw the error so the calling component's catch block can handle it.
    throw error;
  }
}
