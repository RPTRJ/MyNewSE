const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiIdType = {
  id: number;
  id_name: string;
};

export type ApiUserType = {
  id: number;
  name?: string;
  type_name?: string;
};

export type ApiUser = {
  id: number;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  email: string;
  id_number?: string;
  id_type?: number;
  id_doc_type_id?: number;
  user_id_type?: ApiIdType | null;
  user_type?: ApiUserType | null;
  phone?: string;
  birthday?: string;
  pdpa_consent_at?: string | null;
  profile_image_url?: string;
  profile_completed?: boolean;
  pdpa_consent?: boolean;
  type_id?: number;
};

export type ApiEducation = {
  id?: number;
  education_level_id?: number;
  education_level?: { id: number; name: string };
  school_id?: number | null;
  school?: { id: number; name: string; is_project_based?: boolean | null; school_type_id?: number | null };
  school_name?: string;
  school_type_id?: number | null;
  school_type?: { id: number; name: string };
  curriculum_type_id?: number | null;
  curriculum_type?: { id: number; name: string };
  status?: string;
  graduation_year?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_project_based?: boolean | null;
};

export type ApiAcademicScore = {
  gpax?: number;
  gpax_semesters?: number;
  gpa_math?: number;
  gpa_science?: number;
  gpa_thai?: number;
  gpa_english?: number;
  gpa_social?: number;
  transcript_file_path?: string;
};

export type ApiGEDScore = {
  total_score?: number;
  rla_score?: number;
  math_score?: number;
  science_score?: number;
  social_score?: number;
  cert_file_path?: string;
};

export type ApiLanguageScore = {
  id?: number;
  test_type: string;
  score?: string;
  test_level?: string;
  test_date?: string;
  cert_file_path?: string;
  sat_math?: number | null;
};

export type ProfileResponse = {
  user: ApiUser;
  education?: ApiEducation;
  academic_score?: ApiAcademicScore;
  ged_score?: ApiGEDScore;
  language_scores: ApiLanguageScore[];
};

export type UpdatePersonalPayload = {
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  id_number: string;
  id_type_name: string;
  phone: string;
  birthday: string;
  pdpa_consent: boolean;
};

export type UpsertEducationPayload = {
  education_level_id: number;
  school_id?: number | null;
  school_name?: string;
  school_type_id?: number | null;
  curriculum_type_id?: number | null;
  is_project_based?: boolean | null;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  graduation_year?: number | null;
};

export type UpsertAcademicScorePayload = {
  gpax: number;
  gpax_semesters: number;
  gpa_math: number;
  gpa_science: number;
  gpa_thai: number;
  gpa_english: number;
  gpa_social: number;
  transcript_file_path?: string;
};

export type UpsertGEDScorePayload = {
  total_score: number;
  rla_score: number;
  math_score: number;
  science_score: number;
  social_score: number;
  cert_file_path?: string;
};

export type ReplaceLanguageScoresPayload = {
  items: ApiLanguageScore[];
};

async function authorizedFetch<T>(
  path: string,
  token: string,
  fallbackMessage: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new HttpError(res.status, (data as any)?.error || fallbackMessage);
  }

  return data as T;
}

export async function fetchMyProfile(token: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_URL}/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new HttpError(res.status, data?.error || "Failed to load profile");
  }

  return {
    user: data.user as ApiUser,
    education: data.education as ApiEducation | undefined,
    academic_score: data.academic_score as ApiAcademicScore | undefined,
    ged_score: data.ged_score as ApiGEDScore | undefined,
    language_scores: (data.language_scores as ApiLanguageScore[]) || [],
  };
}

export async function fetchUsers(token: string): Promise<ApiUser[]> {
  const data = await authorizedFetch<{ data?: any[]; items?: any[]; users?: any[] }>(
    "/users",
    token,
    "ไม่สามารถโหลดรายชื่อผู้ใช้ได้",
  );

  const list = data.data || data.items || data.users;
  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    const numericId = Number(item.id ?? item.ID ?? item.user_id ?? 0);
    return {
      ...item,
      id: Number.isFinite(numericId) && numericId > 0 ? numericId : item.id,
    } as ApiUser;
  });
}

