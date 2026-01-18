const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ==================== Types ====================

export type SkillDTO = {
  id: number;
  skill_name_th: string;
  skill_name_en: string;
  category: number;
  description?: string;
};

export type CourseGroupSkillDTO = {
  id: number;
  course_group_id: number;
  skill_id: number;
  skill?: SkillDTO;
  importance: number; // 1-5
  description?: string;
};

export type CourseGroupDTO = {
  id: number;
  name: string;
  name_en: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  course_group_skills?: CourseGroupSkillDTO[];
};

export type CreateCourseGroupPayload = {
  name: string;
  name_en?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
};

export type CreateCourseGroupSkillPayload = {
  skill_id: number;
  importance?: number;
  description?: string;
};

// ==================== Curriculum Course Group Types ====================

export type CurriculumCourseGroupDTO = {
  id: number;
  curriculum_id: number;
  course_group_id: number;
  course_group?: CourseGroupDTO;
  credit_percentage?: number;
  description?: string;
};

export type CreateCurriculumCourseGroupPayload = {
  course_group_id: number;
  credit_percentage?: number;
  description?: string;
};

export type UpdateCurriculumCourseGroupPayload = {
  course_group_id: number;
  credit_percentage?: number;
  description?: string;
};

// ==================== Helpers ====================

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeSkill(raw: any): SkillDTO {
  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    skill_name_th: raw.skill_name_th ?? raw.SkillNameTH ?? "",
    skill_name_en: raw.skill_name_en ?? raw.SkillNameEN ?? "",
    category: Number(raw.category ?? raw.Category ?? 0),
    description: raw.description ?? raw.Description ?? "",
  };
}

function normalizeCourseGroupSkill(raw: any): CourseGroupSkillDTO {
  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    course_group_id: Number(raw.course_group_id ?? raw.CourseGroupID ?? 0),
    skill_id: Number(raw.skill_id ?? raw.SkillID ?? 0),
    skill: raw.skill ?? raw.Skill ? normalizeSkill(raw.skill ?? raw.Skill) : undefined,
    importance: Number(raw.importance ?? raw.Importance ?? 1),
    description: raw.description ?? raw.Description ?? "",
  };
}

function normalizeCourseGroup(raw: any): CourseGroupDTO {
  const rawSkills = raw.course_group_skills ?? raw.CourseGroupSkills ?? [];

  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    name: raw.name ?? raw.Name ?? "",
    name_en: raw.name_en ?? raw.NameEN ?? "",
    description: raw.description ?? raw.Description ?? "",
    icon: raw.icon ?? raw.Icon ?? "",
    is_active: Boolean(raw.is_active ?? raw.IsActive ?? true),
    course_group_skills: Array.isArray(rawSkills)
      ? rawSkills.map(normalizeCourseGroupSkill)
      : [],
  };
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeCurriculumCourseGroup(raw: any): CurriculumCourseGroupDTO {
  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    curriculum_id: Number(raw.curriculum_id ?? raw.CurriculumID ?? 0),
    course_group_id: Number(raw.course_group_id ?? raw.CourseGroupID ?? 0),
    course_group: raw.course_group ?? raw.CourseGroup
      ? normalizeCourseGroup(raw.course_group ?? raw.CourseGroup)
      : undefined,
    credit_percentage: Number(raw.credit_percentage ?? raw.CreditPercentage ?? 0),
    description: raw.description ?? raw.Description ?? "",
  };
}

// ==================== CourseGroup API ====================

/**
 * ดึงรายการกลุ่มวิชาทั้งหมด (Public)
 */
