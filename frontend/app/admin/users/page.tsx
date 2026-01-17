"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserTypeName,
  getIDTypeName,
  formatDate,
  UserDTO,
  CreateUserPayload,
  UpdateUserPayload,
  HttpError,
} from "@/services/user";
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit2, 
  Trash2, 
  Users, 
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import "./admin-users.css";

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  const [formData, setFormData] = useState({
    first_name_th: "",
    last_name_th: "",
    first_name_en: "",
    last_name_en: "",
    email: "",
    password: "",
    id_number: "",
    phone: "",
    birthday: "",
    pdpa_consent: true,
    type_id: 1,
    id_type: 1,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

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

  useEffect(() => {
    if (!isAuthorized) return;
    loadUsers();
  }, [isAuthorized]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.first_name_th?.toLowerCase().includes(query) ||
        user.last_name_th?.toLowerCase().includes(query) ||
        user.first_name_en?.toLowerCase().includes(query) ||
        user.last_name_en?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const normalizedEmail = formData.email.trim().toLowerCase();
    const currentUserId = selectedUser?.id || selectedUser?.ID;

    // ต้องกรอกเฉพาะภาษาที่เลือก
    if (nameLanguage === "thai") {
      if (!formData.first_name_th.trim()) errors.first_name_th = "กรุณากรอกชื่อ (ไทย)";
      if (!formData.last_name_th.trim()) errors.last_name_th = "กรุณากรอกนามสกุล (ไทย)";
    } else {
      if (!formData.first_name_en.trim()) errors.first_name_en = "กรุณากรอกชื่อ (อังกฤษ)";
      if (!formData.last_name_en.trim()) errors.last_name_en = "กรุณากรอกนามสกุล (อังกฤษ)";
    }

    if (!formData.email.trim()) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    } else {
      const emailExists = users.some((u) => {
        const uId = u.id || u.ID;
        const uEmailNormalized = (u.email ?? "").trim().toLowerCase();
        return uEmailNormalized === normalizedEmail && uId !== currentUserId;
      });
      if (emailExists) {
        errors.email = "อีเมลนี้ถูกใช้งานแล้ว";
      }
    }

    if (modalMode === "create" && !formData.password.trim()) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    if (!formData.phone.trim()) {
      errors.phone = "กรุณากรอกเบอร์โทร";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
    }

    if (!formData.birthday.trim()) {
      errors.birthday = "กรุณาเลือกวันเกิด";
    }

    if (!formData.id_number.trim()) {
      errors.id_number = "กรุณากรอกเลขเอกสารยืนยันตัวตน";
    } else {
      if (formData.id_type === 1 && !/^[0-9]{13}$/.test(formData.id_number)) {
        errors.id_number = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
      }
      const idExists = users.some((u) => {
        const uId = u.id || u.ID;
        return u.id_number === formData.id_number && uId !== currentUserId;
      });
      if (idExists) {
        errors.id_number = "เลขเอกสารนี้ถูกใช้งานแล้ว";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (mode: "create" | "edit" | "view", user?: UserDTO) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setFormErrors({});

    if (mode === "create") {
      setFormData({
        first_name_th: "",
        last_name_th: "",
        first_name_en: "",
        last_name_en: "",
        email: "",
        password: "",
        id_number: "",
        phone: "",
        birthday: "",
        pdpa_consent: true,
        type_id: 1,
        id_type: 1,
      });
      setNameLanguage("thai");
    } else if (mode === "edit" && user) {
      const formatDateForInput = (dateString?: string): string => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };

      setFormData({
        first_name_th: user.first_name_th || "",
        last_name_th: user.last_name_th || "",
        first_name_en: user.first_name_en || "",
        last_name_en: user.last_name_en || "",
        email: user.email || "",
        password: "",
        id_number: user.id_number || "",
        phone: user.phone || "",
        birthday: formatDateForInput(user.birthday),
        pdpa_consent: user.pdpa_consent ?? true,
        type_id: user.type_id || 1,
        id_type: user.id_type || 1,
      });
      const hasThaiName = !!(user.first_name_th || user.last_name_th);
      setNameLanguage(hasThaiName ? "thai" : "english");
    } else if (mode === "view" && user) {
      const formatDateForInput = (dateString?: string): string => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };

      setFormData({
        first_name_th: user.first_name_th || "",
        last_name_th: user.last_name_th || "",
        first_name_en: user.first_name_en || "",
        last_name_en: user.last_name_en || "",
        email: user.email || "",
        password: "",
        id_number: user.id_number || "",
        phone: user.phone || "",
        birthday: formatDateForInput(user.birthday),
        pdpa_consent: user.pdpa_consent ?? true,
        type_id: user.type_id || 1,
        id_type: user.id_type || 1,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormErrors({});
    setNameLanguage("thai");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      if (modalMode === "create") {
        const payload = {
          ...formData,
          type_id: Number(formData.type_id),
          id_type: Number(formData.id_type),
        };

        await createUser(payload as CreateUserPayload);
        toast.success("เพิ่มผู้ใช้สำเร็จ");
      } else if (modalMode === "edit" && selectedUser) {
        const userId = selectedUser.id || selectedUser.ID;
        if (!userId) throw new Error("ไม่พบ ID ของผู้ใช้");

        const updatePayload: UpdateUserPayload = {
          ...formData,
          type_id: Number(formData.type_id),
          id_type: Number(formData.id_type),
        };

        if (!formData.password) {
          delete updatePayload.password;
        }

        await updateUser(userId, updatePayload);
        toast.success("บันทึกการแก้ไขสำเร็จ");
      }
      closeModal();
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      toast.error(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (user: UserDTO) => {
    setDeleteTarget(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id || deleteTarget.ID;
    if (!userId) {
      toast.error("ไม่พบ ID ของผู้ใช้");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("ลบผู้ใช้สำเร็จ");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ได้");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (!isAuthorized) return null;

  return (
    <div className="admin-users-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Users className="w-10 h-10 text-orange-500" />
          </div>
          <div>
            <h1 className="page-title">จัดการผู้ใช้</h1>
            <p className="page-subtitle">จัดการข้อมูลผู้ใช้ทั้งหมดในระบบ</p>
          </div>
        </div>
        <div className="stats-badge">
          <Users className="w-4 h-4" />
          <span>ผู้ใช้ทั้งหมด: <strong>{users.length}</strong></span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="search-actions-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="ค้นหาผู้ใช้"
          />
        </div>
        <button onClick={() => openModal("create")} className="btn-add-user">
          <UserPlus className="w-5 h-5" />
          <span>เพิ่มผู้ใช้</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="loading-spinner" />
          <p className="loading-text">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="table-wrapper">
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ชื่อ-นามสกุล</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทร</th>
                    <th>ประเภท</th>
                    <th>สร้างเมื่อ</th>
                    <th className="text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        <Users className="empty-icon" />
                        <p className="empty-text">
                          {searchQuery ? "ไม่พบผู้ใช้ที่ตรงกับการค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const userId = user.id || user.ID;
                      const badgeClass =
                        user.type_id === 3 ? "badge-admin" :
                        user.type_id === 2 ? "badge-teacher" : "badge-student";

                      return (
                        <tr key={userId} className="table-row">
                          <td>
                            <div className="user-info">
                              <div className="user-name-primary">
                                {user.first_name_th} {user.last_name_th}
                              </div>
                              <div className="user-name-secondary">
                                {user.first_name_en} {user.last_name_en}
                              </div>
                            </div>
                          </td>
                          <td className="email-cell">{user.email}</td>
                          <td className="phone-cell">{user.phone}</td>
                          <td>
                            <span className={`user-badge ${badgeClass}`}>
                              {getUserTypeName(user.type_id)}
                            </span>
                          </td>
                          <td className="date-cell">
                            {user.CreatedAt ? formatDate(user.CreatedAt) : "-"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => openModal("view", user)}
                                className="btn-action btn-view"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal("edit", user)}
                                className="btn-action btn-edit"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="btn-action btn-delete"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Result Count */}
          <div className="result-count">
            แสดง <strong>{filteredUsers.length}</strong> จาก <strong>{users.length}</strong> ผู้ใช้
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "create" && "เพิ่มผู้ใช้ใหม่"}
                {modalMode === "edit" && "แก้ไขข้อมูลผู้ใช้"}
                {modalMode === "view" && "รายละเอียดผู้ใช้"}
              </h2>
              <button onClick={closeModal} className="btn-close-modal" title="ปิด">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="modal-body">
              {modalMode === "view" && selectedUser ? (
                <div className="view-grid">
                  <div>
                    <div className="view-field-label">ชื่อ (ภาษาไทย)</div>
                    <div className="view-field-value">
                      {selectedUser.first_name_th} {selectedUser.last_name_th}
                    </div>
                  </div>
                  <div>
                    <div className="view-field-label">ชื่อ (ภาษาอังกฤษ)</div>
                    <div className="view-field-value">
                      {selectedUser.first_name_en} {selectedUser.last_name_en}
                    </div>
                  </div>
                  <div>
                    <div className="view-field-label">อีเมล</div>
                    <div className="view-field-value">{selectedUser.email}</div>
                  </div>
                  <div>
                    <div className="view-field-label">เบอร์โทร</div>
                    <div className="view-field-value">{selectedUser.phone}</div>
                  </div>
                  <div>
                    <div className="view-field-label">วันเกิด</div>
                    <div className="view-field-value">
                      {selectedUser.birthday ? formatDate(selectedUser.birthday) : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="view-field-label">ประเภทผู้ใช้</div>
                    <div className="view-field-value">{getUserTypeName(selectedUser.type_id)}</div>
                  </div>
                  <div>
                    <div className="view-field-label">ประเภทเอกสาร</div>
                    <div className="view-field-value">{getIDTypeName(selectedUser.id_type)}</div>
                  </div>
                  <div>
                    <div className="view-field-label">เลขเอกสาร</div>
                    <div className="view-field-value">{selectedUser.id_number}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="modal-form">
                  {/* Language Toggle */}
                  <div className="form-group-inline">
                    <label className="form-label">
                      เลือกภาษาชื่อ
                      <span className="form-label-secondary"> (กรอกได้เพียงภาษาเดียว)</span>
                    </label>
                    <div className="language-toggle">
                      <button
                        type="button"
                        onClick={() => setNameLanguage("thai")}
                        className={`toggle-btn ${nameLanguage === "thai" ? "active" : ""}`}
                      >
                        ภาษาไทย
                      </button>
                      <button
                        type="button"
                        onClick={() => setNameLanguage("english")}
                        className={`toggle-btn ${nameLanguage === "english" ? "active" : ""}`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  {nameLanguage === "thai" ? (
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="first_name_th" className="form-label">ชื่อ (ไทย) *</label>
                        <input
                          id="first_name_th"
                          type="text"
                          placeholder="ชื่อภาษาไทย"
                          value={formData.first_name_th}
                          onChange={(e) => setFormData({ ...formData, first_name_th: e.target.value })}
                          className={`form-input ${formErrors.first_name_th ? "error" : ""}`}
                        />
                        {formErrors.first_name_th && (
                          <div className="error-text">{formErrors.first_name_th}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="last_name_th" className="form-label">นามสกุล (ไทย) *</label>
                        <input
                          id="last_name_th"
                          type="text"
                          placeholder="นามสกุลภาษาไทย"
                          value={formData.last_name_th}
                          onChange={(e) => setFormData({ ...formData, last_name_th: e.target.value })}
                          className={`form-input ${formErrors.last_name_th ? "error" : ""}`}
                        />
                        {formErrors.last_name_th && (
                          <div className="error-text">{formErrors.last_name_th}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="first_name_en" className="form-label">First Name *</label>
                        <input
                          id="first_name_en"
                          type="text"
                          placeholder="First Name"
                          value={formData.first_name_en}
                          onChange={(e) => setFormData({ ...formData, first_name_en: e.target.value })}
                          className={`form-input ${formErrors.first_name_en ? "error" : ""}`}
                        />
                        {formErrors.first_name_en && (
                          <div className="error-text">{formErrors.first_name_en}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label htmlFor="last_name_en" className="form-label">Last Name *</label>
                        <input
                          id="last_name_en"
                          type="text"
                          placeholder="Last Name"
                          value={formData.last_name_en}
                          onChange={(e) => setFormData({ ...formData, last_name_en: e.target.value })}
                          className={`form-input ${formErrors.last_name_en ? "error" : ""}`}
                        />
                        {formErrors.last_name_en && (
                          <div className="error-text">{formErrors.last_name_en}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email & Password */}
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">อีเมล *</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`form-input ${formErrors.email ? "error" : ""}`}
                      />
                      {formErrors.email && <div className="error-text">{formErrors.email}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        รหัสผ่าน {modalMode === "edit" && "(เว้นว่างถ้าไม่เปลี่ยน)"}
                        {modalMode === "create" && "*"}
                      </label>
                      <input
                        id="password"
                        type="password"
                        placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`form-input ${formErrors.password ? "error" : ""}`}
                      />
                      {formErrors.password && <div className="error-text">{formErrors.password}</div>}
                    </div>
                  </div>

                  {/* Phone & Birthday */}
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">เบอร์โทร *</label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="0812345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`form-input ${formErrors.phone ? "error" : ""}`}
                      />
                      {formErrors.phone && <div className="error-text">{formErrors.phone}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="birthday" className="form-label">วันเกิด *</label>
                      <input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className={`form-input ${formErrors.birthday ? "error" : ""}`}
                      />
                      {formErrors.birthday && <div className="error-text">{formErrors.birthday}</div>}
                    </div>
                  </div>

                  {/* ID Type & Number */}
                  <div className="form-group">
                    <label className="form-label">ประเภทเอกสารยืนยันตัวตน *</label>
                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="id_type" className="form-label-sub">ประเภทเอกสาร</label>
                        <select
                          id="id_type"
                          value={formData.id_type}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setFormData({ ...formData, id_type: value });
                          }}
                          className={`form-select ${formErrors.id_type ? "error" : ""}`}
                          aria-label="เลือกประเภทเอกสารยืนยันตัวตน"
                        >
                          <option value={1}>บัตรประชาชน</option>
                          <option value={2}>G-Code</option>
                          <option value={3}>Passport</option>
                        </select>
                        {formErrors.id_type && <div className="error-text">{formErrors.id_type}</div>}
                      </div>
                      <div>
                        <label htmlFor="id_number" className="form-label-sub">เลขเอกสาร</label>
                        <input
                          id="id_number"
                          type="text"
                          placeholder={
                            formData.id_type === 1
                              ? "เลขบัตรประชาชน 13 หลัก"
                              : formData.id_type === 2
                              ? "G-Code"
                              : "Passport Number"
                          }
                          value={formData.id_number}
                          onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                          className={`form-input ${formErrors.id_number ? "error" : ""}`}
                        />
                        {formErrors.id_number && <div className="error-text">{formErrors.id_number}</div>}
                      </div>
                    </div>
                  </div>

                  {/* User Type */}
                  <div className="form-group">
                    <label htmlFor="type_id" className="form-label">ประเภทผู้ใช้ *</label>
                    <select
                      id="type_id"
                      value={formData.type_id}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData({ ...formData, type_id: value });
                      }}
                      className={`form-select ${formErrors.type_id ? "error" : ""}`}
                      aria-label="เลือกประเภทผู้ใช้"
                    >
                      <option value={1}>นักเรียน</option>
                      <option value={2}>ครู</option>
                      <option value={3}>แอดมิน</option>
                    </select>
                    {formErrors.type_id && <div className="error-text">{formErrors.type_id}</div>}
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={submitLoading}
                      className="btn-cancel"
                    >
                      ยกเลิก
                    </button>
                    <button type="submit" disabled={submitLoading} className="btn-submit">
                      {submitLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{modalMode === "create" ? "เพิ่มผู้ใช้" : "บันทึกการเปลี่ยนแปลง"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ยืนยันการลบผู้ใช้</h2>
              <button onClick={cancelDelete} className="btn-close-modal" title="ปิด">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                ต้องการลบผู้ใช้ &quot;{deleteTarget.first_name_th} {deleteTarget.last_name_th}&quot; จริงหรือไม่?
              </p>
              <div className="form-actions">
                <button type="button" onClick={cancelDelete} className="btn-cancel">
                  ยกเลิก
                </button>
                <button type="button" onClick={confirmDelete} className="btn-delete-confirm">
                  <Trash2 className="w-4 h-4" />
                  <span>ลบผู้ใช้</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}