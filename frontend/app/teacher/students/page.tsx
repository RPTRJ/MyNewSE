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
  approveStudentProfile,
  revokeStudentProfileApproval,
} from "@/services/profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Helper function to convert file path to full URL
const getFileUrl = (filePath?: string | null): string | null => {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  // Remove leading slash if present to avoid double slash
  const path = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${API_URL}/${path}`;
};

// ============= Types =============
type DetailSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

type FilterState = {
  search: string;
  studentType: "all" | "thai" | "foreign";
  profileStatus: "all" | "complete" | "incomplete";
  minScore: string;
};

// ============= Utility Functions =============
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

// ดึงชื่อประเภทเอกสารจาก user_id_type.id_name
const getDocTypeName = (profile: ProfileResponse | null): string => {
  if (!profile?.user) return "-";
  
  const idName = profile.user.user_id_type?.id_name;
  if (idName) {
    if (idName === "ID Card") return "บัตรประชาชน";
    return idName;
  }
  
  return "-";
};

// ตรวจสอบว่าเป็นนักเรียนไทยหรือไม่ จาก id_name
const isThaiStudent = (profile: ProfileResponse | null): boolean => {
  if (!profile?.user) return false;
  const idName = profile.user.user_id_type?.id_name;
  return idName === "ID Card";
};

// ตรวจสอบว่ามีข้อมูลคะแนนการศึกษาครบถ้วนหรือไม่
const hasCompleteEducationScore = (profile: ProfileResponse | null): boolean => {
  if (!profile) return false;
  
  const isThai = isThaiStudent(profile);
  
  if (isThai) {
    // นักเรียนไทย - ต้องมี GPAX และ transcript
    const academic = profile.academic_score;
    if (!academic) return false;
    
    const hasGpax = academic.gpax !== null && academic.gpax !== undefined;
    const hasTranscript = !!academic.transcript_file_path;
    
    return hasGpax && hasTranscript;
  } else {
    // นักเรียนต่างชาติ - ต้องมี GED total score และ cert file
    const ged = profile.ged_score;
    if (!ged) return false;
    
    const hasTotal = ged.total_score !== null && ged.total_score !== undefined;
    const hasCert = !!ged.cert_file_path;
    
    return hasTotal && hasCert;
  }
};

// ตรวจสอบว่าโปรไฟล์พร้อมให้อนุมัติหรือไม่
const canBeApproved = (profile: ProfileResponse | null): boolean => {
  if (!profile?.user) return false;
  
  // ต้องมีข้อมูลพื้นฐาน
  const hasBasicInfo = !!(
    (profile.user.first_name_th || profile.user.first_name_en) &&
    profile.user.id_number &&
    profile.user.phone &&
    profile.user.birthday
  );
  
  // ต้องมีข้อมูลการศึกษา
  const hasEducation = !!(
    profile.education?.education_level_id ||
    profile.education?.education_level?.id
  );
  
  // ต้องมีคะแนนการศึกษาและไฟล์ transcript/cert
  const hasScoreWithFile = hasCompleteEducationScore(profile);
  
  return hasBasicInfo && hasEducation && hasScoreWithFile;
};

// ดึงคะแนนหลักของนักเรียน (GPAX หรือ GED Total)
const getMainScore = (profile: ProfileResponse | null): number | null => {
  if (!profile) return null;
  
  if (isThaiStudent(profile)) {
    return profile.academic_score?.gpax ?? null;
  } else {
    return profile.ged_score?.total_score ?? null;
  }
};

// ============= Icons =============
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AcademicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LanguageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen?: boolean }) => (
  <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ============= Components =============
function DetailSection({ title, icon, children }: DetailSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        {icon && <span className="text-orange-500">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "-" || value === "") return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function Avatar({ user, size = "md" }: { user?: ApiUser | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
  };

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
      <img
        src={user.profile_image_url}
        alt={fullName(user)}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-orange-200 ring-offset-2`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold shadow-lg ${sizeClasses[size]}`}>
      {initials}
    </div>
  );
}

function StudentListItem({ 
  student, 
  isActive, 
  onClick, 
  isProfileApproved 
}: { 
  student: ApiUser; 
  isActive: boolean; 
  onClick: () => void;
  isProfileApproved: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/50 scale-[1.02]"
          : "bg-white hover:bg-orange-50 border border-gray-100 hover:border-orange-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar user={student} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold truncate ${isActive ? "text-white" : "text-gray-800"}`}>
              {fullName(student)}
            </p>
            {isProfileApproved ? (
              <span className={`flex-shrink-0 ${isActive ? "text-green-200" : "text-green-500"}`} title="อนุมัติแล้ว">
                <CheckCircleIcon />
              </span>
            ) : (
              <span className={`flex-shrink-0 ${isActive ? "text-amber-200" : "text-amber-500"}`} title="รอการอนุมัติ">
                <ExclamationIcon />
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${isActive ? "text-orange-100" : "text-gray-500"}`}>
            {student.email}
          </p>
        </div>
      </div>
    </button>
  );
}

function ScoreCard({ label, value, isMain = false }: { label: string; value: string; isMain?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${
      isMain 
        ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white" 
        : "bg-gray-50 border border-gray-100"
    }`}>
      <div className={`text-xs mb-1 ${isMain ? "opacity-80" : "text-gray-500"}`}>{label}</div>
      <div className={`text-xl font-bold ${isMain ? "text-white" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}

function LanguageScoreCard({ score }: { score: any }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-orange-200 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
          {score.test_type?.slice(0, 2) || "??"}
        </div>
        <div>
          <div className="font-semibold text-gray-800">{score.test_type || "-"}</div>
          <div className="text-xs text-gray-500">
            {formatDate(score.test_date)}
            {score.test_level && <span className="ml-2 text-orange-600">• {score.test_level}</span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-800">{score.score ?? "-"}</div>
        {score.cert_file_path && (
          <a
            href={getFileUrl(score.cert_file_path) || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
          >
            <FileIcon /> ใบรับรอง
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ============= Main Component =============
export default function TeacherStudentProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [students, setStudents] = useState<ApiUser[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  
  // เก็บ profile ของทุกคนเพื่อใช้ filter
  const [profileCache, setProfileCache] = useState<Map<number, ProfileResponse>>(new Map());

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    studentType: "all",
    profileStatus: "all",
    minScore: "",
  });
  const [showFilters, setShowFilters] = useState(false);

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
          const typeId = Number(u.type_id ?? u.user_type?.id ?? 0);
          return typeId === 1;
        });
        setStudents(studentOnly);

        // Load profiles for all students (for filtering)
        const cache = new Map<number, ProfileResponse>();
        for (const student of studentOnly) {
          const id = getUserId(student);
          if (id) {
            try {
              const p = await fetchUserProfileByTeacher(token, id);
              cache.set(id, p);
            } catch {
              // Skip failed loads
            }
          }
        }
        setProfileCache(cache);

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

  // --- Filter students ---
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const id = getUserId(student);
      const studentProfile = id ? profileCache.get(id) : null;

      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const fields = [
          student.first_name_th,
          student.last_name_th,
          student.first_name_en,
          student.last_name_en,
          student.email,
          student.phone,
          student.id_number,
        ];
        const matches = fields.some((field) => field?.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Student type filter
      if (filters.studentType !== "all" && studentProfile) {
        const isThai = isThaiStudent(studentProfile);
        if (filters.studentType === "thai" && !isThai) return false;
        if (filters.studentType === "foreign" && isThai) return false;
      }

      // Profile status filter (ใช้ profile_completed จาก user)
      if (filters.profileStatus !== "all") {
        const isApproved = studentProfile?.user?.profile_completed ?? false;
        if (filters.profileStatus === "complete" && !isApproved) return false;
        if (filters.profileStatus === "incomplete" && isApproved) return false;
      }

      // Min score filter
      if (filters.minScore.trim() && studentProfile) {
        const minScore = parseFloat(filters.minScore);
        if (!isNaN(minScore)) {
          const score = getMainScore(studentProfile);
          if (score === null || score < minScore) return false;
        }
      }

      return true;
    });
  }, [students, filters, profileCache]);

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

    // Check cache first
    const cached = profileCache.get(selectedStudentId);
    if (cached) {
      setProfile(cached);
      return;
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await fetchUserProfileByTeacher(token, selectedStudentId);
        setProfile(data);
        setProfileCache((prev) => new Map(prev).set(selectedStudentId, data));
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
  }, [token, selectedStudentId, router, profileCache]);

  const selectedUser = useMemo(() => {
    return filteredStudents.find((u) => getUserId(u) === selectedStudentId) || null;
  }, [filteredStudents, selectedStudentId]);

  const hasGedData = (p: ProfileResponse | null) => {
    if (!p?.ged_score) return false;
    return p.ged_score.total_score !== null && p.ged_score.total_score !== undefined;
  };

  const hasAcademicData = (p: ProfileResponse | null) => {
    if (!p?.academic_score) return false;
    return p.academic_score.gpax !== null && p.academic_score.gpax !== undefined;
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      studentType: "all",
      profileStatus: "all",
      minScore: "",
    });
  };

  const hasActiveFilters = filters.studentType !== "all" || filters.profileStatus !== "all" || filters.minScore.trim() !== "";

  // Handle approve/revoke
  const handleApprove = async () => {
    if (!token || !selectedStudentId) return;
    
    setApproving(true);
    try {
      await approveStudentProfile(token, selectedStudentId);
      toast.success("อนุมัติโปรไฟล์สำเร็จ");
      
      // Update cache
      const updated = await fetchUserProfileByTeacher(token, selectedStudentId);
      setProfile(updated);
      setProfileCache((prev) => new Map(prev).set(selectedStudentId, updated));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถอนุมัติโปรไฟล์ได้");
    } finally {
      setApproving(false);
    }
  };

  const handleRevoke = async () => {
    if (!token || !selectedStudentId) return;
    
    setApproving(true);
    try {
      await revokeStudentProfileApproval(token, selectedStudentId);
      toast.success("ยกเลิกการอนุมัติสำเร็จ");
      
      // Update cache
      const updated = await fetchUserProfileByTeacher(token, selectedStudentId);
      setProfile(updated);
      setProfileCache((prev) => new Map(prev).set(selectedStudentId, updated));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถยกเลิกการอนุมัติได้");
    } finally {
      setApproving(false);
    }
  };

  if (!isAuthorized) return null;

  const isThai = isThaiStudent(profile);
  const isProfileApproved = profile?.user?.profile_completed ?? false;
  const profileCanBeApproved = canBeApproved(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลนักเรียน</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Student List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Search & Filters */}
              <div className="p-4 border-b border-gray-100 space-y-3">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหานักเรียน..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-orange-50 text-orange-600"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FilterIcon />
                    ตัวกรอง
                    {hasActiveFilters && (
                      <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                        {[filters.studentType !== "all", filters.profileStatus !== "all", filters.minScore.trim()].filter(Boolean).length}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon isOpen={showFilters} />
                </button>

                {/* Filter Options */}
                {showFilters && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {/* Student Type */}
                    <div>
                      <label htmlFor="filter-student-type" className="block text-xs font-medium text-gray-600 mb-1.5">ประเภทนักเรียน</label>
                      <select
                        id="filter-student-type"
                        title="เลือกประเภทนักเรียน"
                        value={filters.studentType}
                        onChange={(e) => setFilters((f) => ({ ...f, studentType: e.target.value as FilterState["studentType"] }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="thai">นักเรียนไทย (บัตรประชาชน)</option>
                        <option value="foreign">นักเรียนต่างชาติ (G-Code/Passport)</option>
                      </select>
                    </div>

                    {/* Profile Status */}
                    <div>
                      <label htmlFor="filter-profile-status" className="block text-xs font-medium text-gray-600 mb-1.5">สถานะการอนุมัติ</label>
                      <select
                        id="filter-profile-status"
                        title="เลือกสถานะการอนุมัติ"
                        value={filters.profileStatus}
                        onChange={(e) => setFilters((f) => ({ ...f, profileStatus: e.target.value as FilterState["profileStatus"] }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="complete">อนุมัติแล้ว</option>
                        <option value="incomplete">รอการอนุมัติ</option>
                      </select>
                    </div>

                    {/* Min Score */}
                    <div>
                      <label htmlFor="filter-min-score" className="block text-xs font-medium text-gray-600 mb-1.5">
                        คะแนนขั้นต่ำ (GPAX / GED Total)
                      </label>
                      <input
                        id="filter-min-score"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="เช่น 2.50 หรือ 600"
                        value={filters.minScore}
                        onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                )}

                {/* Results count */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>พบ {filteredStudents.length} คน</span>
                  {hasActiveFilters && <span>จากทั้งหมด {students.length} คน</span>}
                </div>

                {listError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {listError}
                  </div>
                )}
              </div>

              {/* Student List */}
              <div className="max-h-[calc(100vh-24rem)] overflow-y-auto p-3 space-y-2">
                {loadingList ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">กำลังโหลด...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon />
                    </div>
                    <p className="text-sm text-gray-500">
                      {hasActiveFilters ? "ไม่พบนักเรียนที่ตรงกับตัวกรอง" : "ไม่พบนักเรียน"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-sm text-orange-500 hover:text-orange-600"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const id = getUserId(student);
                    const isActive = id === selectedStudentId;
                    const studentProfile = id ? profileCache.get(id) : null;
                    const isApproved = studentProfile?.user?.profile_completed ?? false;
                    return (
                      <StudentListItem
                        key={id ?? `student-${idx}`}
                        student={student}
                        isActive={isActive}
                        onClick={() => id && setSelectedStudentId(id)}
                        isProfileApproved={isApproved}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Profile Detail */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {loadingProfile ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !profile ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon />
                </div>
                <p className="text-gray-500">เลือกนักเรียนจากรายการด้านซ้าย</p>
              </div>
            ) : (
              <>
                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* ข้อมูลส่วนตัว */}
                  <DetailSection title="ข้อมูลส่วนตัว" icon={<UserIcon />}>
                    <div className="space-y-1">
                      <InfoRow label="ชื่อ-นามสกุล" value={fullName(selectedUser)} />
                      <InfoRow label="อีเมล" value={profile.user?.email} />
                      <InfoRow label="เบอร์โทรศัพท์" value={profile.user?.phone} />
                      <InfoRow label="ประเภทเอกสาร" value={getDocTypeName(profile)} />
                      <InfoRow label="เลขที่เอกสาร" value={profile.user?.id_number} />
                      <InfoRow label="วันเกิด" value={formatDate(profile.user?.birthday)} />
                      <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">สถานะการอนุมัติ</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isProfileApproved 
                            ? "bg-green-100 text-green-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {isProfileApproved ? <CheckCircleIcon /> : <ExclamationIcon />}
                          {isProfileApproved ? "อนุมัติแล้ว" : "รอการอนุมัติ"}
                        </span>
                      </div>
                    </div>
                  </DetailSection>

                  {/* ข้อมูลการศึกษา */}
                  <DetailSection title="ข้อมูลการศึกษา" icon={<AcademicIcon />}>
                    <div className="space-y-1">
                      <InfoRow label="ระดับการศึกษา" value={profile.education?.education_level?.name} />
                      <InfoRow label="ประเภทโรงเรียน" value={profile.education?.school_type?.name} />
                      <InfoRow label="สถานศึกษา" value={profile.education?.school?.name || profile.education?.school_name} />
                      <InfoRow label="หลักสูตร" value={profile.education?.curriculum_type?.name} />
                    </div>
                  </DetailSection>
                </div>

                {/* ผลการเรียน - แสดงเสมอ */}
                {isThai ? (
                  <DetailSection title="ผลการเรียน (Academic Score)" icon={<ChartIcon />}>
                    {hasAcademicData(profile) ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <ScoreCard label="GPAX" value={formatScore(profile.academic_score?.gpax)} isMain />
                          <ScoreCard label="คณิตศาสตร์" value={formatScore(profile.academic_score?.gpa_math)} />
                          <ScoreCard label="วิทยาศาสตร์" value={formatScore(profile.academic_score?.gpa_science)} />
                          <ScoreCard label="ภาษาไทย" value={formatScore(profile.academic_score?.gpa_thai)} />
                          <ScoreCard label="ภาษาอังกฤษ" value={formatScore(profile.academic_score?.gpa_english)} />
                          <ScoreCard label="สังคมศึกษา" value={formatScore(profile.academic_score?.gpa_social)} />
                        </div>
                        {profile.academic_score?.transcript_file_path ? (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-700 font-medium">มีไฟล์ Transcript แนบแล้ว</span>
                              <a
                                href={getFileUrl(profile.academic_score.transcript_file_path) || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                              >
                                <FileIcon /> ดู Transcript
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center gap-2 text-amber-700 text-sm">
                              <ExclamationIcon />
                              <span>ยังไม่ได้อัพโหลดไฟล์ Transcript</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState icon={<ChartIcon />} message="ยังไม่มีข้อมูลคะแนนการศึกษา" />
                    )}
                  </DetailSection>
                ) : (
                  <DetailSection title="คะแนน GED" icon={<ChartIcon />}>
                    {hasGedData(profile) ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <ScoreCard label="Total" value={formatScore(profile.ged_score?.total_score)} isMain />
                          <ScoreCard label="RLA" value={formatScore(profile.ged_score?.rla_score)} />
                          <ScoreCard label="Math" value={formatScore(profile.ged_score?.math_score)} />
                          <ScoreCard label="Science" value={formatScore(profile.ged_score?.science_score)} />
                          <ScoreCard label="Social" value={formatScore(profile.ged_score?.social_score)} />
                        </div>
                        {profile.ged_score?.cert_file_path ? (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-700 font-medium">มีใบรับรอง GED แนบแล้ว</span>
                              <a
                                href={getFileUrl(profile.ged_score.cert_file_path) || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                              >
                                <FileIcon /> ดูใบรับรอง GED
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center gap-2 text-amber-700 text-sm">
                              <ExclamationIcon />
                              <span>ยังไม่ได้อัพโหลดใบรับรอง GED</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState icon={<ChartIcon />} message="ยังไม่มีข้อมูลคะแนน GED" />
                    )}
                  </DetailSection>
                )}

                {/* คะแนนภาษา */}
                <DetailSection title="คะแนนภาษา" icon={<LanguageIcon />}>
                  {profile.language_scores?.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {profile.language_scores.map((score, idx) => (
                        <LanguageScoreCard key={score.id ?? idx} score={score} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<LanguageIcon />} message="ยังไม่มีข้อมูลคะแนนภาษา" />
                  )}
                </DetailSection>

                {/* Approval Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">การอนุมัติโปรไฟล์</h3>
                  
                  {isProfileApproved ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircleIcon />
                          <span className="font-medium">โปรไฟล์นี้ได้รับการอนุมัติแล้ว</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRevoke}
                        disabled={approving}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {approving ? "กำลังดำเนินการ..." : "ยกเลิกการอนุมัติ"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {profile.user?.first_name_th || profile.user?.first_name_en ? (
                            <span className="text-green-500"><CheckCircleIcon /></span>
                          ) : (
                            <span className="text-gray-300"><CheckCircleIcon /></span>
                          )}
                          <span className="text-sm text-gray-600">ข้อมูลส่วนตัวครบถ้วน</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.education?.education_level_id || profile.education?.education_level?.id ? (
                            <span className="text-green-500"><CheckCircleIcon /></span>
                          ) : (
                            <span className="text-gray-300"><CheckCircleIcon /></span>
                          )}
                          <span className="text-sm text-gray-600">ข้อมูลการศึกษาครบถ้วน</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isThai ? (
                            hasAcademicData(profile) ? (
                              <span className="text-green-500"><CheckCircleIcon /></span>
                            ) : (
                              <span className="text-gray-300"><CheckCircleIcon /></span>
                            )
                          ) : (
                            hasGedData(profile) ? (
                              <span className="text-green-500"><CheckCircleIcon /></span>
                            ) : (
                              <span className="text-gray-300"><CheckCircleIcon /></span>
                            )
                          )}
                          <span className="text-sm text-gray-600">กรอกคะแนนการศึกษา</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isThai ? (
                            profile.academic_score?.transcript_file_path ? (
                              <span className="text-green-500"><CheckCircleIcon /></span>
                            ) : (
                              <span className="text-gray-300"><CheckCircleIcon /></span>
                            )
                          ) : (
                            profile.ged_score?.cert_file_path ? (
                              <span className="text-green-500"><CheckCircleIcon /></span>
                            ) : (
                              <span className="text-gray-300"><CheckCircleIcon /></span>
                            )
                          )}
                          <span className="text-sm text-gray-600">อัพโหลดไฟล์ Transcript/ใบรับรอง</span>
                        </div>
                      </div>

                      {profileCanBeApproved ? (
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={approving}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-200/50 disabled:opacity-50"
                        >
                          {approving ? "กำลังดำเนินการ..." : "✓ อนุมัติโปรไฟล์"}
                        </button>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2 text-amber-700 text-sm">
                            <ExclamationIcon />
                            <span>ไม่สามารถอนุมัติได้ - นักเรียนยังกรอกข้อมูลไม่ครบถ้วน</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}