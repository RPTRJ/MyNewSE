const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function normalizeCurriculum(raw: any): CurriculumDTO {
  return {
    ...raw,
    id: raw.id ?? raw.ID,
    code: raw.code ?? raw.Code,
    name: raw.name ?? raw.Name,
    description: raw.description ?? raw.Description,
    gpax_min: raw.gpax_min ?? raw.GPAXMin,
    portfolio_max_pages: raw.portfolio_max_pages ?? raw.PortfolioMaxPages,
    status: raw.status ?? raw.Status,
    quota: raw.quota ?? raw.Quota,
    application_period: raw.application_period ?? raw.ApplicationPeriod,
    faculty: raw.faculty ? normalizeFaculty(raw.faculty) : (raw.Faculty ? normalizeFaculty(raw.Faculty) : undefined),
    program: raw.program ? normalizeProgram(raw.program) : (raw.Program ? normalizeProgram(raw.Program) : undefined),
    required_documents: raw.required_documents ?? raw.RequiredDocuments ?? [],
    link: raw.link ?? raw.Link ?? "",
  };
}

function normalizeFaculty(raw: any): FacultyDTO {
  return {
    id: raw.id ?? raw.ID,
    name: raw.name ?? raw.Name,
    short_name: raw.short_name ?? raw.ShortName,
  };
}

function normalizeProgram(raw: any): ProgramDTO {
  return {
    id: raw.id ?? raw.ID,
    name: raw.name ?? raw.Name,
    short_name: raw.short_name ?? raw.ShortName,
  };
}

export type FacultyDTO = {
  id: number;
  name: string;
  short_name?: string;
};

export type ProgramDTO = {
  id: number;
  name: string;
  short_name?: string;
};

export type DocumentTypeDTO = {
  id: number;
  name: string;
};

export type CurriculumRequiredDocumentDTO = {
  id: number;
  is_optional: boolean;
  note?: string;
  document_type?: DocumentTypeDTO;
};

export type CurriculumDTO = {
  id: number;
  code: string;
  name: string;
  description: string;
  link?: string;
  gpax_min: number;
  portfolio_max_pages: number;
  status: string;
  faculty?: FacultyDTO;
  program?: ProgramDTO;
  application_period?: string;
  quota?: number;
  required_documents?: CurriculumRequiredDocumentDTO[];
  is_notified?: boolean;
  course_groups?: any[];
};

export type CurriculumSummaryDTO = {
  total_curricula: number;
  open_curricula: number;
  total_students: number;
  by_program: { program_name: string; student_count: number }[];
};

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --------------------- Student: public search ---------------------

export async function fetchPublicCurricula(search: string) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const t = new Date().getTime(); 
  
  const res = await fetch(`${API_URL}/curricula/public?search=${search}&t=${t}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดข้อมูลหลักสูตรได้");
  }

  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeCurriculum) as CurriculumDTO[];
}

// --------------------- Admin: dropdown faculties/programs ---------------------

export async function fetchFaculties() {
  const res = await fetch(`${API_URL}/admin/faculties`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("โหลดสำนักวิชาไม่สำเร็จ");
  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeFaculty) as FacultyDTO[];
}

export async function fetchPrograms(facultyId?: number) {
  const params = new URLSearchParams();
  if (facultyId) params.set("faculty_id", String(facultyId));

  const res = await fetch(
    `${API_URL}/admin/programs?${params.toString()}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("โหลดสาขาวิชาไม่สำเร็จ");
  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeProgram) as ProgramDTO[];
}

// --------------------- Admin: CRUD + summary ---------------------

export async function fetchAdminCurricula(search: string) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const res = await fetch(
    `${API_URL}/admin/curricula?${params.toString()}`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error("โหลดข้อมูลหลักสูตร (admin) ไม่ได้");

  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeCurriculum) as CurriculumDTO[];
}

// payload กลางที่ใช้ทั้งสร้าง/แก้ไข
export type CurriculumPayload = {
  code: string;
  name: string;
  description: string;
  link: string; 
  gpax_min: number;
  portfolio_max_pages: number;
  status: string;
  faculty_id: number;
  program_id: number;
  user_id: number;
  application_period: string;
  quota: number;
};

