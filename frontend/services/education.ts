const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type EducationLevelDTO = {
  id: number;
  name: string;
};

export type SchoolTypeDTO = {
  id: number;
  name: string;
};

export type CurriculumTypeDTO = {
  id: number;
  name: string;
  school_type_id?: number | null;
  school_type?: SchoolTypeDTO | null;
};

export type SchoolDTO = {
  id: number;
  code?: string;
  name: string;
  school_type_id: number;
  school_type?: SchoolTypeDTO | null;
  is_project_based?: boolean;
};

export type CreateCurriculumTypePayload = {
  name: string;
  school_type_id?: number | null;
};

export type CreateSchoolPayload = {
  code?: string;
  name: string;
  school_type_id: number;
  is_project_based?: boolean;
};

export type SchoolListResponse = {
  items: SchoolDTO[];
  total: number;
  limit: number;
  offset: number;
};

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeLevel(raw: any): EducationLevelDTO {
  return {
    id: raw?.id ?? raw?.ID ?? 0,
    name: raw?.name ?? raw?.Name ?? "",
  };
}

function normalizeSchoolType(raw: any): SchoolTypeDTO {
  return {
    id: raw?.id ?? raw?.ID ?? 0,
    name: raw?.name ?? raw?.Name ?? "",
  };
}

function normalizeCurriculumType(raw: any): CurriculumTypeDTO {
  return {
    id: raw?.id ?? raw?.ID ?? 0,
    name: raw?.name ?? raw?.Name ?? "",
    school_type_id: raw?.school_type_id ?? raw?.SchoolTypeID ?? null,
    school_type: raw?.school_type ? normalizeSchoolType(raw.school_type) : raw?.SchoolType ? normalizeSchoolType(raw.SchoolType) : null,
  };
}

function normalizeSchool(raw: any): SchoolDTO {
  return {
    id: raw?.id ?? raw?.ID ?? 0,
    code: raw?.code ?? raw?.Code ?? "",
    name: raw?.name ?? raw?.Name ?? "",
    school_type_id: raw?.school_type_id ?? raw?.SchoolTypeID ?? 0,
    school_type: raw?.school_type ? normalizeSchoolType(raw.school_type) : raw?.SchoolType ? normalizeSchoolType(raw.SchoolType) : null,
    is_project_based: raw?.is_project_based ?? raw?.IsProjectBased ?? false,
  };
}

async function handleResponse(res: Response, fallbackMessage: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any)?.error || fallbackMessage;
    throw new Error(message);
  }
  return json;
}

// ===== Education Levels =====

export async function fetchEducationLevels(): Promise<EducationLevelDTO[]> {
  const res = await fetch(`${API_URL}/admin/education/levels`, {
    headers: authHeaders(),
  });
  const json = await handleResponse(res, "ไม่สามารถโหลดข้อมูลระดับการศึกษาได้");
  const raw = (json as any).data || (json as any).items || [];
  return Array.isArray(raw) ? raw.map(normalizeLevel) : [];
}

