"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ApiUser,
  ProfileResponse,
  fetchUserProfileByTeacher,
  fetchUsers,
  HttpError,
} from "@/services/profile";
import { getIDTypeName, getUserTypeName } from "@/services/user";

type DetailSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

type InfoItem = { label: string; value: React.ReactNode };

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

const formatScore = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toFixed(2);
};

const getUserId = (user?: ApiUser | null): number | null => {
  if (!user) return null;
  const rawId =
    user.id ??
    (user as { ID?: number | string }).ID ??
    (user as { user_id?: number | string }).user_id;
  const id = Number(rawId);
  return Number.isFinite(id) ? id : null;
};

const fullName = (user?: ApiUser | null) => {
  if (!user) return "-";
  const thai = `${user.first_name_th || ""} ${user.last_name_th || ""}`.trim();
  const english = `${user.first_name_en || ""} ${user.last_name_en || ""}`.trim();
  if (thai) return thai;
  if (english) return english;
  return user.email || "-";
};

function DetailSection({ title, description, children }: DetailSectionProps) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-orange-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {description ? <p className="text-xs text-gray-500">{description}</p> : null}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3">
          <div className="text-xs text-gray-500">{item.label}</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{item.value ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ user }: { user?: ApiUser | null }) {
  const initials = useMemo(() => {
    if (!user) return "?";
    const thai = `${user.first_name_th || ""}${user.last_name_th || ""}`.trim();
    if (thai) return thai.slice(0, 2).toUpperCase();
    const english = `${user.first_name_en || ""}${user.last_name_en || ""}`.trim();
    if (english) return english.slice(0, 2).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "?";
  }, [user]);

  if (user?.profile_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profile_image_url}
        alt={fullName(user)}
        className="h-12 w-12 rounded-full object-cover border border-orange-200"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold">
      {initials}
    </div>
  );
}

