"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiEducation,
  HttpError,
  fetchMyProfile,
  upsertEducation,
} from "@/services/profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// =============================================================================
// Types
// =============================================================================

type Option = { id: number; name: string };
type SchoolOption = Option & {
  is_project_based?: boolean | null;
  school_type_id?: number | null;
};

// =============================================================================
// Helper Functions
// =============================================================================

const pickArrayFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractId = (item: any): number | null => {
  const id = item?.id ?? item?.ID;
  if (id !== undefined && id !== null) {
    const num = Number(id);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
};

const extractName = (item: any): string | null => {
  const name = item?.name ?? item?.Name;
  return name ? String(name).trim() : null;
};

const normalizeOptions = (items: any[]): Option[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const id = extractId(item);
      const name = extractName(item);
      if (id === null || !name) return null;
      return { id, name };
    })
    .filter((item): item is Option => item !== null);
};

const coerceId = (value: any): number | null => {
  if (value === null || value === undefined || value === "" || value === 0) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// =============================================================================
// Icons
// =============================================================================

const BookOpenIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// =============================================================================
// Main Component
// =============================================================================

export default function EditEducationPage() {
  const router = useRouter();
  
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    education_level_id: null as number | null,
    school_id: null as number | null,
    school_name: "",
    school_type_id: null as number | null,
    curriculum_type_id: null as number | null,
    is_project_based: null as boolean | null,
    graduation_year: null as number | null,
    status: "current",
  });

  // Reference data
  const [educationLevels, setEducationLevels] = useState<Option[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<Option[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<Option[]>([]);
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<Option[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  // Search states
  const [schoolQuery, setSchoolQuery] = useState("");
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [curriculumQuery, setCurriculumQuery] = useState("");
  const [showCurriculumList, setShowCurriculumList] = useState(false);

  // ---------------------------------------------------------------------------
  // Load Initial Data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) {
      router.replace("/login");
      return;
    }
    setToken(authToken);

    Promise.all([fetchMyProfile(authToken), loadReference(authToken)])
      .then(([profile]) => {
        setFromEducation(profile.education);
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  // ---------------------------------------------------------------------------
  // Load Reference Data
  // ---------------------------------------------------------------------------
  const loadReference = async (authToken: string) => {
    const headers = { Authorization: `Bearer ${authToken}` };
    try {
      const [levelsRes, schoolTypesRes, curriculumRes] = await Promise.all([
        fetch(`${API_URL}/reference/education-levels`, { headers }),
        fetch(`${API_URL}/reference/school-types`, { headers }),
        fetch(`${API_URL}/reference/curriculum-types`, { headers }),
      ]);

      const [levelsData, schoolTypeData, curriculumData] = await Promise.all([
        levelsRes.json(),
        schoolTypesRes.json(),
        curriculumRes.json(),
      ]);

      setEducationLevels(normalizeOptions(pickArrayFromResponse(levelsData)));
      setSchoolTypes(normalizeOptions(pickArrayFromResponse(schoolTypeData)));
      setCurriculumTypes(normalizeOptions(pickArrayFromResponse(curriculumData)));
    } catch (error) {
      console.error("Failed to load reference data:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Fetch Schools
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "30" });
    if (schoolQuery.trim()) params.set("search", schoolQuery.trim());
    if (form.school_type_id !== null) {
      params.set("school_type_id", String(form.school_type_id));
    }

    fetch(`${API_URL}/reference/schools?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const items = pickArrayFromResponse(data);
        const validSchools: SchoolOption[] = items
          .map((s: any): SchoolOption | null => {
            const id = extractId(s);
            const name = extractName(s);
            if (id === null || name === null) return null;
            return {
              id,
              name,
              is_project_based: s.is_project_based ?? s.IsProjectBased ?? null,
              school_type_id: coerceId(s.school_type_id ?? s.SchoolTypeID),
            };
          })
          .filter((s): s is SchoolOption => s !== null);
        setSchools(validSchools);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [token, schoolQuery, form.school_type_id]);

  // ---------------------------------------------------------------------------
  // Filter Allowed School Types
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (educationLevels.length === 0 || schoolTypes.length === 0) return;

    const levelName = educationLevels.find((l) => l.id === form.education_level_id)?.name || "";
    const matchTypes = (names: string[]) =>
      schoolTypes.filter((t) => names.some((n) => t.name.includes(n) || n.includes(t.name)));

    let filtered: Option[] = [...schoolTypes];

    if (levelName.includes("GED")) {
      filtered = matchTypes(["โรงเรียนนานาชาติ", "ต่างประเทศ", "Homeschool", "โรงเรียนเอกชน", "อื่นๆ"]);
    } else if (levelName.includes("อาชีวศึกษา") || levelName.includes("ปวช") || levelName.includes("ปวส")) {
      filtered = matchTypes(["อาชีวศึกษา", "วิทยาลัย", "เทคนิค", "โรงเรียนรัฐบาล", "โรงเรียนเอกชน", "อื่นๆ"]);
    } else if (levelName.includes("มัธยมศึกษาตอนปลาย")) {
      filtered = matchTypes(["โรงเรียนรัฐบาล", "โรงเรียนเอกชน", "โรงเรียนสาธิต", "โรงเรียนนานาชาติ", "กศน.", "อื่นๆ"]);
    }

    setAllowedSchoolTypes(filtered.length > 0 ? filtered : schoolTypes);
  }, [educationLevels, form.education_level_id, schoolTypes]);

  // ---------------------------------------------------------------------------
  // Sync Curriculum Query
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const selected = curriculumTypes.find((c) => c.id === form.curriculum_type_id);
    if (selected) setCurriculumQuery(selected.name);
  }, [curriculumTypes, form.curriculum_type_id]);

  // ---------------------------------------------------------------------------
  // Set Form from Education Data
  // ---------------------------------------------------------------------------
  const setFromEducation = (education?: ApiEducation) => {
    if (!education) {
      setForm({
        education_level_id: null,
        school_id: null,
        school_name: "",
        school_type_id: null,
        curriculum_type_id: null,
        is_project_based: null,
        graduation_year: null,
        status: "current",
      });
      setSchoolQuery("");
      setCurriculumQuery("");
      return;
    }

    const levelId = coerceId(education.education_level_id) ?? coerceId(education.education_level?.id);
    const schoolId = coerceId(education.school_id);
    const schoolTypeId = coerceId(education.school_type_id) ?? coerceId(education.school_type?.id);
    const curriculumTypeId = coerceId(education.curriculum_type_id) ?? coerceId(education.curriculum_type?.id);

    setForm({
      education_level_id: levelId,
      school_id: schoolId,
      school_name: education.school?.name || education.school_name || "",
      school_type_id: schoolTypeId,
      curriculum_type_id: curriculumTypeId,
      is_project_based: education.is_project_based ?? null,
      graduation_year: education.graduation_year ?? null,
      status: education.status || "current",
    });

    setSchoolQuery(education.school?.name || education.school_name || "");
    if (education.curriculum_type?.name) setCurriculumQuery(education.curriculum_type.name);
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleEducationLevelChange = (value: number | null) => {
    setForm((prev) => ({
      ...prev,
      education_level_id: value,
      school_type_id: null,
      school_id: null,
      school_name: "",
      is_project_based: null,
      curriculum_type_id: null,
    }));
    setSchoolQuery("");
    setShowSchoolList(false);
    setCurriculumQuery("");
  };

  const handleSchoolTypeChange = (value: number | null) => {
    setForm((prev) => ({
      ...prev,
      school_type_id: value,
      school_id: null,
      school_name: "",
      is_project_based: null,
      curriculum_type_id: null,
    }));
    setSchoolQuery("");
    setShowSchoolList(false);
    setCurriculumQuery("");
  };

  const handleSchoolChange = (value: string) => {
    setSchoolQuery(value);
    setForm((prev) => ({
      ...prev,
      school_name: value,
      school_id: null,
      curriculum_type_id: null,
    }));
    setShowSchoolList(true);
    setCurriculumQuery("");
  };

  const handleSelectSchool = (school: SchoolOption) => {
    setForm((prev) => ({
      ...prev,
      school_id: school.id,
      school_name: school.name,
      is_project_based: school.is_project_based ?? prev.is_project_based,
      school_type_id: school.school_type_id ?? prev.school_type_id,
      curriculum_type_id: null,
    }));
    setSchoolQuery(school.name);
    setShowSchoolList(false);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.school_name;
      return updated;
    });
    setCurriculumQuery("");
  };

  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    const matched = curriculumTypes.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
    setForm((prev) => ({ ...prev, curriculum_type_id: matched ? matched.id : null }));
    setShowCurriculumList(true);
  };

  const handleSelectCurriculum = (curriculum: Option) => {
    setForm((prev) => ({ ...prev, curriculum_type_id: curriculum.id }));
    setCurriculumQuery(curriculum.name);
    setShowCurriculumList(false);
  };

  // ---------------------------------------------------------------------------
  // Filtered Lists
  // ---------------------------------------------------------------------------
  const filteredSchools = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    return schools.filter((s) => {
      const matchesName = query ? s.name.toLowerCase().includes(query) : true;
      const matchesType = form.school_type_id !== null ? s.school_type_id === form.school_type_id : true;
      return matchesName && matchesType;
    });
  }, [form.school_type_id, schoolQuery, schools]);

  const filteredCurriculums = useMemo(() => {
    const query = curriculumQuery.trim().toLowerCase();
    return curriculumTypes.filter((c) => c.name.toLowerCase().includes(query));
  }, [curriculumQuery, curriculumTypes]);

  // ---------------------------------------------------------------------------
  // Validation & Submit
  // ---------------------------------------------------------------------------
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.education_level_id) newErrors.education_level_id = "กรุณาเลือกระดับการศึกษา";
    if (!form.school_id && !form.school_name.trim()) newErrors.school_name = "กรุณาเลือกหรือกรอกชื่อสถานศึกษา";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return false;
    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !token) return;

    setSaving(true);
    try {
      const payload = {
        education_level_id: form.education_level_id ?? 0,
        school_id: form.school_id ?? null,
        school_name: form.school_id ? undefined : form.school_name.trim(),
        school_type_id: form.school_type_id ?? null,
        curriculum_type_id: form.curriculum_type_id ?? null,
        is_project_based: form.is_project_based,
        graduation_year: form.graduation_year || undefined,
        status: form.status,
      };

      await upsertEducation(token, payload);
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลการศึกษาได้");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------
  const isSchoolTypeEnabled = form.education_level_id !== null;
  const isSchoolEnabled = form.school_type_id !== null;
  const isCurriculumEnabled = form.school_id !== null || form.school_name.trim() !== "";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">แก้ไขข้อมูลการศึกษา</h1>
              <p className="mt-1 text-orange-100 text-sm">อัปเดตข้อมูลการศึกษาของคุณ</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Step 1: Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold mr-2">1</span>
                ระดับการศึกษา <span className="text-red-500">*</span>
              </label>
              <select
                value={form.education_level_id ?? ""}
                title="เลือกระดับการศึกษา"
                aria-label="ระดับการศึกษา"
                onChange={(e) => handleEducationLevelChange(coerceId(e.target.value))}
                className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                  errors.education_level_id ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                }`}
              >
                <option value="">เลือกระดับการศึกษา</option>
                {educationLevels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
              {errors.education_level_id && <p className="text-sm text-red-500 mt-1">{errors.education_level_id}</p>}
            </div>

            {/* Step 2: School Type */}
            <div className={!isSchoolTypeEnabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                  isSchoolTypeEnabled ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                }`}>2</span>
                ประเภทโรงเรียน
              </label>
              <select
                value={form.school_type_id ?? ""}
                title="เลือกประเภทโรงเรียน"
                aria-label="ประเภทโรงเรียน"
                onChange={(e) => handleSchoolTypeChange(coerceId(e.target.value))}
                disabled={!isSchoolTypeEnabled}
                className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                  !isSchoolTypeEnabled
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 focus:border-orange-500"
                }`}
              >
                <option value="">เลือกประเภทโรงเรียน</option>
                {allowedSchoolTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {!isSchoolTypeEnabled && (
                <p className="text-xs text-gray-400 mt-1">กรุณาเลือกระดับการศึกษาก่อน</p>
              )}
            </div>

            {/* Step 3: School */}
            <div className={!isSchoolEnabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                  isSchoolEnabled ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                }`}>3</span>
                โรงเรียน / สถาบัน <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolQuery}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  onFocus={() => setShowSchoolList(true)}
                  onBlur={() => setTimeout(() => setShowSchoolList(false), 200)}
                  disabled={!isSchoolEnabled}
                  className={`w-full py-3 px-4 rounded-xl border-2 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                    !isSchoolEnabled
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : errors.school_name
                        ? "border-red-400 bg-red-50 text-gray-900"
                        : "border-gray-200 focus:border-orange-500 text-gray-900"
                  }`}
                  placeholder="ค้นหาชื่อโรงเรียน..."
                  autoComplete="off"
                />
                {showSchoolList && filteredSchools.length > 0 && isSchoolEnabled && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                    {filteredSchools.map((school, idx) => (
                      <button
                        type="button"
                        key={`school-${school.id}-${idx}`}
                        onMouseDown={() => handleSelectSchool(school)}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                      >
                        {school.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isSchoolEnabled ? (
                <p className="text-xs text-gray-500 mt-1">ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">กรุณาเลือกประเภทโรงเรียนก่อน</p>
              )}
              {errors.school_name && <p className="text-sm text-red-500 mt-1">{errors.school_name}</p>}
            </div>

            {/* Step 4: Curriculum */}
            {filteredCurriculums.length > 0 && (
              <div className={!isCurriculumEnabled ? "opacity-50 pointer-events-none" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                    isCurriculumEnabled ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}>4</span>
                  หลักสูตร
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={curriculumQuery}
                    onChange={(e) => handleCurriculumChange(e.target.value)}
                    onFocus={() => setShowCurriculumList(true)}
                    onBlur={() => setTimeout(() => setShowCurriculumList(false), 200)}
                    disabled={!isCurriculumEnabled}
                    className={`w-full py-3 px-4 rounded-xl border-2 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                      !isCurriculumEnabled
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 focus:border-orange-500 text-gray-900"
                    }`}
                    placeholder="ค้นหาหลักสูตร..."
                    autoComplete="off"
                  />
                  {showCurriculumList && filteredCurriculums.length > 0 && isCurriculumEnabled && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                      {filteredCurriculums.map((curriculum) => (
                        <button
                          type="button"
                          key={curriculum.id}
                          onMouseDown={() => handleSelectCurriculum(curriculum)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                        >
                          {curriculum.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!isCurriculumEnabled && (
                  <p className="text-xs text-gray-400 mt-1">กรุณาเลือกโรงเรียนก่อน</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/student/profile")}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}