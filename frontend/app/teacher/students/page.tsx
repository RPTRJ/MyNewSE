"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ApiUser,
  ProfileResponse,
  fetchUserProfileByTeacher,
  fetchUsers,
  HttpError,
} from "@/services/profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ============= Helpers =============
const getFileUrl = (filePath?: string | null): string | null => {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const path = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${API_URL}/${path}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

const formatScore = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value).toFixed(2);
};

const getUserId = (user?: ApiUser | null): number | null => {
  if (!user) return null;
  const rawId = user.id ?? (user as any).ID ?? (user as any).user_id;
  const id = Number(rawId);
  return Number.isFinite(id) ? id : null;
};

const getFullName = (user?: ApiUser | null) => {
  if (!user) return "-";
  const thai = `${user.first_name_th || ""} ${user.last_name_th || ""}`.trim();
  const english = `${user.first_name_en || ""} ${user.last_name_en || ""}`.trim();
  return thai || english || user.email || "-";
};

const getProfileImageUrl = (user?: ApiUser | null): string | null => {
  if (!user?.profile_image_url) return null;
  return getFileUrl(user.profile_image_url);
};

const getInitials = (user?: ApiUser | null): string => {
  if (!user) return "?";
  const name = user.first_name_th || user.first_name_en || user.email || "";
  return name.charAt(0).toUpperCase() || "?";
};

const getDocTypeName = (user?: ApiUser | null): string | null => {
  if (!user) return null;
  const idName = user.user_id_type?.id_name;
  if (idName === "ID Card") return "บัตรประชาชน";
  if (idName) return idName;
  const idTypeId = user.id_type ?? user.id_doc_type_id;
  if (idTypeId === 1) return "บัตรประชาชน";
  if (idTypeId === 2) return "G-Code";
  if (idTypeId === 3) return "Passport";
  return null;
};

// ตรวจสอบว่ามีข้อมูลคะแนนประเภทใด
const hasAcademicScore = (profile: ProfileResponse | null): boolean => {
  if (!profile?.academic_score) return false;
  const s = profile.academic_score;
  // ตรวจสอบว่ามีข้อมูลคะแนนจริงหรือไม่
  return !!(s.gpax || s.gpa_math || s.gpa_science || s.gpa_thai || s.gpa_english || s.gpa_social || s.transcript_file_path);
};

const hasGEDScore = (profile: ProfileResponse | null): boolean => {
  if (!profile?.ged_score) return false;
  const s = profile.ged_score;
  // ตรวจสอบว่ามีข้อมูลคะแนน GED จริงหรือไม่
  return !!(s.total_score || s.rla_score || s.math_score || s.science_score || s.social_score || s.cert_file_path);
};

