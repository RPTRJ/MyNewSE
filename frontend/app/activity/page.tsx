"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, Image as ImageIcon,
  XCircle, Award
} from "lucide-react";

// ---------------- Types -------------------

interface TypeActivity {
  id: number;
  type_name: string;
}

interface LevelActivity {
  id: number;
  level_name: string;
}

interface Reward {
  id: number;
  reward_name: string;
}

interface ActivityDetail {
  id: number;
  activity_at: string;
  institution: string;
  description: string;

  type_activity_id: number;
  type_activity?: TypeActivity;

  level_activity_id: number;
  level_activity?: LevelActivity;
}
interface ActivityImage {
  id: number;
  image_url: string;
  activity_detail_id: number;
}

interface Activity {
  id: number;
  activity_name: string;
  
  activity_detail_id: number;
  activity_detail?: ActivityDetail;
  reward_id: number;
  reward?: Reward;
  user_id: number;
  images?: ActivityImage[];
}

// ---------------- Component -------------------

const ActivityUI = () => {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // ---------------- Sample Data -------------------
  const activities: Activity[] = [
    {
      id: 1,
      activity_name: "แข่งขันเขียนโปรแกรมระดับชาติ",
      reward_id: 1,
      reward: { id: 1, reward_name: "เหรียญทองแดง" },

      user_id: 1,
      activity_detail_id: 1,
      activity_detail: {
        id: 1,
        activity_at: "2024-11-14T09:00",
        institution: "สมาคมคอมพิวเตอร์แห่งประเทศไทย",
        description: "เข้าร่วมแข่งขันระดับประเทศ ได้อันดับที่ 3",
        type_activity_id: 1,
        type_activity: { id: 1, type_name: "แข่งขัน" },
        level_activity_id: 2,
        level_activity: { id: 2, level_name: "ระดับชาติ" },
      },
      images: [
        { id: 1, image_url: "/images/award1.jpg", activity_detail_id: 1 },
      ]
    },
  ];

  const typeActivities: TypeActivity[] = [
    { id: 1, type_name: "แข่งขัน" },
    { id: 2, type_name: "อาสา" },
    { id: 3, type_name: "กีฬา" },
  ];

  const levelActivities: LevelActivity[] = [
    { id: 1, level_name: "ท้องถิ่น" },
    { id: 2, level_name: "ระดับชาติ" },
    { id: 3, level_name: "นานาชาติ" },
  ];

  const rewards: Reward[] = [
    { id: 1, reward_name: "เหรียญทอง" },
    { id: 2, reward_name: "เหรียญเงิน" },
    { id: 3, reward_name: "เหรียญทองแดง" },
    { id: 4, reward_name: "รางวัลชมเชย" },
  ];

  // ---------------- Utils -------------------

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
 

  return (
    <div className="min-h-screen bg-[#FFF5EF] py-10 flex justify-center">

      <motion.div
        layout
        className="w-full max-w-6xl p-8 bg-white border border-neutral-200 rounded-2xl shadow-xl"
      >

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FF6414]">คลังกิจกรรม</h1>
            <p className="text-neutral-600 text-sm mt-1">
              Activity Portfolio & Certificates
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.07 }}
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 bg-[#FF6414] hover:bg-[#e65a12] 
              text-white px-5 py-3 rounded-lg shadow-md shadow-[#FF6414]/30"
          >
            <Plus className="w-5 h-5" /> เพิ่มกิจกรรม
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-6 border-b border-neutral-300 pb-2">
          {["list", "create"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-[#FF6414] text-[#FF6414]"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab === "list" ? "รายการกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
            </button>
          ))}
        </div>

        {/* ---------------- LIST MODE ---------------- */}
        <AnimatePresence mode="wait">
          {activeTab === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="grid gap-6"
            >
              {activities.map((ac) => (
                <motion.div
                  key={ac.id}
                  whileHover={{ scale: 1.01 }}
                  className="border border-neutral-300 rounded-xl p-6 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">
                        {ac.activity_name}
                      </h2>

                      <div className="flex gap-3 text-neutral-600 text-sm mt-1">

                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-[#FF6414]" />
                          {formatDate(ac.activity_detail!.activity_at)}
                        </span>

                        <span className="px-2 py-1 bg-[#FF6414]/10 border border-[#FF6414]/20 text-[#FF6414] rounded text-xs">
                          {ac.activity_detail?.type_activity?.type_name}
                        </span>

                        <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                          {ac.activity_detail?.level_activity?.level_name}
                        </span>

                        {ac.reward && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded text-xs flex gap-1 items-center">
                            <Award className="w-3 h-3" /> {ac.reward.reward_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedActivity(ac)}
                      className="text-[#FF6414] hover:text-[#e65a12] text-sm font-medium"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>

                  <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                    {ac.activity_detail?.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ---------------- CREATE MODE ---------------- */}
          {activeTab === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 border rounded-xl bg-white shadow"
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                เพิ่มกิจกรรมใหม่
              </h2>

              <div className="space-y-6">

                {/* Activity Name */}
                <div>
                  <label className="font-medium">ชื่อกิจกรรม *</label>
                  <input className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#FF6414]" />
                </div>

                {/* Type */}
                <div>
                  <label className="font-medium">ประเภทกิจกรรม *</label>
                  <select className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg">
                    {typeActivities.map((t) => (
                      <option key={t.id}>{t.type_name}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="font-medium">ระดับกิจกรรม *</label>
                  <select className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg">
                    {levelActivities.map((l) => (
                      <option key={l.id}>{l.level_name}</option>
                    ))}
                  </select>
                </div>

                {/* Reward */}
                <div>
                  <label className="font-medium">รางวัลที่ได้รับ (ถ้ามี)</label>
                  <select className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg">
                    <option value="">-- ไม่มีรางวัล --</option>
                    {rewards.map((r) => (
                      <option key={r.id}>{r.reward_name}</option>
                    ))}
                  </select>
                </div>

                {/* Institution */}
                <div>
                  <label className="font-medium">จัดโดย *</label>
                  <input className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg" />
                </div>

                {/* Date */}
                <div>
                  <label className="font-medium">วันที่ทำกิจกรรม *</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-medium">รายละเอียด</label>
                  <textarea rows={4} className="w-full mt-1 px-4 py-2 border border-neutral-300 rounded-lg"></textarea>
                </div>

                {/* Upload */}
                <div>
                  <label className="font-medium flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> รูปภาพประกอบ
                  </label>

                  <div className="mt-2 p-6 border-2 border-dashed rounded-lg text-center text-neutral-500 hover:border-[#FF6414] transition cursor-pointer">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    คลิกเพื่ออัปโหลดรูปภาพ (รองรับหลายรูป)
                  </div>
                </div>

                <button className="w-full py-3 bg-[#FF6414] hover:bg-[#e65a12] text-white rounded-lg shadow">
                  บันทึกกิจกรรม
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------- DETAIL MODAL ---------------- */}
        <AnimatePresence>
          {selectedActivity && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl border border-neutral-200"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {selectedActivity.activity_name}
                  </h2>

                  <button onClick={() => setSelectedActivity(null)}>
                    <XCircle className="w-6 h-6 text-neutral-500 hover:text-[#FF6414]" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-neutral-500 text-sm">วันที่ทำกิจกรรม</p>
                    <p>{formatDate(selectedActivity.activity_detail!.activity_at)}</p>
                  </div>

                  <div>
                    <p className="text-neutral-500 text-sm">ประเภทกิจกรรม</p>
                    <p className="text-[#FF6414] font-medium">
                      {selectedActivity.activity_detail?.type_activity?.type_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-500 text-sm">ระดับกิจกรรม</p>
                    <p>{selectedActivity.activity_detail?.level_activity?.level_name}</p>
                  </div>

                  <div>
                    <p className="text-neutral-500 text-sm">รางวัลที่ได้รับ</p>
                    <p>{selectedActivity.reward?.reward_name ?? "— ไม่มี —"}</p>
                  </div>

                  <div>
                    <p className="text-neutral-500 text-sm">จัดโดย</p>
                    <p>{selectedActivity.activity_detail?.institution}</p>
                  </div>

                  <div>
                    <p className="text-neutral-500 text-sm">รายละเอียด</p>
                    <p>{selectedActivity.activity_detail?.description}</p>
                  </div>

                  {/* Images */}
                  {selectedActivity.images && selectedActivity.images.length > 0 && (
                    <div>
                      <p className="text-neutral-500 text-sm mb-2">รูปภาพประกอบ</p>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedActivity.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.image_url}
                            className="rounded-lg border shadow-sm"
                            alt="activity image"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="px-4 py-2 bg-[#FF6414] hover:bg-[#e65a12] text-white rounded-lg"
                  >
                    ปิด
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default ActivityUI;