export default function TeacherStudentProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  const [students, setStudents] = useState<ApiUser[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // --- Auth guard ---
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!storedToken || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 2) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      const displayName =
        user.first_name_th && user.last_name_th
          ? `${user.first_name_th} ${user.last_name_th}`
          : `${user.first_name_en || ""} ${user.last_name_en || ""}`.trim();
      setTeacherName(displayName || "Teacher");
      setToken(storedToken);
      setIsAuthorized(true);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  // --- Load students list ---
  useEffect(() => {
    if (!token || !isAuthorized) return;

    const load = async () => {
      setLoadingList(true);
      setListError(null);
      try {
        const users = await fetchUsers(token);
        const studentOnly = users.filter((u) => {
          // แก้ไข: ลบ u.user_type?.ID ออกเพราะ ApiUserType ไม่มี property ID
          const typeId = Number(u.type_id ?? u.user_type?.id ?? 0);
          return typeId === 1;
        });
        setStudents(studentOnly);
        setFilteredStudents(studentOnly);

        if (studentOnly.length) {
          const firstId = getUserId(studentOnly[0]);
          if (firstId) setSelectedStudentId(firstId);
        } else {
          setSelectedStudentId(null);
          setProfile(null);
        }
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        const message = err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อนักเรียนได้";
        setListError(message);
        toast.error(message);
      } finally {
        setLoadingList(false);
      }
    };

    load();
  }, [token, isAuthorized, router]);

  // --- Filter list ---
  useEffect(() => {
    if (!search.trim()) {
      setFilteredStudents(students);
      return;
    }
    const query = search.toLowerCase();
    const result = students.filter((u) => {
      const fields = [
        u.first_name_th,
        u.last_name_th,
        u.first_name_en,
        u.last_name_en,
        u.email,
        u.phone,
        u.id_number,
      ];
      return fields.some((field) => field?.toLowerCase().includes(query));
    });
    setFilteredStudents(result);
  }, [search, students]);

  // --- Auto-select when filter changes ---
  useEffect(() => {
    if (!filteredStudents.length) {
      setSelectedStudentId(null);
      setProfile(null);
      return;
    }
    const exists = filteredStudents.some((u) => getUserId(u) === selectedStudentId);
    if (!exists) {
      const nextId = getUserId(filteredStudents[0]);
      if (nextId) setSelectedStudentId(nextId);
    }
  }, [filteredStudents, selectedStudentId]);

  // --- Load selected student profile ---
  useEffect(() => {
    if (!token || !selectedStudentId) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await fetchUserProfileByTeacher(token, selectedStudentId);
        setProfile(data);
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        const message = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลนักเรียนได้";
        toast.error(message);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [token, selectedStudentId, router]);

  const selectedUser = useMemo(() => {
    return filteredStudents.find((u) => getUserId(u) === selectedStudentId) || null;
  }, [filteredStudents, selectedStudentId]);

  // Helpers to determine which sections to show and to clean up empty items
  const isThaiStudent = (p: ProfileResponse | null) => {
    if (!p || !p.user) return false;
    const u = p.user as any;
    return (
      (u.nationality && String(u.nationality).toLowerCase().includes("thai")) ||
      (u.country && String(u.country).toLowerCase().includes("thailand")) ||
      (u.country_code && String(u.country_code).toUpperCase() === "TH")
    );
  };

  const hasGedData = (p: ProfileResponse | null) => {
    return !!(p && p.ged_score && (p.ged_score.total_score !== null && p.ged_score.total_score !== undefined));
  };

  const filterEmptyItems = (items: InfoItem[]) => items.filter((it) => it.value !== null && it.value !== undefined && it.value !== "-");

  if (!isAuthorized) return null;

  const personalItems: InfoItem[] = [
    { label: "ชื่อ (ไทย)", value: profile?.user?.first_name_th || "-" },
    { label: "นามสกุล (ไทย)", value: profile?.user?.last_name_th || "-" },
    { label: "ชื่อ (อังกฤษ)", value: profile?.user?.first_name_en || "-" },
    { label: "นามสกุล (อังกฤษ)", value: profile?.user?.last_name_en || "-" },
    { label: "อีเมล", value: profile?.user?.email || "-" },
    { label: "เบอร์โทรศัพท์", value: profile?.user?.phone || "-" },
    {
      label: "ประเภทเอกสารยืนยันตัวตน",
      value: getIDTypeName(
        Number(profile?.user?.id_type ?? profile?.user?.id_doc_type_id ?? profile?.user?.user_id_type?.id)
      ),
    },
    { label: "เลขที่เอกสาร", value: profile?.user?.id_number || "-" },
    { label: "วันเกิด", value: formatDate(profile?.user?.birthday) },
    {
      label: "สถานะ PDPA",
      value: profile?.user?.pdpa_consent
        ? `ยินยอมแล้ว (${profile?.user?.pdpa_consent_at ? formatDate(profile.user.pdpa_consent_at) : "ไม่ระบุวัน"})`
        : "ยังไม่ยืนยัน",
    },
    {
      label: "ประเภทผู้ใช้",
      // แก้ไข: ลบ profile?.user?.user_type?.ID ออกเพราะ ApiUserType ไม่มี property ID
      value: getUserTypeName(
        Number(profile?.user?.type_id ?? profile?.user?.user_type?.id ?? 0)
      ),
    },
    {
      label: "สถานะโปรไฟล์",
      value: profile?.user?.profile_completed ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
          ● ครบถ้วน
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
          ● ยังไม่ครบ
        </span>
      ),
    },
  ];

  const educationItems: InfoItem[] = [
    { label: "ระดับการศึกษา", value: profile?.education?.education_level?.name || "-" },
    { label: "ประเภทโรงเรียน", value: profile?.education?.school_type?.name || "-" },
    { label: "สถานศึกษา", value: profile?.education?.school?.name || profile?.education?.school_name || "-" },
    { label: "หลักสูตร", value: profile?.education?.curriculum_type?.name || "-" },
    {
      label: "Project-based",
      value:
        profile?.education?.is_project_based === null || profile?.education?.is_project_based === undefined
          ? "-"
          : profile?.education?.is_project_based
          ? "ใช่"
          : "ไม่ใช่",
    },
    { label: "สถานะ", value: profile?.education?.status || "-" },
    { label: "ปีจบการศึกษา", value: profile?.education?.graduation_year ?? "-" },
  ];

  const academicItems: InfoItem[] = [
    { label: "GPAX", value: formatScore(profile?.academic_score?.gpax) },
    { label: "จำนวนเทอม", value: profile?.academic_score?.gpax_semesters ?? "-" },
    { label: "GPA คณิตศาสตร์", value: formatScore(profile?.academic_score?.gpa_math) },
    { label: "GPA วิทยาศาสตร์", value: formatScore(profile?.academic_score?.gpa_science) },
    { label: "GPA ภาษาไทย", value: formatScore(profile?.academic_score?.gpa_thai) },
    { label: "GPA ภาษาอังกฤษ", value: formatScore(profile?.academic_score?.gpa_english) },
    { label: "GPA สังคมศึกษา", value: formatScore(profile?.academic_score?.gpa_social) },
    {
      label: "ไฟล์ Transcript",
      value: profile?.academic_score?.transcript_file_path ? (
        <a
          href={profile.academic_score.transcript_file_path}
          target="_blank"
          rel="noreferrer"
          className="text-orange-600 hover:underline"
        >
          เปิดไฟล์
        </a>
      ) : (
        "-"
      ),
    },
  ];

  const gedItems: InfoItem[] = [
    { label: "คะแนนรวม", value: formatScore(profile?.ged_score?.total_score) },
    { label: "RLA", value: formatScore(profile?.ged_score?.rla_score) },
    { label: "Math", value: formatScore(profile?.ged_score?.math_score) },
    { label: "Science", value: formatScore(profile?.ged_score?.science_score) },
    { label: "Social Studies", value: formatScore(profile?.ged_score?.social_score) },
    {
      label: "ไฟล์ใบรับรอง GED",
      value: profile?.ged_score?.cert_file_path ? (
        <a
          href={profile.ged_score.cert_file_path}
          target="_blank"
          rel="noreferrer"
          className="text-orange-600 hover:underline"
        >
          เปิดไฟล์
        </a>
      ) : (
        "-"
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลนักเรียน</h1>
          <p className="text-sm text-gray-600">
            สวัสดี, <span className="font-semibold text-orange-600">{teacherName}</span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student list sidebar */}
          <div className="lg:col-span-1 flex flex-col rounded-xl border border-orange-100 bg-orange-50/40 shadow-sm max-h-[calc(100vh-10rem)]">
            <div className="p-4 border-b border-orange-100 space-y-3">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
              />
              {listError ? (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{listError}</div>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingList ? (
                <div className="text-center text-sm text-gray-500 py-6">กำลังโหลดรายชื่อนักเรียน...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6">ไม่พบนักเรียน</div>
              ) : (
                filteredStudents.map((student, idx) => {
                  const id = getUserId(student);
                  const isActive = id === selectedStudentId;
                  return (
                    <button
                      key={id ?? `student-${idx}`}
                      type="button"
                      onClick={() => id && setSelectedStudentId(id)}
                      className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                        isActive ? "border-orange-400 bg-white shadow-sm" : "border-transparent bg-white/80 hover:border-orange-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar user={student} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900">{fullName(student)}</p>
                            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-semibold">
                              นักเรียน
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">{student.phone || "-"}</p>
                          {!student.profile_completed && (
                            <span className="inline-block rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-semibold">
                              โปรไฟล์ยังไม่ครบ
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Profile detail */}
          <div className="lg:col-span-2 rounded-xl border border-orange-100 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-orange-100">
              <div>
                <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold">Student Profile</p>
                <h2 className="text-xl font-bold text-gray-900">{fullName(selectedUser)}</h2>
                <p className="text-sm text-gray-500">{selectedUser?.email || "เลือกนักเรียนจากด้านซ้าย"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Avatar user={selectedUser} />
                <div className="text-right text-xs text-gray-600">
                  <div>เอกสาร: {selectedUser?.id_number || "-"}</div>
                  <div>โทร: {selectedUser?.phone || "-"}</div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {loadingProfile ? (
                <div className="text-center text-sm text-gray-500 py-10">กำลังโหลดข้อมูล...</div>
              ) : !profile ? (
                <div className="text-center text-sm text-gray-500 py-10">เลือกนักเรียนเพื่อดูรายละเอียด</div>
              ) : (
                <>
                  {/* Summary card */}
                  <div className="rounded-xl border border-orange-100 bg-white shadow-sm p-5 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-none">
                        <Avatar user={profile.user} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{fullName(profile.user)}</h3>
                        <div className="text-sm text-gray-600">{profile.user?.email || "-"}</div>
                        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700">เอกสาร: {profile.user?.id_number || "-"}</span>
                          <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700">โทร: {profile.user?.phone || "-"}</span>
                          <span className={`px-2 py-1 rounded-full ${profile.user?.profile_completed ? "bg-green-50 border border-green-100 text-green-700" : "bg-amber-50 border border-amber-100 text-amber-700"}`}>
                            {profile.user?.profile_completed ? "โปรไฟล์ครบถ้วน" : "โปรไฟล์ไม่ครบ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailSection title="ข้อมูลส่วนตัว">
                      <InfoGrid items={filterEmptyItems(personalItems)} />
                    </DetailSection>

                    <DetailSection title="ข้อมูลการศึกษา">
                      <InfoGrid items={filterEmptyItems(educationItems)} />
                    </DetailSection>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailSection title="ผลการเรียน (Academic Score)">
                      <InfoGrid items={filterEmptyItems(academicItems)} />
                    </DetailSection>

                    {/* GED: show only when data exists and student is not Thai */}
                    {hasGedData(profile) && !isThaiStudent(profile) ? (
                      <DetailSection title="คะแนน GED">
                        <InfoGrid items={filterEmptyItems(gedItems)} />
                      </DetailSection>
                    ) : null}
                  </div>

                  <DetailSection title="คะแนนภาษา">
                    {profile.language_scores?.length ? (
                      <div className="space-y-3">
                        {profile.language_scores.map((score, idx) => (
                          <div
                            key={score.id ?? idx}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3"
                          >
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {score.test_type} – {score.score ?? "-"} {score.test_level ? `(${score.test_level})` : ""}
                                {score.sat_math ? ` | SAT Math ${score.sat_math}` : ""}
                              </div>
                              {score.cert_file_path ? (
                                <a
                                  href={score.cert_file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-xs text-orange-600 hover:underline"
                                >
                                  เปิดไฟล์แนบ
                                </a>
                              ) : null}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 sm:mt-0">{formatDate(score.test_date)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">ยังไม่มีคะแนนภาษา</p>
                    )}
                  </DetailSection>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}