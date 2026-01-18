"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  type ApiUser,
  type ProfileResponse,
  HttpError,
  fetchUsers,
  fetchUserProfileByTeacher,
  type ApiAcademicScore,
  type ApiGEDScore,
  type ApiLanguageScore,
} from "@/services/profile";

// ============= Helper Functions =============
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Helper function to get file URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // Normalize path: replace backslashes with forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Ensure path starts with /
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  // Return absolute URL
  return `${API_URL}${cleanPath}`;
};

const getUserId = (user: ApiUser): number | null => {
  if (user.id !== undefined && user.id !== null) return Number(user.id);
  return null;
};

const getFullName = (user?: ApiUser): string => {
  if (!user) return "-";
  if (user.first_name_th && user.last_name_th) return `${user.first_name_th} ${user.last_name_th}`;
  if (user.first_name_en && user.last_name_en) return `${user.first_name_en} ${user.last_name_en}`;
  return user.email || "-";
};

const getInitials = (user: ApiUser): string => {
  const name = getFullName(user);
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0]?.toUpperCase() || "?";
};

const getProfileImageUrl = (user: ApiUser): string | null => {
  const url = user.profile_image_url;
  return url ? getFileUrl(url) : null;
};

const getDocTypeName = (user?: ApiUser): string => {
  if (!user?.user_id_type) return "-";
  return user.user_id_type.id_name || "-";
};

const formatDate = (value?: string): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

const formatScore = (value?: number | string | null): string => {
  if (value === undefined || value === null || value === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "-";
};

const hasAcademicScore = (profile: ProfileResponse | null): boolean => {
  if (!profile?.academic_score) return false;
  const s = profile.academic_score;
  return !!(s.gpax || s.gpa_math || s.gpa_science || s.gpa_thai || s.gpa_english || s.gpa_social || s.transcript_file_path);
};

const hasGEDScore = (profile: ProfileResponse | null): boolean => {
  if (!profile?.ged_score) return false;
  const s = profile.ged_score;
  return !!(s.total_score || s.rla_score || s.math_score || s.science_score || s.social_score || s.cert_file_path);
};

// ============= Sub Components =============
function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-white">{icon}</div>}
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="group">
      <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
        {value || "-"}
      </div>
    </div>
  );
}