export async function createCurriculum(payload: CurriculumPayload) {
  const res = await fetch(`${API_URL}/admin/curricula`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("สร้างหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumDTO;
}

export async function updateCurriculum(
  id: number,
  payload: CurriculumPayload
) {
  const res = await fetch(`${API_URL}/admin/curricula/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("อัปเดตหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumDTO;
}

export async function deleteCurriculum(id: number) {
  const res = await fetch(`${API_URL}/admin/curricula/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("ลบหลักสูตรไม่สำเร็จ");
  }
  return true;
}

export async function fetchCurriculumSummary() {
  const res = await fetch(`${API_URL}/admin/curricula/summary`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("โหลดสรุปข้อมูลหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumSummaryDTO;
}

// --------------------- Selection / Calendar ---------------------

export async function toggleSelectionAPI(userId: number, curriculumId: number) {
  const res = await fetch(`${API_URL}/selections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ user_id: userId, curriculum_id: curriculumId }),
  });
  if (!res.ok) throw new Error("Failed to toggle selection");
  return await res.json();
}

// ✅ แก้ไขฟังก์ชันนี้ให้ Map ข้อมูลออกมาถูกต้อง
export async function fetchMySelections(userId: number): Promise<CurriculumDTO[]> {
  const res = await fetch(`${API_URL}/selections?user_id=${userId}`, {
    cache: "no-store", // ✅ เพิ่มตรงนี้ด้วย
  });
  
  if (!res.ok) throw new Error("Failed to fetch selections");
  
  const json = await res.json();
  
  if (json.data && Array.isArray(json.data)) {
    return json.data
      .filter((s: any) => s.curriculum || s.Curriculum) // กรองตัวที่ไม่มีข้อมูลวิชา
      .map((s: any) => {
        // ดึง curriculum ออกมา (รองรับทั้งตัวเล็กตัวใหญ่จาก GORM)
        const rawCurriculum = s.curriculum ?? s.Curriculum;
        
        // สำคัญ: ต้อง normalize เหมือนตอน fetch ปกติ เพื่อให้ field id, application_period ฯลฯ ครบ
        return {
          ...normalizeCurriculum(rawCurriculum),
          is_notified: s.is_notified ?? s.IsNotified ?? false // Map ค่าตรงนี้
        };
      }) as CurriculumDTO[];
  }
  
  return [];
}
// กดกระดิ่ง
export async function toggleNotificationAPI(userId: number, curriculumId: number) {
  const res = await fetch(`${API_URL}/selections/notify`, { // แก้ path ตาม router ที่ตั้ง
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, curriculum_id: curriculumId }),
  });
  if (!res.ok) throw new Error("Failed");
  return await res.json();
}

// อัปเดตคำแนะนำหลักสูตร
export async function updateCurriculumRecommendation(
  curriculumId: number,
  recommendation: string
) {
  const res = await fetch(`${API_URL}/curricula/${curriculumId}/recommendation`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ recommendation }),
  });

  if (!res.ok) {
    throw new Error("อัปเดตคำแนะนำไม่สำเร็จ");
  }

  const json = await res.json();
  return normalizeCurriculum(json.data);
}

// ดึงข้อความแจ้งเตือน (Polling)
export async function fetchNotificationsAPI(userId: number) {
  const res = await fetch(`${API_URL}/notifications?user_id=${userId}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}
export async function markNotificationReadAPI(notiId: number) {
  try {
    await fetch(`${API_URL}/notifications/${notiId}/read`, {
      method: "PATCH",
    });
  } catch (error) {
    console.error("Failed to mark notification as read", error);
  }
}
// ✅ เพิ่ม type สำหรับข้อมูลสถิติ
export interface StatsDTO {
  faculty_stats: { name: string; value: number }[];
  program_stats: { name: string; value: number; group_name: string }[];
}

// ✅ เพิ่มฟังก์ชันดึงสถิติ
export async function fetchSelectionStats() {
  const res = await fetch(`${API_URL}/admin/curricula/stats`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // ส่ง Token ด้วยถ้ามีการ Login
    },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}