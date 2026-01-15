"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Image as ImageIcon,
  Link2,
  XCircle,
  Briefcase,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getWorkings,
  getWorkingsByUser,
  getTypeWorkings,
  createWorking,
  deleteWorking,
  updateWorking,
  Working,
  TypeWorking,
  uploadImage,
} from "../../../services/working";

/* ================= COMPONENT ================= */

export default function WorkingUI() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [workings, setWorkings] = useState<Working[]>([]);
  const [types, setTypes] = useState<TypeWorking[]>([]);

  // Modal states
  const [viewModal, setViewModal] = useState<Working | null>(null);
  const [editModal, setEditModal] = useState<Working | null>(null);
  const [imageViewer, setImageViewer] = useState<string[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form states
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("pending");
  const [typeId, setTypeId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ================= LOAD ================= */

  const loadAll = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || user?.ID ? Number(user?.id || user?.ID) : 0;

    try {
      const [w, t] = await Promise.all([
        userId ? getWorkingsByUser(userId) : Promise.resolve([]),
        getTypeWorkings()
      ]);
      setWorkings(w || []);
      setTypes(t || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ================= HANDLERS ================= */

  const handleView = (working: Working) => {
    setViewModal(working);
  };

  const handleEdit = (working: Working) => {
    setEditModal(working);
    setTitle(working.working_name);
    setStatus(working.status);
    setTypeId(working.working_detail?.type_working_id?.toString() || "");
    setDate(working.working_detail?.working_at?.split('T')[0] || "");
    setDescription(working.working_detail?.description || "");
    setLinks(working.working_detail?.links?.map(l => l.working_link) || []);
    setImages([]);
  };

  const handleSaveEdit = async () => {
    if (!editModal || !title || !typeId || !date) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      const existingImages = editModal.working_detail?.images || [];
      const imagePayload = [
        ...existingImages.map(img => ({ working_image_url: img.working_image_url })),
        ...uploadedUrls.map(url => ({ working_image_url: url }))
      ];

      const linkPayload = links.filter(l => l.trim().length > 0).map(l => ({
        working_link: l
      }));

      await updateWorking(editModal.ID, {
        working_name: title,
        status,
        working_detail: {
          working_at: new Date(date).toISOString(),
          description,
          type_working_id: Number(typeId),
          images: imagePayload,
          links: linkPayload,
        },
      });

      setEditModal(null);
      resetForm();
      loadAll();
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicated")) {
        alert("ชื่อผลงานนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        console.error(error);
        alert(error instanceof Error ? error.message : "Error updating working");
      }
    }
  };

  const handleCreate = async () => {
    if (!title || !typeId || !date) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      const imagePayload = uploadedUrls.map(url => ({
        working_image_url: url
      }));

      const linkPayload = links.filter(l => l.trim().length > 0).map(l => ({
        working_link: l
      }));

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || user?.ID ? Number(user?.id || user?.ID) : undefined;

      await createWorking({
        working_name: title,
        status,
        user_id: userId,
        working_detail: {
          working_at: new Date(date).toISOString(),
          description,
          type_working_id: Number(typeId),
          images: imagePayload,
          links: linkPayload,
        },
      });

      resetForm();
      setActiveTab("list");
      loadAll();
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicated")) {
        alert("ชื่อผลงานนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        console.error(error);
        alert(error instanceof Error ? error.message : "Error creating working");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบผลงานนี้?")) return;
    try {
      await deleteWorking(id);
      loadAll();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const resetForm = () => {
    setTitle("");
    setStatus("pending");
    setTypeId("");
    setDate("");
    setDescription("");
    setImages([]);
    setLinks([]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const openImageViewer = (imgs: string[], index: number) => {
    setImageViewer(imgs);
    setCurrentImageIndex(index);
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "เสร็จสิ้น" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "กำลังดำเนินการ" },
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "รอดำเนินการ" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-700", label: "ยกเลิก" }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1500px] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {activeTab === 'create' ? 'สร้างผลงานใหม่' : 'ผลงานทั้งหมด'}
            </h2>
            <p className="text-gray-600 mt-2">
              {activeTab === 'create' ? 'กรอกข้อมูลผลงานของคุณ' : 'Working Portfolio'}
            </p>
          </div>

          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg bg-[#FF6B35]"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างผลงาน
              </span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
          )}
        </div>

        {/* ---------- LIST ---------- */}
        {activeTab === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {workings.map((w) => (
                <motion.div
                  key={w.ID}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100 relative group flex flex-col h-full hover:shadow-xl transition-all"
                >
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleView(w)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(w)}
                      className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(w.ID)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-24">
                    <h3 className="text-lg font-bold text-neutral-800 line-clamp-2">
                      {w.working_name}
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-3 py-1.5 rounded-lg w-fit mb-3 ${statusConfig[w.status]?.bg || "bg-gray-100"
                      } ${statusConfig[w.status]?.text || "text-gray-700"}`}
                  >
                    {statusConfig[w.status]?.label || w.status}
                  </span>

                  <div className="flex-1 text-sm text-neutral-500 space-y-3">
                    {w.working_detail && (
                      <>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Calendar size={14} />
                          {new Date(w.working_detail.working_at).toLocaleDateString("th-TH")}
                        </div>
                        <p className="line-clamp-3 text-neutral-600">
                          {w.working_detail.description}
                        </p>

                        {w.working_detail.type_working && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                            <p className="font-semibold text-neutral-700">
                              {w.working_detail.type_working.type_name}
                            </p>
                          </div>
                        )}

                        {/* Images preview */}
                        {w.working_detail.images && w.working_detail.images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                            {w.working_detail.images.slice(0, 3).map((img, idx) => (
                              <img
                                key={img.ID}
                                src={img.working_image_url}
                                alt="work"
                                onClick={() =>
                                  openImageViewer(
                                    w.working_detail!.images!.map((i) => i.working_image_url),
                                    idx
                                  )
                                }
                                className="w-16 h-16 object-cover rounded-lg border border-neutral-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              />
                            ))}
                            {w.working_detail.images.length > 3 && (
                              <div className="w-16 h-16 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-xs text-neutral-500 font-semibold shrink-0">
                                +{w.working_detail.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Links preview */}
                        {w.working_detail.links && w.working_detail.links.length > 0 && (
                          <div className="flex items-center gap-2 text-blue-500 text-xs">
                            <ExternalLink size={12} />
                            <span>{w.working_detail.links.length} ลิงก์</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {workings.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={32} />
                </div>
                <p className="text-neutral-500">ยังไม่มีข้อมูลผลงาน</p>
              </div>
            )}
          </div>
        )}

        {/* ---------- CREATE ---------- */}
        {activeTab === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="space-y-1">
              <input
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                placeholder="ชื่อผลงาน"
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-right text-xs text-neutral-400">{title.length}/50</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
              >
                <option value="">เลือกประเภทงาน</option>
                {types.map((t) => (
                  <option key={t.ID} value={t.ID}>
                    {t.type_name}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">รอดำเนินการ</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>

              <input
                type="date"
                className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <textarea
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors resize-none"
                rows={4}
                placeholder="รายละเอียด"
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-right text-xs text-neutral-400">{description.length}/200</p>
            </div>

            {/* Images */}
            <div>
              <p className="font-semibold mb-3 flex items-center gap-2 text-neutral-700">
                <ImageIcon className="w-5 h-5" /> รูปผลงาน
              </p>

              <div className="flex gap-3 flex-wrap mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(img)}
                      className="w-24 h-24 object-cover rounded-xl border-2 border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[#FF6414] flex items-center gap-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus size={18} /> เพิ่มรูป
              </button>
            </div>

            {/* Links */}
            <div>
              <p className="font-semibold mb-3 flex items-center gap-2 text-neutral-700">
                <Link2 className="w-5 h-5" /> ลิงก์ผลงาน
              </p>

              {links.map((l, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                    placeholder="https://..."
                    value={l}
                    onChange={(e) => {
                      const copy = [...links];
                      copy[i] = e.target.value;
                      setLinks(copy);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                    className="text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  if (links.length >= 6) {
                    alert("เพิ่มลิงก์ได้สูงสุด 6 ลิงก์");
                    return;
                  }
                  setLinks([...links, ""]);
                }}
                className="text-[#FF6414] flex items-center gap-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus size={18} /> เพิ่มลิงก์
              </button>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-gradient-to-r from-[#FF6414] to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              บันทึกผลงาน
            </button>
          </motion.div>
        )}
      </div>

      {/* ========== VIEW MODAL ========== */}
      <AnimatePresence>
        {viewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#FF6414] to-orange-600 p-6 flex justify-between items-start rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {viewModal.working_name}
                  </h2>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-lg ${statusConfig[viewModal.status]?.bg || "bg-white/20"
                      } ${statusConfig[viewModal.status]?.text || "text-white"} bg-white/90`}
                  >
                    {statusConfig[viewModal.status]?.label || viewModal.status}
                  </span>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {viewModal.working_detail && (
                  <>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Calendar size={18} className="text-[#FF6414]" />
                      <span className="font-medium">
                        {new Date(viewModal.working_detail.working_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {viewModal.working_detail.type_working && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                        <span className="font-semibold text-neutral-700">
                          {viewModal.working_detail.type_working.type_name}
                        </span>
                      </div>
                    )}

                    {viewModal.working_detail.description && (
                      <div>
                        <h3 className="font-semibold text-neutral-800 mb-2">รายละเอียด</h3>
                        <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap break-words">
                          {viewModal.working_detail.description}
                        </p>
                      </div>
                    )}

                    {viewModal.working_detail.images && viewModal.working_detail.images.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-neutral-800 mb-3">รูปภาพ</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {viewModal.working_detail.images.map((img, idx) => (
                            <img
                              key={img.ID}
                              src={img.working_image_url}
                              alt="work"
                              onClick={() =>
                                openImageViewer(
                                  viewModal.working_detail!.images!.map((i) => i.working_image_url),
                                  idx
                                )
                              }
                              className="w-full h-32 object-cover rounded-xl border border-neutral-200 cursor-pointer hover:scale-105 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {viewModal.working_detail.links && viewModal.working_detail.links.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-neutral-800 mb-3">ลิงก์</h3>
                        <div className="space-y-2">
                          {viewModal.working_detail.links.map((link) => (
                            <a
                              key={link.ID}
                              href={link.working_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline p-3 bg-blue-50 rounded-lg transition-colors"
                            >
                              <ExternalLink size={16} />
                              <span className="truncate">{link.working_link}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== EDIT MODAL ========== */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex justify-between items-center rounded-t-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Edit size={24} />
                  แก้ไขผลงาน
                </h2>
                <button
                  onClick={() => setEditModal(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                  <input
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                    placeholder="ชื่อผลงาน"
                    value={title}
                    maxLength={50}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-right text-xs text-neutral-400">{title.length}/50</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                  >
                    <option value="">เลือกประเภทงาน</option>
                    {types.map((t) => (
                      <option key={t.ID} value={t.ID}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>

                  <input
                    type="date"
                    className="px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <textarea
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors resize-none"
                    rows={4}
                    placeholder="รายละเอียด"
                    value={description}
                    maxLength={200}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-right text-xs text-neutral-400">{description.length}/200</p>
                </div>

                {/* Existing Images */}
                {editModal.working_detail?.images && editModal.working_detail.images.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3 text-neutral-700">รูปภาพปัจจุบัน</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {editModal.working_detail.images.map((img) => (
                        <div key={img.ID} className="relative group">
                          <img
                            src={img.working_image_url}
                            alt="work"
                            className="w-full h-24 object-cover rounded-xl border-2 border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImages = editModal.working_detail!.images!.filter(i => i.ID !== img.ID);
                              setEditModal({
                                ...editModal,
                                working_detail: {
                                  ...editModal.working_detail!,
                                  images: updatedImages
                                }
                              });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                <div>
                  <p className="font-semibold mb-3 flex items-center gap-2 text-neutral-700">
                    <ImageIcon className="w-5 h-5" /> เพิ่มรูปใหม่
                  </p>

                  <div className="flex gap-3 flex-wrap mb-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(img)}
                          className="w-24 h-24 object-cover rounded-xl border-2 border-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[#FF6414] flex items-center gap-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <Plus size={18} /> เพิ่มรูป
                  </button>
                </div>

                {/* Links */}
                <div>
                  <p className="font-semibold mb-3 flex items-center gap-2 text-neutral-700">
                    <Link2 className="w-5 h-5" /> ลิงก์ผลงาน
                  </p>

                  {links.map((l, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                        placeholder="https://..."
                        value={l}
                        onChange={(e) => {
                          const copy = [...links];
                          copy[i] = e.target.value;
                          setLinks(copy);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                        className="text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      if (links.length >= 6) {
                        alert("เพิ่มลิงก์ได้สูงสุด 6 ลิงก์");
                        return;
                      }
                      setLinks([...links, ""]);
                    }}
                    className="text-[#FF6414] flex items-center gap-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <Plus size={18} /> เพิ่มลิงก์
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    บันทึกการแก้ไข
                  </button>
                  <button
                    onClick={() => setEditModal(null)}
                    className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== IMAGE VIEWER ========== */}
      <AnimatePresence>
        {imageViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setImageViewer(null)}
          >
            <button
              onClick={() => setImageViewer(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
            >
              <X size={28} />
            </button>

            {imageViewer.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? imageViewer.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-4 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
                >
                  <ChevronLeft size={32} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === imageViewer.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-4 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[90vh] w-full"
            >
              <img
                src={imageViewer[currentImageIndex]}
                alt="view"
                className="w-full h-full object-contain rounded-2xl"
              />
              {imageViewer.length > 1 && (
                <p className="text-white text-center mt-4 font-medium">
                  {currentImageIndex + 1} / {imageViewer.length}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hidden File Input (Always Rendered) */}
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          const currentCount = (editModal?.working_detail?.images?.length || 0) + images.length;
          const remaining = 6 - currentCount;

          if (remaining <= 0) {
            alert("สามารถเพิ่มรูปได้สูงสุด 6 รูป");
            return;
          }

          if (files.length > remaining) {
            alert(`เพิ่มได้อีก ${remaining} รูปเท่านั้น`);
            setImages(p => [...p, ...files.slice(0, remaining)]);
          } else {
            setImages(p => [...p, ...files]);
          }

          // Reset value to allow selecting same file again
          e.target.value = "";
        }}
      />
    </div>
  );
}