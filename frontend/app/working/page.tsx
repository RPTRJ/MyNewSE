"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Image, Link, Calendar, 
  CheckCircle, Clock, XCircle 
} from "lucide-react";

// ---------------- Types -------------------

interface TypeWorking {
  id: number;
  type_name: string;
}

interface WorkingDetail {
  id: number;
  working_at: string;
  description: string;
  type_working_id: number;
  type_working?: TypeWorking;
}

interface Working {
  id: number;
  working_name: string;
  status: string;
  working_detail_id: number;
  working_detail?: WorkingDetail;
  user_id: number;
}

// ---------------- Status Colors -------------------

const statusConfig = {
  completed: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700", icon: CheckCircle },
  in_progress: { label: "กำลังดำเนินการ", color: "bg-[#FF6414]/20 text-[#FF6414]", icon: Clock },
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-700", icon: XCircle }
} as const;

type StatusType = keyof typeof statusConfig;

// ---------------- Component -------------------

const WorkingManagementUI = () => {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [selectedWorking, setSelectedWorking] = useState<Working | null>(null);

  const [workingList] = useState<Working[]>([
    {
      id: 1,
      working_name: "ออกแบบระบบ Backend API",
      status: "completed",
      working_detail_id: 1,
      user_id: 1,
      working_detail: {
        id: 1,
        working_at: "2024-12-01T09:00:00Z",
        description: "พัฒนา REST API สำหรับระบบจัดการข้อมูล",
        type_working_id: 1,
        type_working: { id: 1, type_name: "Development" }
      }
    },
    {
      id: 2,
      working_name: "ประชุมทีมรายสัปดาห์",
      status: "in_progress",
      working_detail_id: 2,
      user_id: 1,
      working_detail: {
        id: 2,
        working_at: "2024-12-04T14:00:00Z",
        description: "ประชุมติดตามความคืบหน้าโปรเจค",
        type_working_id: 2,
        type_working: { id: 2, type_name: "Meeting" }
      }
    },
    {
      id: 3,
      working_name: "เขียนเอกสาร User Manual",
      status: "pending",
      working_detail_id: 3,
      user_id: 1,
      working_detail: {
        id: 3,
        working_at: "2024-12-05T10:00:00Z",
        description: "จัดทำคู่มือการใช้งานสำหรับผู้ใช้",
        type_working_id: 3,
        type_working: { id: 3, type_name: "Documentation" }
      }
    }
  ]);

  const typeWorkings = [
    { id: 1, type_name: "Development" },
    { id: 2, type_name: "Meeting" },
    { id: 3, type_name: "Documentation" },
    { id: 4, type_name: "Testing" },
    { id: 5, type_name: "Design" }
  ];

  // ---------------- Functions -------------------

  const getStatusBadge = (status: string) => {
    const key: StatusType = (status in statusConfig ? status : "pending") as StatusType;
    const config = statusConfig[key];
    const IconComponent = config.icon;

    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </motion.span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ---------------- UI -------------------

  return (
    <div className="min-h-screen flex justify-center items-start py-10 
      bg-[#FFF5EF] bg-[radial-gradient(circle_at_top_left,rgba(255,100,20,0.12),transparent)]">

      <motion.div
        layout
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl p-8 bg-white border border-[#FF6414]/20 
          rounded-2xl shadow-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FF6414]">คลังผลงาน</h1>
            <p className="text-[#FF6414]/70 text-sm mt-1">Working Management System</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 bg-[#FF6414] hover:bg-[#e65a12] 
              text-white px-5 py-3 rounded-lg shadow-md transition"
          >
            <Plus className="w-5 h-5" /> เพิ่มงานใหม่
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-5 border-b border-neutral-300 pb-2">
          {["list", "create"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-medium transition border-b-2 duration-200 
                ${
                  activeTab === tab
                    ? "border-[#FF6414] text-[#FF6414]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
            >
              {tab === "list" ? "รายการงาน" : "สร้างงานใหม่"}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}  
              animate={{ opacity: 1, x: 0 }}      
              exit={{ opacity: 0, x: 20 }}      
              transition={{ duration: 0.3 }}
              className="grid gap-6"
            >
              {workingList.map((working) => (
                <motion.div
                  key={working.id}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white border border-neutral-200 rounded-xl p-6 
                    shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-800">{working.working_name}</h3>
                      <div className="flex gap-4 text-neutral-500 text-sm mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-[#FF6414]" />
                          {working.working_detail && formatDate(working.working_detail.working_at)}
                        </span>

                        {working.working_detail?.type_working && (
                          <span className="px-2 py-1 bg-[#FF6414]/10 border border-[#FF6414]/20 
                            text-[#FF6414] rounded text-xs">
                            {working.working_detail.type_working.type_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {getStatusBadge(working.status)}
                  </div>

                  <p className="text-neutral-600 text-sm">
                    {working.working_detail?.description}
                  </p>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => setSelectedWorking(working)}
                      className="text-[#FF6414] hover:text-[#e65a12] font-medium text-sm transition"
                    >
                      ดูรายละเอียด
                    </button>

                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-[#FF6414]/10 text-neutral-600 hover:text-[#FF6414] transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-100 text-neutral-600 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}  
              animate={{ opacity: 1, x: 0 }}      
              exit={{ opacity: 0, x: -20 }}     
              transition={{ duration: 0.3 }}
              className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-[#FF6414] mb-6">สร้างงานใหม่</h2>

              <div className="space-y-6 text-neutral-700">
                <div>
                  <label className="font-medium">ชื่องาน *</label>
                  <input className="w-full mt-1 px-4 py-2 bg-white border border-neutral-300 
                      rounded-lg focus:ring-2 focus:ring-[#FF6414] focus:border-transparent" />
                </div>

                <div>
                  <label className="font-medium">ประเภทงาน *</label>
                  <select className="w-full mt-1 px-4 py-2 bg-white border border-neutral-300 
                      rounded-lg focus:ring-2 focus:ring-[#FF6414]">
                    {typeWorkings.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium">สถานะ *</label>
                  <select className="w-full mt-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg">
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium">วันที่ทำงาน *</label>
                  <input type="datetime-local" className="w-full mt-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg" />
                </div>

                <div>
                  <label className="font-medium">รายละเอียด</label>
                  <textarea rows={4} className="w-full mt-1 px-4 py-2 bg-white border border-neutral-300 rounded-lg" />
                </div>

                <button className="w-full mt-4 py-3 bg-[#FF6414] hover:bg-[#e65a12] 
                    text-white rounded-lg shadow-md transition">
                  บันทึกข้อมูล
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {selectedWorking && (
            <motion.div
              className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white border border-neutral-200 rounded-xl p-6 max-w-lg w-full 
                  shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-neutral-800">{selectedWorking.working_name}</h3>
                  <button onClick={() => setSelectedWorking(null)}>
                    <XCircle className="w-6 h-6 text-neutral-500 hover:text-[#FF6414] transition" />
                  </button>
                </div>

                <div className="space-y-4 text-neutral-700">
                  {getStatusBadge(selectedWorking.status)}

                  <div>
                    <p className="text-sm text-neutral-500">ประเภทงาน</p>
                    <p className="font-medium text-[#FF6414]">
                      {selectedWorking.working_detail?.type_working?.type_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500">วันที่ทำงาน</p>
                    <p>{formatDate(selectedWorking.working_detail!.working_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500">รายละเอียด</p>
                    <p>{selectedWorking.working_detail?.description}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedWorking(null)}
                    className="px-4 py-2 bg-[#FF6414] hover:bg-[#e65a12] 
                      text-white rounded-lg transition shadow-md"
                  >
                    ปิดหน้าต่าง
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

export default WorkingManagementUI;
