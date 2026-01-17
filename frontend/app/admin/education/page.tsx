"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  createCurriculumType,
  createEducationLevel,
  createSchool,
  createSchoolType,
  deleteCurriculumType,
  deleteEducationLevel,
  deleteSchool,
  deleteSchoolType,
  fetchCurriculumTypes,
  fetchEducationLevels,
  fetchSchoolTypes,
  fetchSchools,
  updateEducationLevel,
  updateSchoolType,
  updateCurriculumType,
  updateSchool,
  type CurriculumTypeDTO,
  type EducationLevelDTO,
  type SchoolDTO,
  type SchoolTypeDTO,
} from "@/services/education";

type TabType = "levels" | "schoolTypes" | "curriculum" | "schools";

export default function AdminEducationPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("levels");

  // Data states
  const [levels, setLevels] = useState<EducationLevelDTO[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<SchoolTypeDTO[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<CurriculumTypeDTO[]>([]);
  const [schools, setSchools] = useState<SchoolDTO[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Search/filter states
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<number | "all">("all");
  const [curriculumTypeFilter, setCurriculumTypeFilter] = useState<number | "all">("all");

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  // Form states for each entity
  const [newLevelName, setNewLevelName] = useState("");
  const [newSchoolTypeName, setNewSchoolTypeName] = useState("");
  const [newCurriculumForm, setNewCurriculumForm] = useState({ name: "", schoolTypeIds: [] as number[] });
  const [newSchoolForm, setNewSchoolForm] = useState({
    name: "",
    code: "",
    schoolTypeIds: [] as number[],
    isProjectBased: false,
  });

  // Edit form states
  const [editLevelForm, setEditLevelForm] = useState<{ id: number; name: string } | null>(null);
  const [editSchoolTypeForm, setEditSchoolTypeForm] = useState<{ id: number; name: string } | null>(null);
  const [editCurriculumForm, setEditCurriculumForm] = useState<{ id: number; name: string; schoolTypeIds: number[] } | null>(null);
  const [editSchoolForm, setEditSchoolForm] = useState<{ id: number; name: string; code: string; schoolTypeIds: number[]; isProjectBased: boolean } | null>(null);

  // Confirm delete state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: (() => Promise<void>) | null;
    working: boolean;
  }>({ open: false, message: "", onConfirm: null, working: false });

  // Auth guard
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Loaders
  const loadLevels = useCallback(async () => {
    try {
      const data = await fetchEducationLevels();
      setLevels(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดระดับการศึกษาไม่สำเร็จ");
    }
  }, []);

  const loadSchoolTypes = useCallback(async () => {
    try {
      const data = await fetchSchoolTypes();
      setSchoolTypes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดประเภทสถานศึกษาไม่สำเร็จ");
    }
  }, []);

  const loadCurriculumTypes = useCallback(async () => {
    try {
      const data = await fetchCurriculumTypes();
      setCurriculumTypes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดประเภทหลักสูตรไม่สำเร็จ");
    }
  }, []);

  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const resp = await fetchSchools({
        search: schoolSearch,
        school_type_id: schoolTypeFilter === "all" ? undefined : schoolTypeFilter,
        limit: 500,
      });
      setSchools(resp.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดข้อมูลสถานศึกษาไม่สำเร็จ");
    } finally {
      setLoadingSchools(false);
    }
  }, [schoolSearch, schoolTypeFilter]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadLevels();
    loadSchoolTypes();
    loadCurriculumTypes();
  }, [isAuthorized, loadLevels, loadSchoolTypes, loadCurriculumTypes]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = setTimeout(() => loadSchools(), 300);
    return () => clearTimeout(timer);
  }, [isAuthorized, loadSchools]);

  // Filtered data
  const filteredCurriculumTypes = useMemo(() => {
    if (curriculumTypeFilter === "all") return curriculumTypes;
    return curriculumTypes.filter((c) => !c.school_type_id || c.school_type_id === curriculumTypeFilter);
  }, [curriculumTypes, curriculumTypeFilter]);

  // Confirm delete helper
  const confirmDelete = (message: string, action: () => Promise<void>) => {
    setConfirmState({
      open: true,
      message,
      working: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, working: true }));
        try {
          await action();
          setConfirmState({ open: false, message: "", onConfirm: null, working: false });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ");
          setConfirmState((prev) => ({ ...prev, working: false }));
        }
      },
    });
  };

  // Add handlers
  const handleAddLevel = async () => {
    if (!newLevelName.trim()) {
      toast.error("กรุณากรอกชื่อระดับการศึกษา");
      return;
    }
    setModalSaving(true);
    try {
      await createEducationLevel(newLevelName.trim());
      toast.success("เพิ่มระดับการศึกษาสำเร็จ");
      setNewLevelName("");
      setAddModalOpen(false);
      await loadLevels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เพิ่มข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddSchoolType = async () => {
    if (!newSchoolTypeName.trim()) {
      toast.error("กรุณากรอกชื่อประเภทสถานศึกษา");
      return;
    }
    setModalSaving(true);
    try {
      await createSchoolType(newSchoolTypeName.trim());
      toast.success("เพิ่มประเภทสถานศึกษาสำเร็จ");
      setNewSchoolTypeName("");
      setAddModalOpen(false);
      await loadSchoolTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เพิ่มข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddCurriculum = async () => {
    if (!newCurriculumForm.name.trim()) {
      toast.error("กรุณากรอกชื่อประเภทหลักสูตร");
      return;
    }
    setModalSaving(true);
    try {
      // ส่ง school_type_id ตัวแรก (หรือ null ถ้าไม่มี) เพื่อความ compatible กับ backend
      await createCurriculumType({
        name: newCurriculumForm.name.trim(),
        school_type_id: newCurriculumForm.schoolTypeIds.length > 0 ? newCurriculumForm.schoolTypeIds[0] : null,
      });
      toast.success("เพิ่มประเภทหลักสูตรสำเร็จ");
      setNewCurriculumForm({ name: "", schoolTypeIds: [] });
      setAddModalOpen(false);
      await loadCurriculumTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เพิ่มข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddSchool = async () => {
    if (!newSchoolForm.name.trim()) {
      toast.error("กรุณากรอกชื่อสถานศึกษา");
      return;
    }
    if (newSchoolForm.schoolTypeIds.length === 0) {
      toast.error("กรุณาเลือกประเภทสถานศึกษาอย่างน้อย 1 ประเภท");
      return;
    }
    setModalSaving(true);
    try {
      // ส่ง school_type_id ตัวแรกเพื่อความ compatible กับ backend
      await createSchool({
        name: newSchoolForm.name.trim(),
        code: newSchoolForm.code.trim() || undefined,
        school_type_id: newSchoolForm.schoolTypeIds[0],
        is_project_based: newSchoolForm.isProjectBased,
      });
      toast.success("เพิ่มสถานศึกษาสำเร็จ");
      setNewSchoolForm({ name: "", code: "", schoolTypeIds: [], isProjectBased: false });
      setAddModalOpen(false);
      await loadSchools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เพิ่มข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const openAddModal = () => {
    setNewLevelName("");
    setNewSchoolTypeName("");
    setNewCurriculumForm({ name: "", schoolTypeIds: [] });
    setNewSchoolForm({ name: "", code: "", schoolTypeIds: [], isProjectBased: false });
    setAddModalOpen(true);
  };

  // Edit handlers
  const openEditLevel = (level: EducationLevelDTO) => {
    setEditLevelForm({ id: level.id, name: level.name });
    setEditModalOpen(true);
  };

  const openEditSchoolType = (item: SchoolTypeDTO) => {
    setEditSchoolTypeForm({ id: item.id, name: item.name });
    setEditModalOpen(true);
  };

  const openEditCurriculum = (item: CurriculumTypeDTO) => {
    setEditCurriculumForm({ 
      id: item.id, 
      name: item.name, 
      schoolTypeIds: item.school_type_id ? [item.school_type_id] : [] 
    });
    setEditModalOpen(true);
  };

  const openEditSchool = (school: SchoolDTO) => {
    setEditSchoolForm({
      id: school.id,
      name: school.name,
      code: school.code || "",
      schoolTypeIds: school.school_type_id ? [school.school_type_id] : [],
      isProjectBased: school.is_project_based ?? false,
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditLevelForm(null);
    setEditSchoolTypeForm(null);
    setEditCurriculumForm(null);
    setEditSchoolForm(null);
  };

  const handleEditLevel = async () => {
    if (!editLevelForm || !editLevelForm.name.trim()) {
      toast.error("กรุณากรอกชื่อระดับการศึกษา");
      return;
    }
    setModalSaving(true);
    try {
      await updateEducationLevel(editLevelForm.id, editLevelForm.name.trim());
      toast.success("แก้ไขระดับการศึกษาสำเร็จ");
      closeEditModal();
      await loadLevels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleEditSchoolType = async () => {
    if (!editSchoolTypeForm || !editSchoolTypeForm.name.trim()) {
      toast.error("กรุณากรอกชื่อประเภทสถานศึกษา");
      return;
    }
    setModalSaving(true);
    try {
      await updateSchoolType(editSchoolTypeForm.id, editSchoolTypeForm.name.trim());
      toast.success("แก้ไขประเภทสถานศึกษาสำเร็จ");
      closeEditModal();
      await loadSchoolTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleEditCurriculum = async () => {
    if (!editCurriculumForm || !editCurriculumForm.name.trim()) {
      toast.error("กรุณากรอกชื่อประเภทหลักสูตร");
      return;
    }
    setModalSaving(true);
    try {
      // ส่ง school_type_id ตัวแรก (หรือ null ถ้าไม่มี) เพื่อความ compatible กับ backend
      await updateCurriculumType(editCurriculumForm.id, {
        name: editCurriculumForm.name.trim(),
        school_type_id: editCurriculumForm.schoolTypeIds.length > 0 ? editCurriculumForm.schoolTypeIds[0] : null,
      });
      toast.success("แก้ไขประเภทหลักสูตรสำเร็จ");
      closeEditModal();
      await loadCurriculumTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const handleEditSchool = async () => {
    if (!editSchoolForm || !editSchoolForm.name.trim()) {
      toast.error("กรุณากรอกชื่อสถานศึกษา");
      return;
    }
    if (editSchoolForm.schoolTypeIds.length === 0) {
      toast.error("กรุณาเลือกประเภทสถานศึกษาอย่างน้อย 1 ประเภท");
      return;
    }
    setModalSaving(true);
    try {
      // ส่ง school_type_id ตัวแรกเพื่อความ compatible กับ backend
      await updateSchool(editSchoolForm.id, {
        name: editSchoolForm.name.trim(),
        code: editSchoolForm.code.trim() || undefined,
        school_type_id: editSchoolForm.schoolTypeIds[0],
        is_project_based: editSchoolForm.isProjectBased,
      });
      toast.success("แก้ไขสถานศึกษาสำเร็จ");
      closeEditModal();
      await loadSchools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setModalSaving(false);
    }
  };

  const getEditModalTitle = () => {
    if (editLevelForm) return "แก้ไขระดับการศึกษา";
    if (editSchoolTypeForm) return "แก้ไขประเภทสถานศึกษา";
    if (editCurriculumForm) return "แก้ไขประเภทหลักสูตร";
    if (editSchoolForm) return "แก้ไขสถานศึกษา";
    return "แก้ไขข้อมูล";
  };

  const handleEditSubmit = () => {
    if (editLevelForm) return handleEditLevel();
    if (editSchoolTypeForm) return handleEditSchoolType();
    if (editCurriculumForm) return handleEditCurriculum();
    if (editSchoolForm) return handleEditSchool();
  };

  const tabs = [
    { id: "levels" as TabType, label: "ระดับการศึกษา", count: levels.length },
    { id: "schoolTypes" as TabType, label: "ประเภทสถานศึกษา", count: schoolTypes.length },
    { id: "curriculum" as TabType, label: "ประเภทหลักสูตร", count: curriculumTypes.length },
    { id: "schools" as TabType, label: "สถานศึกษา", count: schools.length },
  ];

  const getModalTitle = () => {
    switch (activeTab) {
      case "levels": return "เพิ่มระดับการศึกษา";
      case "schoolTypes": return "เพิ่มประเภทสถานศึกษา";
      case "curriculum": return "เพิ่มประเภทหลักสูตร";
      case "schools": return "เพิ่มสถานศึกษา";
    }
  };

  const handleModalSubmit = () => {
    switch (activeTab) {
      case "levels": return handleAddLevel();
      case "schoolTypes": return handleAddSchoolType();
      case "curriculum": return handleAddCurriculum();
      case "schools": return handleAddSchool();
    }
  };

  if (!isAuthorized) return null;

  return (
    <>
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-8xl mx-auto space-y-6">
          {/* Header */}
          <header className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
              <p className="text-orange-100 text-sm font-medium">Admin Panel</p>
              <h1 className="text-2xl font-bold text-white">จัดการข้อมูลการศึกษา</h1>
            </div>
            
            {/* Tab Navigation */}
            <div className="px-4 py-3 bg-gray-50 border-t border-orange-100">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filters for Schools tab */}
                {activeTab === "schools" && (
                  <>
                    <input
                      type="text"
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      placeholder="🔍 ค้นหาชื่อหรือรหัส..."
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent w-48"
                    />
                    <select
                      value={schoolTypeFilter}
                      onChange={(e) => setSchoolTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="all">ทุกประเภท</option>
                      {schoolTypes.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </>
                )}
                
                {/* Filter for Curriculum tab */}
                {activeTab === "curriculum" && (
                  <select
                    value={curriculumTypeFilter}
                    onChange={(e) => setCurriculumTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="all">ทุกประเภทสถานศึกษา</option>
                    {schoolTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                )}
                
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md"
                >
                  <span>➕</span>
                  <span>เพิ่มใหม่</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {/* Education Levels Tab */}
              {activeTab === "levels" && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ลำดับ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ชื่อระดับการศึกษา</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {levels.map((level, idx) => (
                      <tr key={level.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{level.name}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditLevel(level)}
                              className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => confirmDelete("ต้องการลบระดับการศึกษานี้หรือไม่?", async () => {
                                await deleteEducationLevel(level.id);
                                toast.success("ลบแล้ว");
                                loadLevels();
                              })}
                              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {levels.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                          ยังไม่มีข้อมูลระดับการศึกษา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* School Types Tab */}
              {activeTab === "schoolTypes" && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ลำดับ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ชื่อประเภทสถานศึกษา</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {schoolTypes.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditSchoolType(item)}
                              className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => confirmDelete("ต้องการลบประเภทสถานศึกษานี้หรือไม่?", async () => {
                                await deleteSchoolType(item.id);
                                toast.success("ลบแล้ว");
                                await loadSchoolTypes();
                                await loadCurriculumTypes();
                                await loadSchools();
                              })}
                              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {schoolTypes.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                          ยังไม่มีข้อมูลประเภทสถานศึกษา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Curriculum Types Tab */}
              {activeTab === "curriculum" && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ลำดับ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ชื่อหลักสูตร</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ประเภทสถานศึกษา</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCurriculumTypes.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.school_type?.name
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {item.school_type?.name || "ใช้ได้ทุกประเภท"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditCurriculum(item)}
                              className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => confirmDelete("ต้องการลบประเภทหลักสูตรนี้หรือไม่?", async () => {
                                await deleteCurriculumType(item.id);
                                toast.success("ลบแล้ว");
                                loadCurriculumTypes();
                              })}
                              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCurriculumTypes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          ไม่มีข้อมูลประเภทหลักสูตร
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Schools Tab */}
              {activeTab === "schools" && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ลำดับ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ชื่อสถานศึกษา</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">รหัส</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">ประเภท</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Project-based</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingSchools ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          กำลังโหลดข้อมูล...
                        </td>
                      </tr>
                    ) : (
                      schools.map((school, idx) => (
                        <tr key={school.id} className="hover:bg-orange-50/50 transition-colors">
                          <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-800">{school.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            {school.code ? (
                              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {school.code}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {school.school_type?.name || "ไม่ระบุ"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {school.is_project_based ? (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                ✓ Project
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                Standard
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditSchool(school)}
                                className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => confirmDelete("ต้องการลบสถานศึกษานี้หรือไม่?", async () => {
                                  await deleteSchool(school.id);
                                  toast.success("ลบแล้ว");
                                  loadSchools();
                                })}
                                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!loadingSchools && schools.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          ไม่พบสถานศึกษาที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer info */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
              แสดงทั้งหมด {
                activeTab === "levels" ? levels.length :
                activeTab === "schoolTypes" ? schoolTypes.length :
                activeTab === "curriculum" ? filteredCurriculumTypes.length :
                schools.length
              } รายการ
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">{getModalTitle()}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Level Form */}
              {activeTab === "levels" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อระดับการศึกษา</label>
                  <input
                    type="text"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder="เช่น มัธยมศึกษาตอนปลาย (ม.4-ม.6)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                    autoFocus
                  />
                </div>
              )}

              {/* School Type Form */}
              {activeTab === "schoolTypes" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อประเภทสถานศึกษา</label>
                  <input
                    type="text"
                    value={newSchoolTypeName}
                    onChange={(e) => setNewSchoolTypeName(e.target.value)}
                    placeholder="เช่น โรงเรียนรัฐบาล"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                    autoFocus
                  />
                </div>
              )}

              {/* Curriculum Form */}
              {activeTab === "curriculum" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ชื่อประเภทหลักสูตร</label>
                    <input
                      type="text"
                      value={newCurriculumForm.name}
                      onChange={(e) => setNewCurriculumForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น สายวิทย์-คณิต"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">ประเภทสถานศึกษา (ถ้ามี)</label>
                    
                    {/* Selected School Types */}
                    {newCurriculumForm.schoolTypeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newCurriculumForm.schoolTypeIds.map((id) => {
                          const st = schoolTypes.find((s) => s.id === id);
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              <span>{st?.name}</span>
                              <button
                                type="button"
                                onClick={() => setNewCurriculumForm((prev) => ({
                                  ...prev,
                                  schoolTypeIds: prev.schoolTypeIds.filter((sid) => sid !== id),
                                }))}
                                className="text-blue-500 hover:text-blue-700 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add School Type */}
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id && !newCurriculumForm.schoolTypeIds.includes(id)) {
                            setNewCurriculumForm((prev) => ({
                              ...prev,
                              schoolTypeIds: [...prev.schoolTypeIds, id],
                            }));
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                      >
                        <option value="">เลือกประเภทเพื่อเพิ่ม...</option>
                        {schoolTypes
                          .filter((st) => !newCurriculumForm.schoolTypeIds.includes(st.id))
                          .map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">เลือกได้หลายประเภท หรือไม่เลือกเลยเพื่อใช้ได้กับทุกประเภท</p>
                  </div>
                </>
              )}

              {/* School Form */}
              {activeTab === "schools" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ชื่อสถานศึกษา <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newSchoolForm.name}
                      onChange={(e) => setNewSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น โรงเรียนเตรียมอุดมศึกษา"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">รหัส (ถ้ามี)</label>
                    <input
                      type="text"
                      value={newSchoolForm.code}
                      onChange={(e) => setNewSchoolForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="เช่น TH-BKK-001"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">ประเภทสถานศึกษา <span className="text-red-500">*</span></label>
                    
                    {/* Selected School Types */}
                    {newSchoolForm.schoolTypeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newSchoolForm.schoolTypeIds.map((id) => {
                          const st = schoolTypes.find((s) => s.id === id);
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              <span>{st?.name}</span>
                              <button
                                type="button"
                                onClick={() => setNewSchoolForm((prev) => ({
                                  ...prev,
                                  schoolTypeIds: prev.schoolTypeIds.filter((sid) => sid !== id),
                                }))}
                                className="text-blue-500 hover:text-blue-700 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add School Type */}
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id && !newSchoolForm.schoolTypeIds.includes(id)) {
                            setNewSchoolForm((prev) => ({
                              ...prev,
                              schoolTypeIds: [...prev.schoolTypeIds, id],
                            }));
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                      >
                        <option value="">เลือกประเภทเพื่อเพิ่ม...</option>
                        {schoolTypes
                          .filter((st) => !newSchoolForm.schoolTypeIds.includes(st.id))
                          .map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">เลือกได้หลายประเภท (ต้องเลือกอย่างน้อย 1 ประเภท)</p>
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={newSchoolForm.isProjectBased}
                      onChange={(e) => setNewSchoolForm((prev) => ({ ...prev, isProjectBased: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Project-based</span>
                      <p className="text-xs text-gray-500">สถานศึกษาที่เน้นการเรียนรู้แบบโปรเจกต์</p>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                disabled={modalSaving}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleModalSubmit}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                disabled={modalSaving}
              >
                {modalSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">{getEditModalTitle()}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Edit Level Form */}
              {editLevelForm && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อระดับการศึกษา</label>
                  <input
                    type="text"
                    value={editLevelForm.name}
                    onChange={(e) => setEditLevelForm({ ...editLevelForm, name: e.target.value })}
                    placeholder="เช่น มัธยมศึกษาตอนปลาย"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    autoFocus
                  />
                </div>
              )}

              {/* Edit School Type Form */}
              {editSchoolTypeForm && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อประเภทสถานศึกษา</label>
                  <input
                    type="text"
                    value={editSchoolTypeForm.name}
                    onChange={(e) => setEditSchoolTypeForm({ ...editSchoolTypeForm, name: e.target.value })}
                    placeholder="เช่น โรงเรียน"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    autoFocus
                  />
                </div>
              )}

              {/* Edit Curriculum Form */}
              {editCurriculumForm && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ชื่อประเภทหลักสูตร</label>
                    <input
                      type="text"
                      value={editCurriculumForm.name}
                      onChange={(e) => setEditCurriculumForm({ ...editCurriculumForm, name: e.target.value })}
                      placeholder="เช่น ปกติ"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">ผระเภทสถานศึกษา (ถ้ามี)</label>
                    
                    {/* Selected School Types */}
                    {editCurriculumForm.schoolTypeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editCurriculumForm.schoolTypeIds.map((id) => {
                          const st = schoolTypes.find((s) => s.id === id);
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              <span>{st?.name}</span>
                              <button
                                type="button"
                                onClick={() => setEditCurriculumForm((prev) => ({
                                  ...prev!,
                                  schoolTypeIds: prev!.schoolTypeIds.filter((sid) => sid !== id),
                                }))}
                                className="text-blue-500 hover:text-blue-700 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add School Type */}
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id && !editCurriculumForm.schoolTypeIds.includes(id)) {
                            setEditCurriculumForm((prev) => ({
                              ...prev!,
                              schoolTypeIds: [...prev!.schoolTypeIds, id],
                            }));
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      >
                        <option value="">เลือกประเภทเพื่อเพิ่ม...</option>
                        {schoolTypes
                          .filter((st) => !editCurriculumForm.schoolTypeIds.includes(st.id))
                          .map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">เลือกได้หลายประเภท หรือไม่เลือกเลยเพื่อใช้ได้กับทุกประเภท</p>
                  </div>
                </>
              )}

              {/* Edit School Form */}
              {editSchoolForm && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ชื่อสถานศึกษา <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editSchoolForm.name}
                      onChange={(e) => setEditSchoolForm({ ...editSchoolForm, name: e.target.value })}
                      placeholder="เช่น โรงเรียนเตรียมอุดมศึกษา"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">รหัส (ถ้ามี)</label>
                    <input
                      type="text"
                      value={editSchoolForm.code}
                      onChange={(e) => setEditSchoolForm({ ...editSchoolForm, code: e.target.value })}
                      placeholder="เช่น TH-BKK-001"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">ประเภทสถานศึกษา <span className="text-red-500">*</span></label>
                    
                    {/* Selected School Types */}
                    {editSchoolForm.schoolTypeIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editSchoolForm.schoolTypeIds.map((id) => {
                          const st = schoolTypes.find((s) => s.id === id);
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              <span>{st?.name}</span>
                              <button
                                type="button"
                                onClick={() => setEditSchoolForm((prev) => ({
                                  ...prev!,
                                  schoolTypeIds: prev!.schoolTypeIds.filter((sid) => sid !== id),
                                }))}
                                className="text-blue-500 hover:text-blue-700 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add School Type */}
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id && !editSchoolForm.schoolTypeIds.includes(id)) {
                            setEditSchoolForm((prev) => ({
                              ...prev!,
                              schoolTypeIds: [...prev!.schoolTypeIds, id],
                            }));
                          }
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      >
                        <option value="">เลือกประเภทเพื่อเพิ่ม...</option>
                        {schoolTypes
                          .filter((st) => !editSchoolForm.schoolTypeIds.includes(st.id))
                          .map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">เลือกได้หลายประเภท (ต้องเลือกอย่างน้อย 1 ประเภท)</p>
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={editSchoolForm.isProjectBased}
                      onChange={(e) => setEditSchoolForm({ ...editSchoolForm, isProjectBased: e.target.checked })}
                      className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-blue-400"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Project-based</span>
                      <p className="text-xs text-gray-500">สถานศึกษาที่เน้นการเรียนรู้แบบโปรเจกต์</p>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                disabled={modalSaving}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={modalSaving}
              >
                {modalSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 text-center">ยืนยันการลบ</h3>
              <p className="text-gray-600 text-center">{confirmState.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center gap-3">
              <button
                onClick={() => setConfirmState({ open: false, message: "", onConfirm: null, working: false })}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                disabled={confirmState.working}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => confirmState.onConfirm?.()}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={confirmState.working}
              >
                {confirmState.working ? "กำลังลบ..." : "ลบข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