export async function fetchUserProfileByAdmin(
  token: string,
  userId: number | string,
): Promise<ProfileResponse> {
  const idNum = Number(userId);
  const safeId = Number.isFinite(idNum) && idNum > 0 ? idNum : userId;
  return authorizedFetch<ProfileResponse>(
    `/admin/users/${safeId}/profile`,
    token,
    "ไม่สามารถโหลดโปรไฟล์ผู้ใช้ได้",
  );
}

//fueng add fetch for teacher
export async function fetchUserProfileByTeacher(
  token: string,
  userId: number | string
): Promise<ProfileResponse> {
  return authorizedFetch<ProfileResponse>(
    `/teacher/users/${userId}/profile`,
    token,
    "ไม่สามารถโหลดโปรไฟล์นักเรียนได้",
  );
}

// For onboarding flow - completes user onboarding with personal info
export async function updatePersonalInfo(token: string, payload: UpdatePersonalPayload): Promise<ApiUser> {
  const data = await authorizedFetch<{ data?: ApiUser; user?: ApiUser }>(
    "/users/me/onboarding",
    token,
    "ไม่สามารถอัปเดตข้อมูลส่วนตัวได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  const user = data.data || data.user;
  if (!user) {
    throw new HttpError(500, "ไม่สามารถโหลดข้อมูลผู้ใช้หลังจากบันทึกได้");
  }
  return user;
}

// For post-onboarding updates - only updates personal info without affecting onboarding status
export type UpdatePersonalInfoPayload = {
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  phone?: string;
  birthday?: string;
};

export async function updatePersonalInfoOnly(token: string, payload: UpdatePersonalInfoPayload): Promise<ApiUser> {
  const data = await authorizedFetch<{ user?: ApiUser }>(
    "/users/me/personal-info",
    token,
    "ไม่สามารถอัปเดตข้อมูลส่วนตัวได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  const user = data.user;
  if (!user) {
    throw new HttpError(500, "ไม่สามารถโหลดข้อมูลผู้ใช้หลังจากบันทึกได้");
  }
  return user;
}

export async function upsertEducation(
  token: string,
  payload: UpsertEducationPayload,
): Promise<ApiEducation> {
  const data = await authorizedFetch<{ education: ApiEducation }>(
    "/users/me/education",
    token,
    "ไม่สามารถบันทึกข้อมูลการศึกษาได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return data.education;
}

export async function upsertAcademicScore(
  token: string,
  payload: UpsertAcademicScorePayload,
): Promise<ApiAcademicScore> {
  const data = await authorizedFetch<{ academic_score: ApiAcademicScore }>(
    "/users/me/academic-score",
    token,
    "ไม่สามารถบันทึกคะแนน GPAX ได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return data.academic_score;
}

export async function upsertGEDScore(
  token: string,
  payload: UpsertGEDScorePayload,
): Promise<ApiGEDScore> {
  const data = await authorizedFetch<{ ged_score: ApiGEDScore }>(
    "/users/me/ged-score",
    token,
    "ไม่สามารถบันทึกคะแนน GED ได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return data.ged_score;
}

export async function replaceLanguageScores(
  token: string,
  payload: ReplaceLanguageScoresPayload,
): Promise<boolean> {
  await authorizedFetch<{ ok: boolean }>(
    "/users/me/language-scores",
    token,
    "ไม่สามารถบันทึกคะแนนภาษาได้",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return true;
}

export async function updateProfileImage(
  token: string,
  profileImageUrl: string
): Promise<ApiUser> {
  const data = await authorizedFetch<{ user: ApiUser }>(
    "/users/me/profile-image",
    token,
    "ไม่สามารถอัพเดตรูปโปรไฟล์ได้",
    {
      method: "PUT",
      body: JSON.stringify({ profile_image_url: profileImageUrl }),
    }
  );

  return data.user;
}
