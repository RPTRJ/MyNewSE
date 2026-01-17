"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchPublicCurricula,
  updateCurriculumRecommendation,
  type CurriculumDTO,
} from "@/services/curriculum";
import {
  fetchCourseGroups,
  fetchCurriculumCourseGroups,
  addCourseGroupToCurriculum,
  removeCourseGroupFromCurriculum,
  updateCurriculumCourseGroup,
  fetchAllSkills,
  type CourseGroupDTO,
  type CurriculumCourseGroupDTO,
  type SkillDTO,
} from "@/services/courseGroup";

// ==================== Icons ====================

const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  School: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Save: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Lightbulb: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  MessageSquare: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ==================== Helper Functions ====================

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    open: { label: "เปิดรับสมัคร", className: "bg-green-100 text-green-700" },
    opening: { label: "กำลังจะเปิด", className: "bg-blue-100 text-blue-700" },
    closed: { label: "ปิดรับสมัคร", className: "bg-gray-100 text-gray-600" },
    published: { label: "เผยแพร่แล้ว", className: "bg-purple-100 text-purple-700" },
  };

  const info = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-600" };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.className}`}>
      {info.label}
    </span>
  );
}

// ==================== Main Component ====================

export default function TeacherCurriculaPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // View state: 'list' | 'detail'
  const [view, setView] = useState<"list" | "detail">("list");

  // Data state
  const [curricula, setCurricula] = useState<CurriculumDTO[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseGroupDTO[]>([]);
  const [allSkills, setAllSkills] = useState<SkillDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Selected curriculum
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumDTO | null>(null);
  const [curriculumCourseGroups, setCurriculumCourseGroups] = useState<CurriculumCourseGroupDTO[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Recommendation state - แค่ 1 block
  const [isEditingRecommendation, setIsEditingRecommendation] = useState(false);
  const [recommendationText, setRecommendationText] = useState("");

  // Modal for adding course groups
  const [showAddCourseGroupModal, setShowAddCourseGroupModal] = useState(false);

  // ✅ NEW: Modal for course group description
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [editingCourseGroupId, setEditingCourseGroupId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");

  // ==================== Auth Guard ====================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Allow teacher (2) and admin (3)
      if (user.type_id !== 2 && user.type_id !== 3) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // ==================== Load Data ====================

  const loadCurricula = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPublicCurricula(search);
      setCurricula(data);
    } catch (err) {
      toast.error("โหลดข้อมูลหลักสูตรไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadCourseGroups = useCallback(async () => {
    try {
      const data = await fetchCourseGroups(true); // Active only
      setCourseGroups(data);
    } catch (err) {
      console.error("โหลดกลุ่มวิชาไม่สำเร็จ:", err);
    }
  }, []);

  const loadAllSkills = useCallback(async () => {
    try {
      const data = await fetchAllSkills();
      setAllSkills(data);
    } catch (err) {
      console.error("โหลดทักษะไม่สำเร็จ:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadCourseGroups();
      loadAllSkills();
    }
  }, [isAuthorized, loadCourseGroups, loadAllSkills]);

  useEffect(() => {
    if (!isAuthorized) return;
    const delayDebounceFn = setTimeout(() => {
      loadCurricula();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, isAuthorized, loadCurricula]);

  // ==================== View Detail ====================

  const openDetail = async (curriculum: CurriculumDTO) => {
    setSelectedCurriculum(curriculum);
    setView("detail");
    setLoadingDetail(true);
    setIsEditingRecommendation(false);
    
    // Load saved recommendation from curriculum description
    setRecommendationText(curriculum.description || "");

    try {
      const groups = await fetchCurriculumCourseGroups(curriculum.id);
      setCurriculumCourseGroups(groups);
    } catch (err) {
      toast.error("โหลดข้อมูลคำแนะนำไม่สำเร็จ");
      setCurriculumCourseGroups([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const backToList = () => {
    setView("list");
    setSelectedCurriculum(null);
    setCurriculumCourseGroups([]);
    setRecommendationText("");
    setIsEditingRecommendation(false);
  };

  // ==================== Manage Recommendations ====================

  const handleEditRecommendation = () => {
    setIsEditingRecommendation(true);
  };

  const handleSaveRecommendation = async () => {
    if (!selectedCurriculum) return;
    
    setSaving(true);
    try {
      await updateCurriculumRecommendation(selectedCurriculum.id, recommendationText);
      // Update local state
      setSelectedCurriculum({
        ...selectedCurriculum,
        description: recommendationText,
      });
      setIsEditingRecommendation(false);
      toast.success("บันทึกคำแนะนำสำเร็จ");
    } catch (err) {
      toast.error("บันทึกคำแนะนำไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRecommendation = () => {
    // Reset to saved value
    setRecommendationText(selectedCurriculum?.description || "");
    setIsEditingRecommendation(false);
  };

  // ==================== Manage Course Groups ====================

  const handleAddCourseGroup = async (courseGroupId: number) => {
    if (!selectedCurriculum) return;

    setSaving(true);
    try {
      const added = await addCourseGroupToCurriculum(selectedCurriculum.id, {
        course_group_id: courseGroupId,
        credit_percentage: 0,
      });
      setCurriculumCourseGroups((prev) => [...prev, added]);
      toast.success("เพิ่มกลุ่มวิชาสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "เพิ่มกลุ่มวิชาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCourseGroup = async (courseGroupId: number) => {
    if (!selectedCurriculum) return;

    if (!confirm("ต้องการลบกลุ่มวิชานี้ออกจากหลักสูตรหรือไม่?")) return;

    setSaving(true);
    try {
      await removeCourseGroupFromCurriculum(selectedCurriculum.id, courseGroupId);
      setCurriculumCourseGroups((prev) =>
        prev.filter((g) => g.course_group_id !== courseGroupId)
      );
      toast.success("ลบกลุ่มวิชาออกจากหลักสูตรสำเร็จ");
    } catch (err) {
      toast.error("ลบกลุ่มวิชาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: Open description modal
  const handleOpenDescriptionModal = (courseGroupId: number, currentDescription: string) => {
    setEditingCourseGroupId(courseGroupId);
    setEditingDescription(currentDescription || "");
    setShowDescriptionModal(true);
  };

  // ✅ NEW: Save description from modal
  const handleSaveDescription = async () => {
    if (!selectedCurriculum || editingCourseGroupId === null) return;

    setSaving(true);
    try {
      await updateCurriculumCourseGroup(selectedCurriculum.id, editingCourseGroupId, {
        course_group_id: editingCourseGroupId,
        description: editingDescription,
      });

      setCurriculumCourseGroups((prev) =>
        prev.map((g) =>
          g.course_group_id === editingCourseGroupId ? { ...g, description: editingDescription } : g
        )
      );
      toast.success("บันทึกคำแนะนำสำเร็จ");
      setShowDescriptionModal(false);
      setEditingCourseGroupId(null);
      setEditingDescription("");
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ==================== Render ====================

  if (!isAuthorized) {
    return null;
  }

  // Available course groups (not yet added to this curriculum)
  const linkedGroupIds = new Set(curriculumCourseGroups.map((g) => g.course_group_id));
  const availableCourseGroups = courseGroups.filter((g) => !linkedGroupIds.has(g.id));

  // ==================== List View ====================
  if (view === "list") {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold text-orange-500">คำแนะนำหลักสูตร</h1>
            <p className="text-gray-600 mt-1">
              เลือกหลักสูตรเพื่อเพิ่มคำแนะนำ กลุ่มวิชา และทักษะที่จำเป็น
            </p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาหลักสูตร..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                aria-label="ค้นหาหลักสูตร"
              />
            </div>
          </div>

          {/* Curricula List */}
          {loading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
          ) : curricula.length === 0 ? (
            <div className="text-center py-10 text-gray-500">ไม่พบหลักสูตร</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      หลักสูตร
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      สำนักวิชา / สาขา
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                      กลุ่มวิชา
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {curricula.map((curriculum) => (
                    <tr key={curriculum.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {curriculum.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {curriculum.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{curriculum.faculty?.name || "-"}</div>
                        <div className="text-gray-400">
                          {curriculum.program?.name || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(curriculum.status || "")}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {(curriculum as any).course_groups?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openDetail(curriculum)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <Icons.Eye />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== Detail View ====================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={backToList}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <Icons.ArrowLeft />
          <span>กลับไปรายการหลักสูตร</span>
        </button>

        {/* Curriculum Info Card */}
        {selectedCurriculum && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <Icons.School />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-gray-800">
                    {selectedCurriculum.name}
                  </h1>
                  {getStatusBadge(selectedCurriculum.status || "")}
                </div>
                <p className="text-gray-500 mb-2">
                  รหัส: {selectedCurriculum.code}
                </p>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {selectedCurriculum.faculty?.name}
                  </span>
                  {selectedCurriculum.program?.name && (
                    <span> • {selectedCurriculum.program.name}</span>
                  )}
                </div>
                {(selectedCurriculum as any).description && (
                  <p className="mt-3 text-gray-600 text-sm">
                    {(selectedCurriculum as any).description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {loadingDetail ? (
          <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="space-y-6">
            {/* ==================== Recommendations Section ==================== */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                  <Icons.Lightbulb />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    คำแนะนำหลักสูตร
                  </h2>
                  <p className="text-sm text-gray-500">
                    เพิ่มคำแนะนำสำหรับนักเรียนที่สนใจหลักสูตรนี้
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* Single Recommendation Block */}
                {isEditingRecommendation ? (
                  // Edit Mode
                  <div className="border-2 border-orange-300 rounded-lg p-6 bg-orange-50/50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำแนะนำสำหรับนักเรียน
                    </label>
                    <textarea
                      value={recommendationText}
                      onChange={(e) => setRecommendationText(e.target.value)}
                      placeholder="เขียนคำแนะนำสำหรับนักเรียน เช่น ควรเตรียมตัวอย่างไร, ต้องมีทักษะอะไรบ้าง, สิ่งที่ควรรู้ก่อนสมัคร..."
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white"
                      rows={6}
                      autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={handleCancelRecommendation}
                        disabled={saving}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSaveRecommendation}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Icons.Save />
                        <span>{saving ? "กำลังบันทึก..." : "บันทึก"}</span>
                      </button>
                    </div>
                  </div>
                ) : recommendationText ? (
                  // Display Mode - Has content
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-gray-700 flex-1 whitespace-pre-wrap">
                        {recommendationText}
                      </p>
                      <button
                        onClick={handleEditRecommendation}
                        className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                        title="แก้ไขคำแนะนำ"
                      >
                        <Icons.Edit />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode - No content
                  <button
                    onClick={handleEditRecommendation}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-100 group-hover:bg-orange-100 rounded-full transition-colors">
                        <Icons.Plus />
                      </div>
                      <span className="font-medium">เพิ่มคำแนะนำ</span>
                      <span className="text-sm">คลิกเพื่อเพิ่มคำแนะนำสำหรับนักเรียน</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* ==================== Course Groups Section ==================== */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Icons.BookOpen />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      กลุ่มวิชาและทักษะ ({curriculumCourseGroups.length})
                    </h2>
                    <p className="text-sm text-gray-500">
                      เพิ่มกลุ่มวิชาและทักษะที่เกี่ยวข้องกับหลักสูตร
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {curriculumCourseGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="flex justify-center mb-2">
                      <Icons.BookOpen />
                    </div>
                    <p>ยังไม่มีกลุ่มวิชา</p>
                    <p className="text-sm">กดปุ่มด้านล่างเพื่อเพิ่มกลุ่มวิชา</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {curriculumCourseGroups.map((ccg) => (
                      <div
                        key={ccg.id}
                        className="border rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {ccg.course_group?.name || "ไม่ทราบ"}
                            </h3>
                            {ccg.course_group?.name_en && (
                              <p className="text-sm text-gray-500">
                                {ccg.course_group.name_en}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCourseGroup(ccg.course_group_id)}
                            disabled={saving}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors"
                            title="ลบออก"
                          >
                            <Icons.Trash />
                          </button>
                        </div>

                        {/* Skills */}
                        {ccg.course_group?.course_group_skills &&
                          ccg.course_group.course_group_skills.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1.5">
                                ทักษะที่เกี่ยวข้อง:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {ccg.course_group.course_group_skills.map((cgs) => (
                                  <span
                                    key={cgs.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border text-xs rounded-full text-gray-600"
                                  >
                                    {cgs.skill?.skill_name_th}
                                    <span className="text-orange-400">
                                      {"★".repeat(cgs.importance)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* ✅ NEW: Description with button */}
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">คำแนะนำสำหรับกลุ่มวิชานี้:</p>
                          {ccg.description ? (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm text-gray-700 flex-1">{ccg.description}</p>
                              <button
                                onClick={() => handleOpenDescriptionModal(ccg.course_group_id, ccg.description || "")}
                                className="p-1 text-orange-500 hover:bg-orange-100 rounded transition-colors flex-shrink-0"
                                title="แก้ไข"
                              >
                                <Icons.Edit />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenDescriptionModal(ccg.course_group_id, "")}
                              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 transition-all text-sm"
                            >
                              <Icons.MessageSquare />
                              <span>+ เพิ่มคำแนะนำ</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Course Group Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddCourseGroupModal(true)}
                    disabled={availableCourseGroups.length === 0}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-lg p-4 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icons.Plus />
                    <span className="font-medium">เพิ่มกลุ่มวิชา</span>
                    <span className="text-sm text-gray-500">
                      ({availableCourseGroups.length} รายการที่สามารถเพิ่มได้)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Add Course Group Modal ==================== */}
        {showAddCourseGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  เพิ่มกลุ่มวิชา
                </h3>
                <button
                  onClick={() => setShowAddCourseGroupModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="ปิด"
                >
                  <Icons.X />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {availableCourseGroups.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    เพิ่มกลุ่มวิชาทั้งหมดแล้ว
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableCourseGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={async () => {
                          await handleAddCourseGroup(group.id);
                          setShowAddCourseGroupModal(false);
                        }}
                        disabled={saving}
                        className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors text-left disabled:opacity-50"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {group.name}
                          </div>
                          {group.name_en && (
                            <div className="text-sm text-gray-500">
                              {group.name_en}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {group.course_group_skills?.length || 0} ทักษะ
                          </div>
                        </div>
                        <span className="text-orange-500 flex-shrink-0">
                          <Icons.Plus />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowAddCourseGroupModal(false)}
                  className="w-full py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ✅ NEW: Description Modal ==================== */}
        {showDescriptionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  คำแนะนำสำหรับกลุ่มวิชา
                </h3>
                <button
                  onClick={() => {
                    setShowDescriptionModal(false);
                    setEditingCourseGroupId(null);
                    setEditingDescription("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="ปิด"
                >
                  <Icons.X />
                </button>
              </div>

              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เขียนคำแนะนำสำหรับนักเรียน
                </label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  placeholder="เขียนคำแนะนำสำหรับกลุ่มวิชานี้..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={4}
                  autoFocus
                />
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDescriptionModal(false);
                    setEditingCourseGroupId(null);
                    setEditingDescription("");
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveDescription}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Icons.Save />
                  <span>{saving ? "กำลังบันทึก..." : "บันทึก"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}