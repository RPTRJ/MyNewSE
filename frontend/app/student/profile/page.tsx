"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiAcademicScore,
  ApiEducation,
  ApiGEDScore,
  ApiLanguageScore,
  ApiUser,
  HttpError,
  ProfileResponse,
  fetchMyProfile,
} from "@/services/profile";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";

type Option = { id: number; name: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH");
};

const formatScore = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return Number(value).toFixed(2);
};

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noDivider?: boolean;
  icon?: React.ReactNode;
  accentColor?: 'orange' | 'blue' | 'green' | 'purple';
};

function SectionCard({ title, subtitle, action, children, noDivider, icon, accentColor = 'orange' }: SectionCardProps) {
  const accentColors = {
    orange: 'from-orange-500 to-amber-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Accent bar */}
      <div className={`h-1 bg-gradient-to-r ${accentColors[accentColor]}`} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 pt-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentColors[accentColor]} flex items-center justify-center text-white shadow-md`}>
              {icon}
            </div>
          )}
          <div>
            <div className="text-lg font-bold text-gray-900">{title}</div>
            {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
          </div>
        </div>
        {action}
      </div>
      <div className={noDivider ? "mt-4 px-6 pb-6" : "mt-4 border-t border-gray-100"}>{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationLevels, setEducationLevels] = useState<Option[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<Option[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<Option[]>([]);
  const [refsLoaded, setRefsLoaded] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!authToken) {
      setError("กรุณาเข้าสู่ระบบอีกครั้ง");
      router.replace("/login");
      setLoading(false);
      return;
    }

    setToken(authToken);
    fetchMyProfile(authToken)
      .then((data) => {
        setProfile(data);
        setProfileImageUrl(data.user?.profile_image_url);
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const user: ApiUser | undefined = profile?.user;
  const education: ApiEducation | undefined = profile?.education;
  const academic: ApiAcademicScore | undefined = profile?.academic_score;
  const ged: ApiGEDScore | undefined = profile?.ged_score;
  const languageScores: ApiLanguageScore[] = profile?.language_scores || [];

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/reference/education-levels`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setEducationLevels(normalizeOptions(items));
      });

    fetch(`${API_URL}/reference/school-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setSchoolTypes(normalizeOptions(items));
      });

    fetch(`${API_URL}/reference/curriculum-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setCurriculumTypes(items.length ? normalizeOptions(items) : []);
        setRefsLoaded(true);
      })
      .catch(() => {
        setRefsLoaded(true);
      });
  }, [token]);

  const normalizeOptions = (items: any[]): Option[] =>
    items
      .map((item) => {
        const rawId = item?.id;
        const idNum = Number(rawId);
        const id = Number.isFinite(idNum) ? idNum : rawId ?? null;
        const name = item?.name;
        if (id === null || id === undefined || !name) return null;
        return { id, name };
      })
      .filter((item): item is Option => Boolean(item));

  const resolveNameById = (items: Option[], id?: number | null) => {
    if (id === undefined || id === null) return undefined;
    const numericId = Number(id);
    return items.find(
      (item) => String(item.id) === String(id) || (Number.isFinite(numericId) && item.id === numericId)
    )?.name;
  };

  const educationLevelName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.education_level?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(educationLevels, education.education_level_id);
    if (byId) return byId;
    return "-";
  }, [education, educationLevels]);

  const schoolTypeName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.school_type?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(schoolTypes, education.school_type_id);
    return byId || "-";
  }, [education, schoolTypes]);

  const curriculumName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.curriculum_type?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(curriculumTypes, education.curriculum_type_id);
    return byId || "-";
  }, [education, curriculumTypes]);

  const nameLanguage = useMemo(() => {
    if (user?.first_name_th || user?.last_name_th) return "thai";
    if (user?.first_name_en || user?.last_name_en) return "english";
    return "none";
  }, [user]);

  const isGedStudent = useMemo(() => {
    if (!education) return false;
    const combined = `${educationLevelName} ${schoolTypeName}`.toLowerCase();
    return combined.includes("ged");
  }, [education, educationLevelName, schoolTypeName]);

  const missingSections = useMemo(() => {
    const missing: string[] = [];
    if (!education) missing.push("ข้อมูลการศึกษา");
    if (education) {
      if (isGedStudent) {
        if (!ged) missing.push("ข้อมูลคะแนน GED");
      } else if (!academic) {
        missing.push("ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX");
      }
    }
    return missing;
  }, [education, academic, ged, isGedStudent]);

  const educationFields = [
    {
      label: "ระดับการศึกษา",
      value: educationLevelName,
    },
    {
      label: "ประเภทโรงเรียน",
      value: schoolTypeName,
    },
    {
      label: "ชื่อสถานศึกษา",
      value: education?.school?.name || education?.school_name || "-",
    },
    {
      label: "หลักสูตร",
      value: curriculumName,
    },
  ];

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

  if ((error && !refsLoaded) || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-gray-600 mb-6">{error || "ไม่พบข้อมูลผู้ใช้"}</p>
          <button
            onClick={() => router.refresh()}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#hero-pattern)" />
          </svg>
        </div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">โปรไฟล์ของฉัน</h1>
              <p className="text-white text-sm font-medium opacity-90">จัดการข้อมูลส่วนตัวและการศึกษาของคุณ</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white text-sm border border-white/20">
                <span className="text-white/80">สถานะ:</span>{' '}
                <span className="font-bold">{missingSections.length === 0 ? '✓ ข้อมูลครบถ้วน' : `⚠ รอดำเนินการ ${missingSections.length} รายการ`}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 40V20C240 35 480 5 720 20C960 35 1200 5 1440 20V40H0Z" className="fill-orange-50" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {missingSections.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-800 mb-1">ข้อมูลยังไม่ครบถ้วน</h3>
                <p className="text-sm text-amber-700 mb-3">กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน:</p>
                <div className="flex flex-wrap gap-2">
                  {missingSections.map((section) => (
                    <span key={section} className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-sm text-amber-700 border border-amber-200 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info Section - Special Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
                  <p className="text-sm text-gray-500">ข้อมูลพื้นฐานของคุณ</p>
                </div>
              </div>
              <Link 
                href="/student/profile/edit/personal" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไข
              </Link>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <ProfileImageUploader
                  currentImageUrl={profileImageUrl}
                  onImageUpdated={(newUrl) => setProfileImageUrl(newUrl)}
                  hideHelperText
                  showBorder
                />
                <p className="mt-3 text-xs text-gray-500 text-center w-full">คลิกเพื่อเปลี่ยนรูป</p>
              </div>
              
              {/* Personal Details */}
              <div className="flex-1">
                {/* Name Display - Large */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {nameLanguage === "thai" 
                      ? `${user.first_name_th || ""} ${user.last_name_th || ""}`.trim() || "ไม่ระบุชื่อ"
                      : `${user.first_name_en || ""} ${user.last_name_en || ""}`.trim() || "No Name"
                    }
                  </h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nameLanguage === "thai" && (
                    <>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          ชื่อ (ไทย)
                        </div>
                        <div className="font-semibold text-gray-900">{user.first_name_th || "-"}</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          นามสกุล (ไทย)
                        </div>
                        <div className="font-semibold text-gray-900">{user.last_name_th || "-"}</div>
                      </div>
                    </>
                  )}

                  {nameLanguage === "english" && (
                    <>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          First Name
                        </div>
                        <div className="font-semibold text-gray-900">{user.first_name_en || "-"}</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Last Name
                        </div>
                        <div className="font-semibold text-gray-900">{user.last_name_en || "-"}</div>
                      </div>
                    </>
                  )}

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      อีเมล
                    </div>
                    <div className="font-semibold text-gray-900 truncate">{user.email}</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      เบอร์โทรศัพท์
                    </div>
                    <div className="font-semibold text-gray-900">{user.phone || "-"}</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 text-xs text-purple-600 mb-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      วันเกิด
                    </div>
                    <div className="font-semibold text-gray-900">{formatDate(user.birthday)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

{/* Education Info */}
        <SectionCard
          title="ข้อมูลการศึกษา"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          }
          accentColor="blue"
          action={
            <Link 
              href="/student/profile/edit/education" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
            {education ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {educationFields.map((field) => (
                  <div key={field.label} className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-xl p-4 border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1 font-medium">{field.label}</div>
                    <div className="text-gray-900 font-semibold">{field.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-500">ยังไม่มีข้อมูลการศึกษา</p>
                <Link href="/student/profile/edit/education" className="text-blue-500 hover:underline text-sm mt-1 inline-block">
                  + เพิ่มข้อมูล
                </Link>
              </div>
            )}
          </div>
        </SectionCard>

{/* Academic Score */}
        {!isGedStudent && (
          <SectionCard
            title="ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            accentColor="green"
            action={
              <Link 
                href="/student/profile/edit/academic-score" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไข
              </Link>
            }
          >
            <div className="px-6 py-5">
              {academic ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 border border-green-200 col-span-2 sm:col-span-1">
                    <div className="text-xs text-green-700 mb-1 font-medium">GPAX</div>
                    <div className="text-2xl font-bold text-green-800">{formatScore(academic.gpax)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">เทอม</div>
                    <div className="text-lg font-semibold text-gray-900">{academic.gpax_semesters ?? "-"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1">คณิตศาสตร์</div>
                    <div className="text-lg font-semibold text-gray-900">{formatScore(academic.gpa_math)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100">
                    <div className="text-xs text-purple-600 mb-1">วิทยาศาสตร์</div>
                    <div className="text-lg font-semibold text-gray-900">{formatScore(academic.gpa_science)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-100">
                    <div className="text-xs text-orange-600 mb-1">ภาษาไทย</div>
                    <div className="text-lg font-semibold text-gray-900">{formatScore(academic.gpa_thai)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-4 border border-pink-100">
                    <div className="text-xs text-pink-600 mb-1">ภาษาอังกฤษ</div>
                    <div className="text-lg font-semibold text-gray-900">{formatScore(academic.gpa_english)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100">
                    <div className="text-xs text-amber-600 mb-1">สังคมศึกษา</div>
                    <div className="text-lg font-semibold text-gray-900">{formatScore(academic.gpa_social)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500">ยังไม่มีข้อมูลคะแนนหลักสูตรแกนกลาง</p>
                  <Link href="/student/profile/edit/academic-score" className="text-green-500 hover:underline text-sm mt-1 inline-block">
                    + เพิ่มข้อมูล
                  </Link>
                </div>
              )}
            </div>
          </SectionCard>
        )}

{/* GED Score */}
        {isGedStudent && (
          <SectionCard
            title="ข้อมูลคะแนน GED"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            accentColor="purple"
            action={
              <Link 
                href="/student/profile/edit/ged-score" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไข
              </Link>
            }
          >
            <div className="px-6 py-5">
              {ged ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200 col-span-2 sm:col-span-1">
                    <div className="text-xs text-purple-700 mb-1 font-medium">คะแนนรวม</div>
                    <div className="text-2xl font-bold text-purple-800">{ged.total_score ?? "-"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1">Reasoning (RLA)</div>
                    <div className="text-lg font-semibold text-gray-900">{ged.rla_score ?? "-"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-100">
                    <div className="text-xs text-green-600 mb-1">Math</div>
                    <div className="text-lg font-semibold text-gray-900">{ged.math_score ?? "-"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100">
                    <div className="text-xs text-amber-600 mb-1">Science</div>
                    <div className="text-lg font-semibold text-gray-900">{ged.science_score ?? "-"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-4 border border-pink-100">
                    <div className="text-xs text-pink-600 mb-1">Social Studies</div>
                    <div className="text-lg font-semibold text-gray-900">{ged.social_score ?? "-"}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500">ยังไม่มีข้อมูล GED</p>
                  <Link href="/student/profile/edit/ged-score" className="text-purple-500 hover:underline text-sm mt-1 inline-block">
                    + เพิ่มข้อมูล
                  </Link>
                </div>
              )}
            </div>
          </SectionCard>
        )}
{/* Language Scores */}
        <SectionCard
          title="ข้อมูลคะแนนภาษา"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          }
          accentColor="purple"
          action={
            <Link 
              href="/student/profile/edit/language-scores" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
            {languageScores.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languageScores.map((score, idx) => (
                  <div
                    key={score.id || `${score.test_type}-${idx}`}
                    className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
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
                        <div className="text-2xl font-bold text-purple-600">{score.score || "-"}</div>
                        <div className="text-xs text-gray-500">คะแนน</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        ระดับ: <span className="font-medium text-gray-900">{score.test_level || "-"}</span>
                        {score.sat_math !== undefined && score.sat_math !== null && (
                          <> | SAT Math: <span className="font-medium text-gray-900">{score.sat_math}</span></>
                        )}
                      </span>
                      {score.cert_file_path && (
                        <a
                          href={score.cert_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-500 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          ดูใบรับรอง
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-500">ยังไม่มีข้อมูลคะแนนภาษา</p>
                <Link href="/student/profile/edit/language-scores" className="text-purple-500 hover:underline text-sm mt-1 inline-block">
                  + เพิ่มข้อมูล
                </Link>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}