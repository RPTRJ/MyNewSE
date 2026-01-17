"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchCourseGroups,
  fetchAllSkills,
  createCourseGroup,
  updateCourseGroup,
  deleteCourseGroup,
  addSkillToCourseGroup,
  removeSkillFromCourseGroup,
  updateCourseGroupSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  type CourseGroupDTO,
  type SkillDTO,
  type CourseGroupSkillDTO,
} from "@/services/courseGroup";

type Tab = "course-groups" | "skills";

// ==================== Icon Components ====================

const IconCalculator = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconFlask = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const IconCode = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const IconBook = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconFolder = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const IconStar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "calculator": return <IconCalculator />;
    case "flask": return <IconFlask />;
    case "code": return <IconCode />;
    case "book": return <IconBook />;
    case "users": return <IconUsers />;
    default: return <IconFolder />;
  }
};

const ICON_OPTIONS = [
  { value: "calculator", label: "เครื่องคิดเลข" },
  { value: "flask", label: "ขวดทดลอง" },
  { value: "code", label: "โค้ด" },
  { value: "book", label: "หนังสือ" },
  { value: "users", label: "กลุ่มคน" },
  { value: "folder", label: "โฟลเดอร์" },
];

const SKILL_CATEGORIES = [
  { value: 1, label: "ทักษะด้านความคิด", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: 2, label: "ทักษะด้านการทำงาน", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: 3, label: "ทักษะด้านการเรียนรู้", color: "bg-green-100 text-green-700 border-green-200" },
];

// ==================== Main Component ====================