export async function fetchCourseGroups(activeOnly: boolean = false): Promise<CourseGroupDTO[]> {
  const url = activeOnly
    ? `${API_URL}/course-groups?active=true`
    : `${API_URL}/course-groups`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("โหลดรายการกลุ่มวิชาไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeCourseGroup) : [];
}

/**
 * ดึงกลุ่มวิชาตาม ID พร้อมทักษะ (Public)
 */
export async function fetchCourseGroupById(id: number): Promise<CourseGroupDTO> {
  const res = await fetch(`${API_URL}/course-groups/${id}`);
  if (!res.ok) throw new Error("โหลดกลุ่มวิชาไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeCourseGroup(json.data ?? json);
}

/**
 * สร้างกลุ่มวิชาใหม่ (Admin)
 */
export async function createCourseGroup(payload: CreateCourseGroupPayload): Promise<CourseGroupDTO> {
  const res = await fetch(`${API_URL}/admin/course-groups`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("สร้างกลุ่มวิชาไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeCourseGroup(json.data ?? json);
}

/**
 * อัปเดตกลุ่มวิชา (Admin)
 */
export async function updateCourseGroup(
  id: number,
  payload: CreateCourseGroupPayload
): Promise<CourseGroupDTO> {
  const res = await fetch(`${API_URL}/admin/course-groups/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("อัปเดตกลุ่มวิชาไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeCourseGroup(json.data ?? json);
}

/**
 * ลบกลุ่มวิชา (Admin)
 */
export async function deleteCourseGroup(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/course-groups/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("ลบกลุ่มวิชาไม่สำเร็จ");
}

// ==================== CourseGroupSkill API ====================

/**
 * ดึงรายการทักษะของกลุ่มวิชา (Admin)
 */
export async function fetchCourseGroupSkills(courseGroupId: number): Promise<CourseGroupSkillDTO[]> {
  const res = await fetch(`${API_URL}/admin/course-groups/${courseGroupId}/skills`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("โหลดทักษะของกลุ่มวิชาไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeCourseGroupSkill) : [];
}

/**
 * เพิ่มทักษะให้กลุ่มวิชา (Admin)
 */
export async function addSkillToCourseGroup(
  courseGroupId: number,
  payload: CreateCourseGroupSkillPayload
): Promise<CourseGroupSkillDTO> {
  const res = await fetch(`${API_URL}/admin/course-groups/${courseGroupId}/skills`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await safeJson(res);
    if (res.status === 409) {
      throw new Error("ทักษะนี้ถูกเพิ่มในกลุ่มวิชานี้แล้ว");
    }
    throw new Error(json?.error ?? "เพิ่มทักษะไม่สำเร็จ");
  }

  const json = (await safeJson(res)) || {};
  return normalizeCourseGroupSkill(json.data ?? json);
}

/**
 * อัปเดตทักษะของกลุ่มวิชา (Admin)
 */
export async function updateCourseGroupSkill(
  courseGroupId: number,
  skillId: number,
  payload: CreateCourseGroupSkillPayload
): Promise<CourseGroupSkillDTO> {
  const res = await fetch(`${API_URL}/admin/course-groups/${courseGroupId}/skills/${skillId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("อัปเดตทักษะไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeCourseGroupSkill(json.data ?? json);
}

/**
 * ลบทักษะออกจากกลุ่มวิชา (Admin)
 */
export async function removeSkillFromCourseGroup(
  courseGroupId: number,
  skillId: number
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/course-groups/${courseGroupId}/skills/${skillId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("ลบทักษะไม่สำเร็จ");
}

// ==================== Skill API (for dropdown) ====================

/**
 * ดึงรายการทักษะทั้งหมด (สำหรับ dropdown เลือก)
 */
export async function fetchAllSkills(): Promise<SkillDTO[]> {
  const res = await fetch(`${API_URL}/skills`, {
    headers: authHeaders(),
  });

  if (!res.ok) return [];

  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeSkill) : [];
}

export type CreateSkillPayload = {
  skill_name_th: string;
  skill_name_en?: string;
  category?: number;
  description?: string;
};

/**
 * สร้างทักษะใหม่ (Admin)
 */
export async function createSkill(payload: CreateSkillPayload): Promise<SkillDTO> {
  const res = await fetch(`${API_URL}/admin/skills`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("สร้างทักษะไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeSkill(json.data ?? json);
}

/**
 * อัปเดตทักษะ (Admin)
 */
export async function updateSkill(id: number, payload: CreateSkillPayload): Promise<SkillDTO> {
  const res = await fetch(`${API_URL}/admin/skills/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("อัปเดตทักษะไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeSkill(json.data ?? json);
}

/**
 * ลบทักษะ (Admin)
 */
export async function deleteSkill(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/skills/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("ลบทักษะไม่สำเร็จ");
}

// ==================== Curriculum Course Group API ====================

/**
 * ดึงรายการกลุ่มวิชาของหลักสูตร
 */
export async function fetchCurriculumCourseGroups(
  curriculumId: number
): Promise<CurriculumCourseGroupDTO[]> {
  const res = await fetch(`${API_URL}/curricula/${curriculumId}/course-groups`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("โหลดกลุ่มวิชาของหลักสูตรไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeCurriculumCourseGroup) : [];
}

/**
 * เพิ่มกลุ่มวิชาเข้าหลักสูตร
 */
export async function addCourseGroupToCurriculum(
  curriculumId: number,
  payload: CreateCurriculumCourseGroupPayload
): Promise<CurriculumCourseGroupDTO> {
  const res = await fetch(`${API_URL}/curricula/${curriculumId}/course-groups`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await safeJson(res);
    throw new Error(json?.error ?? "เพิ่มกลุ่มวิชาเข้าหลักสูตรไม่สำเร็จ");
  }

  const json = (await safeJson(res)) || {};
  return normalizeCurriculumCourseGroup(json.data ?? json);
}

/**
 * ลบกลุ่มวิชาออกจากหลักสูตร
 */
export async function removeCourseGroupFromCurriculum(
  curriculumId: number,
  courseGroupId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/curricula/${curriculumId}/course-groups/${courseGroupId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  if (!res.ok) throw new Error("ลบกลุ่มวิชาออกจากหลักสูตรไม่สำเร็จ");
}

/**
 * อัปเดตกลุ่มวิชาในหลักสูตร
 */
export async function updateCurriculumCourseGroup(
  curriculumId: number,
  courseGroupId: number,
  payload: UpdateCurriculumCourseGroupPayload
): Promise<CurriculumCourseGroupDTO> {
  const res = await fetch(
    `${API_URL}/curricula/${curriculumId}/course-groups/${courseGroupId}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) throw new Error("อัปเดตกลุ่มวิชาในหลักสูตรไม่สำเร็จ");

  const json = (await safeJson(res)) || {};
  return normalizeCurriculumCourseGroup(json.data ?? json);
}