"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Award,
  BookOpen,
  MapPin,
  Briefcase, // Fallback icon
  Edit,
  Trash2,
  X,
  Save,
  Flag,
  Trophy,
  Layout,
  ExternalLink,
  Image as ImageIcon,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  getActivities,
  getActivitiesByUser,
  createActivity,
  deleteActivity,
  updateActivity,
  getTypeActivities,
  getLevelActivities,
  getRewards,
  Activity,
  TypeActivity,
  LevelActivity,
  Reward,
  uploadImage,
} from "../../../services/activity";

export default function ActivityUI() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [types, setTypes] = useState<TypeActivity[]>([]);
  const [levels, setLevels] = useState<LevelActivity[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // Modal states
  const [viewModal, setViewModal] = useState<Activity | null>(null);
  const [editModal, setEditModal] = useState<Activity | null>(null);
  const [imageViewer, setImageViewer] = useState<string[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form states
  const [name, setName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [rewardId, setRewardId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ================= LOAD ================= */

  const loadAll = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || user?.ID ? Number(user?.id || user?.ID) : 0;

    try {
      const [act, t, l, r] = await Promise.all([
        userId ? getActivitiesByUser(userId) : Promise.resolve([]),
        getTypeActivities(),
        getLevelActivities(),
        getRewards(),
      ]);
      setActivities(act || []);
      setTypes(t || []);
      setLevels(l || []);
      setRewards(r || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ================= HANDLERS ================= */

  const handleEdit = (activity: Activity) => {
    setEditModal(activity);
    setName(activity.activity_name);
    setRewardId(activity.reward_id.toString());

    if (activity.activity_detail) {
      setActivityDate(activity.activity_detail.activity_at.split('T')[0]);
      setInstitution(activity.activity_detail.institution);
      setDescription(activity.activity_detail.description);
      setTypeId(activity.activity_detail.type_activity_id.toString());
      setLevelId(activity.activity_detail.level_activity_id.toString());
    }
    setImages([]);
  };

  const handleSaveEdit = async () => {
    if (!editModal || !name || !typeId || !levelId || !rewardId || !activityDate) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      const existingImages = editModal.activity_detail?.images || [];
      const imagePayload = [
        ...existingImages.map(img => ({ image_url: img.image_url })),
        ...uploadedUrls.map(url => ({ image_url: url }))
      ];

      await updateActivity(editModal.ID, {
        activity_name: name,
        reward_id: Number(rewardId),
        activity_detail: {
          activity_at: new Date(activityDate).toISOString(),
          institution,
          description,
          type_activity_id: Number(typeId),
          level_activity_id: Number(levelId),
          images: imagePayload,
        },
      });

      setEditModal(null);
      resetForm();
      loadAll();
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicated")) {
        alert("ชื่อกิจกรรมนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        // console.error(error);
        alert(error instanceof Error ? error.message : "Error updating activity");
      }
    }
  };

  const handleCreate = async () => {
    if (!name || !typeId || !levelId || !rewardId || !activityDate) {
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
        image_url: url
      }));

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || user?.ID ? Number(user?.id || user?.ID) : undefined;

      await createActivity({
        activity_name: name,
        reward_id: Number(rewardId),
        user_id: userId,
        activity_detail: {
          activity_at: new Date(activityDate).toISOString(),
          institution,
          description,
          type_activity_id: Number(typeId),
          level_activity_id: Number(levelId),
          images: imagePayload,
        },
      });

      resetForm();
      setActiveTab("list");
      loadAll();
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicated")) {
        alert("ชื่อกิจกรรมนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        // console.error(error);
        alert(error instanceof Error ? error.message : "Error creating activity");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบกิจกรรมนี้?")) return;
    try {
      await deleteActivity(id);
      loadAll();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const resetForm = () => {
    setName("");
    setActivityDate("");
    setInstitution("");
    setDescription("");
    setTypeId("");
    setLevelId("");
    setLevelId("");
    setRewardId("");
    setImages([]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const openImageViewer = (imgs: string[], index: number) => {
    setImageViewer(imgs);
    setCurrentImageIndex(index);
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1500px] p-6">
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {activeTab === 'create' ? 'สร้างกิจกรรมใหม่' : 'กิจกรรมทั้งหมด'}
            </h2>
            <p className="text-gray-600 mt-2">
              {activeTab === 'create' ? 'กรอกข้อมูลกิจกรรมของคุณ' : 'Activities & Competitions'}
            </p>
          </div>

          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg bg-[#FF6B35]"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างกิจกรรม
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
              {activities.map((act) => (
                <motion.div
                  key={act.ID}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100 relative group flex flex-col hover:shadow-xl transition-all"
                >
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewModal(act)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <BookOpen size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(act)}
                      className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(act.ID)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mb-4 pr-24">
                    <h3 className="text-xl font-bold text-neutral-800 line-clamp-2 mb-2">
                      {act.activity_name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Tags for Level, Type, Reward */}
                    {act.activity_detail?.level_activity && (
                      <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        {act.activity_detail.level_activity.level_name}
                      </span>
                    )}
                    {act.activity_detail?.type_activity && (
                      <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                        {act.activity_detail.type_activity.type_name}
                      </span>
                    )}
                    {act.reward && (
                      <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                        <Award size={12} />
                        {act.reward.level_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
                    <Calendar size={16} />
                    {act.activity_detail && new Date(act.activity_detail.activity_at).toLocaleDateString("th-TH")}
                  </div>

                  {act.activity_detail?.institution && (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <MapPin size={16} />
                      {act.activity_detail.institution}
                    </div>
                  )}

                  {/* Images preview */}
                  {act.activity_detail?.images && act.activity_detail.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                      {act.activity_detail.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={img.ID}
                          src={img.image_url}
                          alt="activity"
                          onClick={() =>
                            openImageViewer(
                              act.activity_detail!.images!.map((i) => i.image_url),
                              idx
                            )
                          }
                          className="w-16 h-16 object-cover rounded-lg border border-neutral-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        />
                      ))}
                      {act.activity_detail.images.length > 3 && (
                        <div className="w-16 h-16 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-xs text-neutral-500 font-semibold shrink-0">
                          +{act.activity_detail.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              ))}
            </AnimatePresence>

            {activities.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy size={32} />
                </div>
                <p className="text-neutral-500">ยังไม่มีข้อมูลกิจกรรม</p>
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
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  setImages([...images, ...Array.from(e.target.files)]);
                }
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">ชื่อกิจกรรม</label>
                <input
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  placeholder="เช่น แข่งขันหุ่นยนต์"
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">หน่วยงานที่จัด</label>
                <input
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  placeholder="เช่น สมาคม..."
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">วันที่เข้าร่วม</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">ประเภทกิจกรรม</label>
                <select
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                >
                  <option value="">เลือกประเภท</option>
                  {types.map((t) => (
                    <option key={t.ID} value={t.ID}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">ระดับกิจกรรม</label>
                <select
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                >
                  <option value="">เลือกระดับ</option>
                  {levels.map((l) => (
                    <option key={l.ID} value={l.ID}>
                      {l.level_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 ml-1">รางวัลที่ได้รับ</label>
                <select
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                  value={rewardId}
                  onChange={(e) => setRewardId(e.target.value)}
                >
                  <option value="">เลือกรางวัล</option>
                  {rewards.map((r) => (
                    <option key={r.ID} value={r.ID}>
                      {r.level_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700 ml-1">รายละเอียดเพิ่มเติม</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors resize-none"
                rows={4}
                placeholder="รายละเอียดสิ่งทีทำ..."
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Images */}
            <div>
              <p className="font-semibold mb-3 flex items-center gap-2 text-neutral-700">
                <ImageIcon className="w-5 h-5" /> รูปกิจกรรม
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

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-gradient-to-r from-[#FF6414] to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              บันทึกข้อมูลกิจกรรม
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
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#FF6414] to-orange-600 p-6 flex justify-between items-start rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {viewModal.activity_name}
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {viewModal.activity_detail?.level_activity && (
                      <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-lg backdrop-blur-sm">
                        {viewModal.activity_detail.level_activity.level_name}
                      </span>
                    )}
                    {viewModal.reward && (
                      <span className="text-xs px-2 py-1 bg-yellow-400/30 text-yellow-50 rounded-lg backdrop-blur-sm flex items-center gap-1">
                        <Award size={12} /> {viewModal.reward.level_name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">วันที่ทำกิจกรรม</p>
                    <p className="font-medium text-neutral-800 flex items-center gap-2">
                      <Calendar size={18} className="text-[#FF6414]" />
                      {viewModal.activity_detail && new Date(viewModal.activity_detail.activity_at).toLocaleDateString("th-TH", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">ประเภท</p>
                    <p className="font-medium text-neutral-800 flex items-center gap-2">
                      <Layout size={18} className="text-[#FF6414]" />
                      {viewModal.activity_detail?.type_activity?.type_name || "-"}
                    </p>
                  </div>
                </div>

                {viewModal.activity_detail?.institution && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">หน่วยงานที่จัด</p>
                    <p className="font-medium text-neutral-800 flex items-center gap-2">
                      <MapPin size={18} className="text-[#FF6414]" />
                      {viewModal.activity_detail.institution}
                    </p>
                  </div>
                )}

                {viewModal.activity_detail?.description && (
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                      รายละเอียด
                    </h3>
                    <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                      {viewModal.activity_detail.description}
                    </p>
                  </div>
                )}

                {viewModal.activity_detail?.images && viewModal.activity_detail.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-3">รูปภาพ</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {viewModal.activity_detail.images.map((img, idx) => (
                        <img
                          key={img.ID}
                          src={img.image_url}
                          alt="activity"
                          onClick={() =>
                            openImageViewer(
                              viewModal.activity_detail!.images!.map((i) => i.image_url),
                              idx
                            )
                          }
                          className="w-full h-32 object-cover rounded-xl border border-neutral-200 cursor-pointer hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
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
                  แก้ไขกิจกรรม
                </h2>
                <button
                  onClick={() => setEditModal(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">ชื่อกิจกรรม</label>
                    <input
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      placeholder="เช่น แข่งขันหุ่นยนต์"
                      value={name}
                      maxLength={50}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">หน่วยงานที่จัด</label>
                    <input
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      placeholder="เช่น สมาคม..."
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">วันที่เข้าร่วม</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">ประเภทกิจกรรม</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      value={typeId}
                      onChange={(e) => setTypeId(e.target.value)}
                    >
                      <option value="">เลือกประเภท</option>
                      {types.map((t) => (
                        <option key={t.ID} value={t.ID}>
                          {t.type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">ระดับกิจกรรม</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      value={levelId}
                      onChange={(e) => setLevelId(e.target.value)}
                    >
                      <option value="">เลือกระดับ</option>
                      {levels.map((l) => (
                        <option key={l.ID} value={l.ID}>
                          {l.level_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-700 ml-1">รางวัลที่ได้รับ</label>
                    <select
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors"
                      value={rewardId}
                      onChange={(e) => setRewardId(e.target.value)}
                    >
                      <option value="">เลือกรางวัล</option>
                      {rewards.map((r) => (
                        <option key={r.ID} value={r.ID}>
                          {r.level_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700 ml-1">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-orange-500 outline-none transition-colors resize-none"
                    rows={4}
                    placeholder="รายละเอียดสิ่งทีทำ..."
                    value={description}
                    maxLength={200}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Existing Images */}
                {editModal.activity_detail?.images && editModal.activity_detail.images.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3 text-neutral-700">รูปภาพปัจจุบัน</p>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {editModal.activity_detail.images.map((img) => (
                        <div key={img.ID} className="relative group">
                          <img
                            src={img.image_url}
                            alt="activity"
                            className="w-full h-24 object-cover rounded-xl border-2 border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImages = editModal.activity_detail!.images!.filter(i => i.ID !== img.ID);
                              setEditModal({
                                ...editModal,
                                activity_detail: {
                                  ...editModal.activity_detail!,
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

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-3 bg-gradient-to-r from-[#FF6414] to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setImageViewer(null)}
          >
            <button
              onClick={() => setImageViewer(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === 0 ? imageViewer.length - 1 : prev - 1));
              }}
              className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={imageViewer[currentImageIndex]}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === imageViewer.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imageViewer.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === i ? "bg-white scale-125" : "bg-white/50"
                    }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}