// ============= Component =============
export default function TeacherStudentsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [students, setStudents] = useState<ApiUser[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Auth
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
      setToken(storedToken);
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Load students
  useEffect(() => {
    if (!token || !isAuthorized) return;
    const load = async () => {
      setLoadingList(true);
      try {
        const users = await fetchUsers(token);
        const studentOnly = users.filter((u) => {
          const typeId = Number(u.type_id ?? u.user_type?.id ?? 0);
          return typeId === 1;
        });
        setStudents(studentOnly);
        if (studentOnly.length) {
          const firstId = getUserId(studentOnly[0]);
          if (firstId) setSelectedStudentId(firstId);
        }
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        toast.error("ไม่สามารถโหลดรายชื่อนักเรียนได้");
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [token, isAuthorized, router]);

  // Load profile
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
        toast.error("ไม่สามารถโหลดข้อมูลนักเรียนได้");
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [token, selectedStudentId, router]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter((s) => {
      const fields = [s.first_name_th, s.last_name_th, s.first_name_en, s.last_name_en, s.email, s.id_number];
      return fields.some((f) => f?.toLowerCase().includes(q));
    });
  }, [students, searchTerm]);

  if (!isAuthorized) return null;

  const showAcademicScore = hasAcademicScore(profile);
  const showGEDScore = hasGEDScore(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลนักเรียน</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="ค้นหานักเรียน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                />
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {loadingList ? (
                  <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : !filteredStudents.length ? (
                  <div className="p-8 text-center text-gray-500">ไม่พบนักเรียน</div>
                ) : (
                  filteredStudents.map((student) => {
                    const id = getUserId(student);
                    const isActive = id === selectedStudentId;
                    const profileImg = getProfileImageUrl(student);
                    const initials = getInitials(student);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => id && setSelectedStudentId(id)}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors flex items-center gap-3 ${
                          isActive ? "bg-orange-50 border-l-4 border-l-orange-500" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          {profileImg ? (
                            <img
                              src={profileImg}
                              alt={getFullName(student)}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              profileImg ? "hidden" : ""
                            } ${isActive ? "bg-orange-500" : "bg-gray-400"}`}
                          >
                            {initials}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{getFullName(student)}</div>
                          <div className="text-sm text-gray-500 truncate">{student.email}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {loadingProfile ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !profile ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
                เลือกนักเรียนจากรายการด้านซ้าย
              </div>
            ) : (
              <div className="space-y-6">
                {/* ข้อมูลส่วนตัว */}
                <Section title="ข้อมูลส่วนตัว">
                  <InfoGrid>
                    <InfoItem label="ชื่อ-นามสกุล" value={getFullName(profile.user)} />
                    <InfoItem label="อีเมล" value={profile.user?.email} />
                    <InfoItem label="เบอร์โทรศัพท์" value={profile.user?.phone} />
                    <InfoItem label="ประเภทเอกสาร" value={getDocTypeName(profile.user)} />
                    <InfoItem label="เลขที่เอกสาร" value={profile.user?.id_number} />
                    <InfoItem label="วันเกิด" value={formatDate(profile.user?.birthday)} />
                  </InfoGrid>
                </Section>

                {/* ข้อมูลการศึกษา */}
                {profile.education && (
                  <Section title="ข้อมูลการศึกษา">
                    <InfoGrid>
                      <InfoItem label="ระดับการศึกษา" value={profile.education.education_level?.name} />
                      <InfoItem label="ประเภทโรงเรียน" value={profile.education.school_type?.name} />
                      <InfoItem label="สถานศึกษา" value={profile.education.school?.name || profile.education.school_name} />
                      <InfoItem label="หลักสูตร" value={profile.education.curriculum_type?.name} />
                    </InfoGrid>
                  </Section>
                )}

                {/* คะแนน - แสดงตามข้อมูลที่มี */}
                {showAcademicScore && profile.academic_score && (
                  <Section title="ผลการเรียน (GPAX)">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                      <ScoreBox label="GPAX" value={formatScore(profile.academic_score.gpax)} highlight />
                      <ScoreBox label="คณิตศาสตร์" value={formatScore(profile.academic_score.gpa_math)} />
                      <ScoreBox label="วิทยาศาสตร์" value={formatScore(profile.academic_score.gpa_science)} />
                      <ScoreBox label="ภาษาไทย" value={formatScore(profile.academic_score.gpa_thai)} />
                      <ScoreBox label="ภาษาอังกฤษ" value={formatScore(profile.academic_score.gpa_english)} />
                      <ScoreBox label="สังคมศึกษา" value={formatScore(profile.academic_score.gpa_social)} />
                    </div>
                    {profile.academic_score.transcript_file_path && (
                      <FileLink href={getFileUrl(profile.academic_score.transcript_file_path)} label="ดู Transcript" />
                    )}
                  </Section>
                )}

                {showGEDScore && profile.ged_score && (
                  <Section title="คะแนน GED">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                      <ScoreBox label="Total" value={formatScore(profile.ged_score.total_score)} highlight />
                      <ScoreBox label="RLA" value={formatScore(profile.ged_score.rla_score)} />
                      <ScoreBox label="Math" value={formatScore(profile.ged_score.math_score)} />
                      <ScoreBox label="Science" value={formatScore(profile.ged_score.science_score)} />
                      <ScoreBox label="Social" value={formatScore(profile.ged_score.social_score)} />
                    </div>
                    {profile.ged_score.cert_file_path && (
                      <FileLink href={getFileUrl(profile.ged_score.cert_file_path)} label="ดูใบรับรอง GED" />
                    )}
                  </Section>
                )}

                {/* คะแนนภาษา */}
                {profile.language_scores && profile.language_scores.length > 0 && (
                  <Section title="คะแนนภาษา">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {profile.language_scores.map((score, idx) => (
                        <div key={score.id ?? idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{score.test_type}</div>
                              <div className="text-sm text-gray-500">
                                {formatDate(score.test_date)}
                                {score.test_level && ` • ${score.test_level}`}
                              </div>
                            </div>
                            <div className="text-xl font-bold text-gray-900">{score.score ?? "-"}</div>
                          </div>
                          {score.cert_file_path && (
                            <div className="mt-2">
                              <FileLink href={getFileUrl(score.cert_file_path)} label="ดูใบรับรอง" small />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= Sub Components =============
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}

function ScoreBox({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className={`text-center p-3 rounded-lg ${highlight ? "bg-orange-100" : "bg-gray-50"}`}>
      <div className={`text-xl font-bold ${highlight ? "text-orange-600" : "text-gray-900"}`}>
        {value ?? "-"}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function FileLink({ href, label, small }: { href: string | null; label: string; small?: boolean }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 ${small ? "text-sm" : ""}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </a>
  );
}