function ScoreBox({ label, value, highlight, color = "purple" }: { label: string; value: string; highlight?: boolean; color?: string }) {
  const colorClasses = {
    purple: "from-purple-500 to-pink-500 border-purple-200 hover:border-purple-300",
    blue: "from-blue-500 to-cyan-500 border-blue-200 hover:border-blue-300",
    green: "from-green-500 to-emerald-500 border-green-200 hover:border-green-300",
    orange: "from-orange-500 to-red-500 border-orange-200 hover:border-orange-300",
    indigo: "from-indigo-500 to-purple-500 border-indigo-200 hover:border-indigo-300",
    amber: "from-amber-500 to-orange-500 border-amber-200 hover:border-amber-300",
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <div className={`p-5 bg-white border-2 ${gradientClass.split(' ')[2]} ${gradientClass.split(' ')[3]} rounded-xl hover:shadow-lg transition-all duration-300 ${highlight ? "ring-2 ring-offset-2 ring-orange-400" : ""}`}>
      <div className="text-xs text-gray-600 mb-2 font-medium">{label}</div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${gradientClass.split(' ')[0]} ${gradientClass.split(' ')[1]} bg-clip-text text-transparent`}>
        {value}
      </div>
    </div>
  );
}

function FileLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 rounded-xl hover:from-orange-100 hover:to-orange-200 hover:shadow-md transition-all duration-300 font-medium"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </a>
  );
}

// ============= Main Component =============
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ข้อมูลนักเรียน</h1>
              <p className="text-orange-100 text-sm mt-1">จัดการและดูข้อมูลนักเรียนทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar - Student List */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
              {/* Search Bar */}
              <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหานักเรียน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">ทั้งหมด {filteredStudents.length} คน</span>
                  {searchTerm && <span className="text-orange-600 font-medium">กำลังค้นหา...</span>}
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loadingList ? (
                  <div className="p-10 text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mb-3" />
                    <p className="text-sm text-gray-500">กำลังโหลด...</p>
                  </div>
                ) : !filteredStudents.length ? (
                  <div className="p-10 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-gray-500">ไม่พบนักเรียน</p>
                  </div>
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
                        className={`w-full text-left px-5 py-4 border-b border-gray-100 transition-all duration-200 flex items-center gap-4 group relative overflow-hidden ${
                          isActive 
                            ? "bg-gradient-to-r from-orange-50 to-orange-100/50 border-l-4 border-l-orange-500" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Profile Image */}
                        <div className="relative flex-shrink-0">
                          {profileImg ? (
                            <img
                              src={profileImg}
                              alt={getFullName(student)}
                              className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                                isActive ? "border-orange-400 ring-2 ring-orange-200" : "border-gray-200 group-hover:border-orange-300"
                              }`}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all ${
                              isActive 
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg" 
                                : "bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-orange-400 group-hover:to-orange-500"
                            }`}>
                              {initials}
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold truncate transition-colors ${
                            isActive ? "text-orange-900" : "text-gray-900 group-hover:text-orange-700"
                          }`}>
                            {getFullName(student)}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{student.email}</div>
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Content - Student Profile */}
          <div className="lg:col-span-8 xl:col-span-9">
            {loadingProfile ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-16 text-center">
                <div className="inline-block animate-spin w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full mb-4" />
                <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !profile ? (
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-100/50 p-16 text-center">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">เลือกนักเรียน</h3>
                <p className="text-gray-500">กรุณาเลือกนักเรียนจากรายการด้านซ้ายเพื่อดูข้อมูล</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ข้อมูลส่วนตัว */}
                <Section 
                  title="ข้อมูลส่วนตัว"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
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
                  <Section 
                    title="ข้อมูลการศึกษา"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  >
                    <InfoGrid>
                      <InfoItem label="ระดับการศึกษา" value={profile.education.education_level?.name} />
                      <InfoItem label="ประเภทโรงเรียน" value={profile.education.school_type?.name} />
                      <InfoItem label="สถานศึกษา" value={profile.education.school?.name || profile.education.school_name} />
                      <InfoItem label="หลักสูตร" value={profile.education.curriculum_type?.name} />
                    </InfoGrid>
                  </Section>
                )}

                {/* คะแนน GPAX */}
                {showAcademicScore && profile.academic_score && (
                  <Section 
                    title="ผลการเรียน (GPAX)"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                      <ScoreBox label="GPAX" value={formatScore(profile.academic_score.gpax)} highlight color="purple" />
                      <ScoreBox label="คณิตศาสตร์" value={formatScore(profile.academic_score.gpa_math)} color="blue" />
                      <ScoreBox label="วิทยาศาสตร์" value={formatScore(profile.academic_score.gpa_science)} color="green" />
                      <ScoreBox label="ภาษาไทย" value={formatScore(profile.academic_score.gpa_thai)} color="orange" />
                      <ScoreBox label="ภาษาอังกฤษ" value={formatScore(profile.academic_score.gpa_english)} color="indigo" />
                      <ScoreBox label="สังคมศึกษา" value={formatScore(profile.academic_score.gpa_social)} color="amber" />
                    </div>
                    {profile.academic_score.transcript_file_path && (
                      <FileLink href={getFileUrl(profile.academic_score.transcript_file_path)} label="ดู Transcript" />
                    )}
                  </Section>
                )}

                {/* คะแนน GED */}
                {showGEDScore && profile.ged_score && (
                  <Section 
                    title="คะแนน GED"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                      <ScoreBox label="Total" value={formatScore(profile.ged_score.total_score)} highlight color="purple" />
                      <ScoreBox label="RLA" value={formatScore(profile.ged_score.rla_score)} color="blue" />
                      <ScoreBox label="Math" value={formatScore(profile.ged_score.math_score)} color="green" />
                      <ScoreBox label="Science" value={formatScore(profile.ged_score.science_score)} color="orange" />
                      <ScoreBox label="Social" value={formatScore(profile.ged_score.social_score)} color="indigo" />
                    </div>
                    {profile.ged_score.cert_file_path && (
                      <FileLink href={getFileUrl(profile.ged_score.cert_file_path)} label="ดูใบรับรอง GED" />
                    )}
                  </Section>
                )}

                {/* คะแนนภาษา */}
                {profile.language_scores && profile.language_scores.length > 0 && (
                  <Section 
                    title="คะแนนภาษา"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {profile.language_scores.map((score, idx) => (
                        <div
                          key={score.id ?? idx}
                          className="group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-2xl p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                {score.test_type?.substring(0, 2).toUpperCase() || "LA"}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{score.test_type}</div>
                                <div className="text-xs text-gray-500">
                                  {score.test_date ? formatDate(score.test_date) : "ไม่ระบุวันที่"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {score.test_type === "CEFR" 
                                  ? (score.test_level?.split(' ')[0] || score.test_level || "-")
                                  : (score.score || "-")
                                }
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {score.test_type === "CEFR" ? "ระดับ" : "คะแนน"}
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              <span className="font-medium">ระดับ:</span> {score.test_level || "-"}
                              {score.sat_math !== undefined && score.sat_math !== null && (
                                <> | <span className="font-medium">SAT Math:</span> {score.sat_math}</>
                              )}
                            </span>
                            {score.cert_file_path && (
                              <a
                                href={getFileUrl(score.cert_file_path) || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                ดูใบรับรอง
                              </a>
                            )}
                          </div>
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