export default function AdminCourseGroupsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("course-groups");

  // Course Groups state
  const [courseGroups, setCourseGroups] = useState<CourseGroupDTO[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroupDTO | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    name_en: "",
    description: "",
    icon: "folder",
    is_active: true,
  });

  // Skills state
  const [skills, setSkills] = useState<SkillDTO[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillDTO | null>(null);
  const [skillForm, setSkillForm] = useState({
    skill_name_th: "",
    skill_name_en: "",
    category: 1,
    description: "",
  });

  // Modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showSkillsManageModal, setShowSkillsManageModal] = useState(false);
  const [managingGroup, setManagingGroup] = useState<CourseGroupDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "group" | "skill" | "group-skill";
    id: number;
    skillId?: number;
    label: string;
  } | null>(null);

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

  const loadCourseGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const data = await fetchCourseGroups();
      setCourseGroups(data);
    } catch (err) {
      toast.error("โหลดข้อมูลกลุ่มวิชาไม่สำเร็จ");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const data = await fetchAllSkills();
      setSkills(data);
    } catch (err) {
      toast.error("โหลดข้อมูลทักษะไม่สำเร็จ");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadCourseGroups();
      loadSkills();
    }
  }, [isAuthorized, loadCourseGroups, loadSkills]);

  // ==================== Course Group Handlers ====================

  const resetGroupForm = () => {
    setGroupForm({
      name: "",
      name_en: "",
      description: "",
      icon: "folder",
      is_active: true,
    });
    setEditingGroup(null);
  };

  const handleEditGroup = (group: CourseGroupDTO) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      name_en: group.name_en || "",
      description: group.description || "",
      icon: group.icon || "folder",
      is_active: group.is_active,
    });
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error("กรุณากรอกชื่อกลุ่มวิชา");
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        const updated = await updateCourseGroup(editingGroup.id, groupForm);
        setCourseGroups((prev) =>
          prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
        );
        toast.success("อัปเดตกลุ่มวิชาสำเร็จ");
      } else {
        const created = await createCourseGroup(groupForm);
        setCourseGroups((prev) => [...prev, created]);
        toast.success("สร้างกลุ่มวิชาสำเร็จ");
      }
      setShowGroupModal(false);
      resetGroupForm();
    } catch (err) {
      toast.error(editingGroup ? "อัปเดตไม่สำเร็จ" : "สร้างไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirmDelete || confirmDelete.type !== "group") return;

    setSaving(true);
    try {
      await deleteCourseGroup(confirmDelete.id);
      setCourseGroups((prev) => prev.filter((g) => g.id !== confirmDelete.id));
      toast.success("ลบกลุ่มวิชาสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  // ==================== Skill Handlers ====================

  const resetSkillForm = () => {
    setSkillForm({
      skill_name_th: "",
      skill_name_en: "",
      category: 1,
      description: "",
    });
    setEditingSkill(null);
  };

  const handleEditSkill = (skill: SkillDTO) => {
    setEditingSkill(skill);
    setSkillForm({
      skill_name_th: skill.skill_name_th,
      skill_name_en: skill.skill_name_en || "",
      category: skill.category || 1,
      description: skill.description || "",
    });
    setShowSkillModal(true);
  };

  const handleSaveSkill = async () => {
    if (!skillForm.skill_name_th.trim()) {
      toast.error("กรุณากรอกชื่อทักษะ (ไทย)");
      return;
    }

    setSaving(true);
    try {
      if (editingSkill) {
        const updated = await updateSkill(editingSkill.id, skillForm);
        setSkills((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        toast.success("อัปเดตทักษะสำเร็จ");
      } else {
        const created = await createSkill(skillForm);
        setSkills((prev) => [...prev, created]);
        toast.success("สร้างทักษะสำเร็จ");
      }
      setShowSkillModal(false);
      resetSkillForm();
    } catch (err) {
      toast.error(editingSkill ? "อัปเดตไม่สำเร็จ" : "สร้างไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!confirmDelete || confirmDelete.type !== "skill") return;

    setSaving(true);
    try {
      await deleteSkill(confirmDelete.id);
      setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
      toast.success("ลบทักษะสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  // ==================== Manage Skills in Group ====================

  const handleManageSkills = (group: CourseGroupDTO) => {
    setManagingGroup(group);
    setShowSkillsManageModal(true);
  };

  const handleAddSkillToGroup = async (skillId: number) => {
    if (!managingGroup) return;

    try {
      await addSkillToCourseGroup(managingGroup.id, {
        skill_id: skillId,
        importance: 3,
      });
      
      // Reload course groups to get updated data
      await loadCourseGroups();
      
      toast.success("เพิ่มทักษะสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "เพิ่มทักษะไม่สำเร็จ");
    }
  };

  const handleRemoveSkillFromGroup = async () => {
    if (!confirmDelete || confirmDelete.type !== "group-skill" || !managingGroup) return;

    setSaving(true);
    try {
      await removeSkillFromCourseGroup(confirmDelete.id, confirmDelete.skillId!);
      
      // Reload course groups
      await loadCourseGroups();
      
      toast.success("ลบทักษะออกจากกลุ่มสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const handleUpdateImportance = async (
    groupId: number,
    skillId: number,
    importance: number
  ) => {
    setSaving(true);
    try {
      await updateCourseGroupSkill(groupId, skillId, {
        skill_id: skillId,
        importance,
      });
      await loadCourseGroups();
      toast.success("อัปเดตความสำคัญสำเร็จ");
    } catch (err) {
      toast.error("อัปเดตไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // Update managingGroup when courseGroups change
  useEffect(() => {
    if (managingGroup) {
      const updated = courseGroups.find((g) => g.id === managingGroup.id);
      if (updated) {
        setManagingGroup(updated);
      }
    }
  }, [courseGroups, managingGroup?.id]);

  // ==================== Render ====================

  if (!isAuthorized) {
    return null;
  }

  const linkedSkillIds = new Set(
    managingGroup?.course_group_skills?.map((cgs) => cgs.skill_id) || []
  );
  const availableSkills = skills.filter((s) => !linkedSkillIds.has(s.id));

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-orange-500">
            จัดการกลุ่มวิชาและทักษะ
          </h1>
          <p className="text-gray-600 mt-1">
            จัดการข้อมูลกลุ่มวิชาและทักษะที่ต้องมีก่อนเรียน
          </p>
        </div>

        {/* ✅ NEW: Tab Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("course-groups")}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "course-groups"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <IconFolder />
            <span>กลุ่มวิชา</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === "course-groups" 
                ? "bg-white/20" 
                : "bg-gray-200"
            }`}>
              {courseGroups.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "skills"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <IconStar />
            <span>ทักษะ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === "skills" 
                ? "bg-white/20" 
                : "bg-gray-200"
            }`}>
              {skills.length}
            </span>
          </button>
        </div>

        {/* Course Groups Tab */}
        {activeTab === "course-groups" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">รายการกลุ่มวิชา</h2>
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowGroupModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มกลุ่มวิชา
              </button>
            </div>

            {loadingGroups ? (
              <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
            ) : courseGroups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
                  <IconFolder />
                </div>
                <p className="text-gray-500">ยังไม่มีกลุ่มวิชา</p>
                <p className="text-sm text-gray-400 mt-1">กดปุ่มด้านบนเพื่อเพิ่มกลุ่มวิชาใหม่</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courseGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-5 border border-gray-100"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl text-orange-600">
                        {getIconComponent(group.icon || "folder")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {group.name}
                        </h3>
                        {group.name_en && (
                          <p className="text-sm text-gray-400 truncate">
                            {group.name_en}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {group.description || "ไม่มีรายละเอียด"}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          group.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {group.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {group.course_group_skills?.length || 0} ทักษะ
                      </span>
                    </div>

                    {/* Skills Preview */}
                    {group.course_group_skills && group.course_group_skills.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <div className="flex flex-wrap gap-1.5">
                          {group.course_group_skills.slice(0, 3).map((cgs) => (
                            <span
                              key={cgs.id}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1"
                            >
                              {cgs.skill?.skill_name_th || "ไม่ทราบ"}
                              <span className="text-orange-500">
                                {"★".repeat(cgs.importance)}
                              </span>
                            </span>
                          ))}
                          {group.course_group_skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded-full">
                              +{group.course_group_skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManageSkills(group)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        จัดการทักษะ
                      </button>
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            type: "group",
                            id: group.id,
                            label: group.name,
                          })
                        }
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ NEW: Skills Tab with Cards */}
        {activeTab === "skills" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">รายการทักษะ</h2>
              <button
                onClick={() => {
                  resetSkillForm();
                  setShowSkillModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มทักษะ
              </button>
            </div>

            {loadingSkills ? (
              <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
            ) : skills.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
                  <IconStar />
                </div>
                <p className="text-gray-500">ยังไม่มีทักษะ</p>
                <p className="text-sm text-gray-400 mt-1">กดปุ่มด้านบนเพื่อเพิ่มทักษะใหม่</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => {
                  const category = SKILL_CATEGORIES.find((c) => c.value === skill.category);
                  return (
                    <div
                      key={skill.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-5 border border-gray-100"
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl text-purple-600">
                          <IconStar />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {skill.skill_name_th}
                          </h3>
                          {skill.skill_name_en && (
                            <p className="text-sm text-gray-400 truncate">
                              {skill.skill_name_en}
                            </p>
                          )}
                        </div>
                      </div>

                      {skill.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {skill.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${category?.color || "bg-gray-100 text-gray-600"}`}
                        >
                          {category?.label || "ไม่ระบุหมวดหมู่"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: "skill",
                              id: skill.id,
                              label: skill.skill_name_th,
                            })
                          }
                          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingGroup ? "แก้ไขกลุ่มวิชา" : "เพิ่มกลุ่มวิชา"}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่มวิชา (ไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="เช่น วิชาคำนวณและตรรกะ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่มวิชา (อังกฤษ)
                </label>
                <input
                  type="text"
                  value={groupForm.name_en}
                  onChange={(e) => setGroupForm({ ...groupForm, name_en: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Calculation & Logic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="อธิบายว่ากลุ่มวิชานี้เรียนอะไร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ไอคอน
                </label>
                <select
                  value={groupForm.icon}
                  onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="เลือกไอคอน"
                  title="ไอคอนกลุ่มวิชา"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={groupForm.is_active}
                  onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  ใช้งาน
                </label>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  resetGroupForm();
                }}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingSkill ? "แก้ไขทักษะ" : "เพิ่มทักษะ"}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทักษะ (ไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={skillForm.skill_name_th}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_th: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="เช่น การคิดวิเคราะห์"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทักษะ (อังกฤษ)
                </label>
                <input
                  type="text"
                  value={skillForm.skill_name_en}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_en: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Analytical Thinking"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="เลือกหมวดหมู่ทักษะ"
                  title="หมวดหมู่ทักษะ"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="อธิบายเกี่ยวกับทักษะนี้"
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  resetSkillForm();
                }}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSkill}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Skills Modal */}
      {showSkillsManageModal && managingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  จัดการทักษะ
                </h3>
                <p className="text-sm text-gray-500">{managingGroup.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSkillsManageModal(false);
                  setManagingGroup(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ปิดหน้าต่าง"
                title="ปิด"
              >
                <IconX />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {/* Current Skills */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                    {managingGroup.course_group_skills?.length || 0}
                  </span>
                  ทักษะที่เพิ่มแล้ว
                </h4>
                {managingGroup.course_group_skills && managingGroup.course_group_skills.length > 0 ? (
                  <div className="space-y-2">
                    {managingGroup.course_group_skills.map((cgs) => (
                      <div
                        key={cgs.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-xl border border-gray-100"
                      >
                        <div>
                          <span className="font-medium text-gray-800">
                            {cgs.skill?.skill_name_th || "ไม่ทราบ"}
                          </span>
                          {cgs.skill?.skill_name_en && (
                            <span className="text-gray-400 ml-2 text-sm">
                              ({cgs.skill.skill_name_en})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">ความสำคัญ:</span>
                            <select
                              value={cgs.importance}
                              onChange={(e) =>
                                handleUpdateImportance(
                                  managingGroup.id,
                                  cgs.skill_id,
                                  parseInt(e.target.value)
                                )
                              }
                              disabled={saving}
                              className="px-3 py-1.5 border-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                              aria-label={`ความสำคัญของทักษะ ${cgs.skill?.skill_name_th || ''}`}
                              title="เลือกระดับความสำคัญ"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} {"★".repeat(n)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: "group-skill",
                                id: managingGroup.id,
                                skillId: cgs.skill_id,
                                label: cgs.skill?.skill_name_th || "ทักษะ",
                              })
                            }
                            className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm p-4 bg-gray-50 rounded-xl text-center">
                    ยังไม่มีทักษะ
                  </p>
                )}
              </div>

              {/* Available Skills */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {availableSkills.length}
                  </span>
                  ทักษะที่สามารถเพิ่มได้
                </h4>
                {availableSkills.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkillToGroup(skill.id)}
                        className="flex items-center justify-between p-3 border-2 border-dashed rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-gray-700">{skill.skill_name_th}</span>
                        <span className="text-orange-500 text-lg">+</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm p-4 bg-gray-50 rounded-xl text-center">
                    เพิ่มทักษะทั้งหมดแล้ว หรือยังไม่มีทักษะในระบบ
                  </p>
                )}
              </div>
            </div>
            <div className="p-5 border-t">
              <button
                onClick={() => {
                  setShowSkillsManageModal(false);
                  setManagingGroup(null);
                }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                ยืนยันการลบ
              </h3>
              <p className="text-gray-600 text-center">
                คุณต้องการลบ <span className="font-medium">"{confirmDelete.label}"</span> ใช่หรือไม่?
              </p>
            </div>
            <div className="p-5 border-t flex justify-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "group") handleDeleteGroup();
                  else if (confirmDelete.type === "skill") handleDeleteSkill();
                  else if (confirmDelete.type === "group-skill") handleRemoveSkillFromGroup();
                }}
                disabled={saving}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}