export async function createEducationLevel(name: string): Promise<EducationLevelDTO> {
  const res = await fetch(`${API_URL}/admin/education/levels`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const json = await handleResponse(res, "ไม่สามารถสร้างระดับการศึกษาได้");
  return normalizeLevel((json as any).data || json);
}

export async function updateEducationLevel(id: number, name: string): Promise<EducationLevelDTO> {
  const res = await fetch(`${API_URL}/admin/education/levels/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const json = await handleResponse(res, "ไม่สามารถอัปเดตระดับการศึกษาได้");
  return normalizeLevel((json as any).data || json);
}

export async function deleteEducationLevel(id: number) {
  const res = await fetch(`${API_URL}/admin/education/levels/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse(res, "ไม่สามารถลบระดับการศึกษาได้");
}

// ===== School Types =====

export async function fetchSchoolTypes(): Promise<SchoolTypeDTO[]> {
  const res = await fetch(`${API_URL}/admin/education/school-types`, {
    headers: authHeaders(),
  });
  const json = await handleResponse(res, "ไม่สามารถโหลดข้อมูลประเภทสถานศึกษาได้");
  const raw = (json as any).data || (json as any).items || [];
  return Array.isArray(raw) ? raw.map(normalizeSchoolType) : [];
}

export async function createSchoolType(name: string): Promise<SchoolTypeDTO> {
  const res = await fetch(`${API_URL}/admin/education/school-types`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const json = await handleResponse(res, "ไม่สามารถสร้างประเภทสถานศึกษาได้");
  return normalizeSchoolType((json as any).data || json);
}

export async function updateSchoolType(id: number, name: string): Promise<SchoolTypeDTO> {
  const res = await fetch(`${API_URL}/admin/education/school-types/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const json = await handleResponse(res, "ไม่สามารถอัปเดตประเภทสถานศึกษาได้");
  return normalizeSchoolType((json as any).data || json);
}

export async function deleteSchoolType(id: number) {
  const res = await fetch(`${API_URL}/admin/education/school-types/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse(res, "ไม่สามารถลบประเภทสถานศึกษาได้");
}

// ===== Curriculum Types =====

export async function fetchCurriculumTypes(schoolTypeId?: number | null): Promise<CurriculumTypeDTO[]> {
  const params = new URLSearchParams();
  if (schoolTypeId) {
    params.set("school_type_id", String(schoolTypeId));
  }
  const res = await fetch(`${API_URL}/admin/education/curriculum-types${params.toString() ? `?${params.toString()}` : ""}`, {
    headers: authHeaders(),
  });
  const json = await handleResponse(res, "ไม่สามารถโหลดข้อมูลหลักสูตรได้");
  const raw = (json as any).data || (json as any).items || [];
  return Array.isArray(raw) ? raw.map(normalizeCurriculumType) : [];
}

export async function createCurriculumType(payload: CreateCurriculumTypePayload): Promise<CurriculumTypeDTO> {
  const res = await fetch(`${API_URL}/admin/education/curriculum-types`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: payload.name,
      school_type_id: payload.school_type_id ?? null,
    }),
  });
  const json = await handleResponse(res, "ไม่สามารถสร้างประเภทหลักสูตรได้");
  return normalizeCurriculumType((json as any).data || json);
}

export async function updateCurriculumType(id: number, payload: CreateCurriculumTypePayload): Promise<CurriculumTypeDTO> {
  const res = await fetch(`${API_URL}/admin/education/curriculum-types/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      name: payload.name,
      school_type_id: payload.school_type_id ?? null,
    }),
  });
  const json = await handleResponse(res, "ไม่สามารถอัปเดตประเภทหลักสูตรได้");
  return normalizeCurriculumType((json as any).data || json);
}

export async function deleteCurriculumType(id: number) {
  const res = await fetch(`${API_URL}/admin/education/curriculum-types/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse(res, "ไม่สามารถลบประเภทหลักสูตรได้");
}

// ===== Schools =====

export async function fetchSchools(params?: {
  search?: string;
  school_type_id?: number | null;
  is_project_based?: boolean | null;
  limit?: number;
  offset?: number;
}): Promise<SchoolListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search.trim());
  if (params?.school_type_id) query.set("school_type_id", String(params.school_type_id));
  if (typeof params?.is_project_based === "boolean") {
    query.set("is_project_based", String(params.is_project_based));
  }
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/admin/education/schools${query.toString() ? `?${query.toString()}` : ""}`, {
    headers: authHeaders(),
  });
  const json = await handleResponse(res, "ไม่สามารถโหลดข้อมูลสถานศึกษาได้");

  const rawItems = (json as any).items || (json as any).data || [];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeSchool) : [];
  return {
    items,
    total: Number((json as any).total ?? items.length),
    limit: Number((json as any).limit ?? params?.limit ?? items.length),
    offset: Number((json as any).offset ?? params?.offset ?? 0),
  };
}

export async function createSchool(payload: CreateSchoolPayload): Promise<SchoolDTO> {
  const res = await fetch(`${API_URL}/admin/education/schools`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      code: payload.code?.trim() || "",
      name: payload.name,
      school_type_id: payload.school_type_id,
      is_project_based: payload.is_project_based ?? false,
    }),
  });
  const json = await handleResponse(res, "ไม่สามารถสร้างสถานศึกษาได้");
  return normalizeSchool((json as any).data || json);
}

export async function updateSchool(id: number, payload: CreateSchoolPayload): Promise<SchoolDTO> {
  const res = await fetch(`${API_URL}/admin/education/schools/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      code: payload.code?.trim() || "",
      name: payload.name,
      school_type_id: payload.school_type_id,
      is_project_based: payload.is_project_based ?? false,
    }),
  });
  const json = await handleResponse(res, "ไม่สามารถอัปเดตสถานศึกษาได้");
  return normalizeSchool((json as any).data || json);
}

export async function deleteSchool(id: number) {
  const res = await fetch(`${API_URL}/admin/education/schools/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleResponse(res, "ไม่สามารถลบสถานศึกษาได้");
}
