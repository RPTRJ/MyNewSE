"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAdminCurricula,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  fetchFaculties,
  fetchPrograms,
  type CurriculumDTO,
  type FacultyDTO,
  type ProgramDTO,
} from "@/services/curriculum";

// --- Icons (Inline SVGs) ---
const Icons = {
  Search: () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Delete: () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Eye: () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Calendar: () => <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Download: () => <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Chart: () => <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
};

type FormState = {
  id?: number;
  code: string;
  name: string;
  related_documents: string;
  link: string;
  gpax_min: string;
  faculty_id: string;
  program_id: string;
  status: string;
  start_date: string;
  end_date: string;
  quota: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  related_documents: "",
  link: "",
  gpax_min: "2.50",
  faculty_id: "",
  program_id: "",
  status: "",
  start_date: "",
  end_date: "",
  quota: "",
};

export default function AdminCurriculaPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CurriculumDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [faculties, setFaculties] = useState<FacultyDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);

  // ---------- Check auth ----------
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      setIsAuthorized(true);
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  // ---------- Load Data ----------
  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchAdminCurricula(search);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthorized) return;
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, isAuthorized]);

  async function loadFaculties() {
    try {
      const data = await fetchFaculties();
      const normalized: FacultyDTO[] = (data as any[]).map((f) => ({
        id: f.id ?? f.ID,
        name: f.name ?? f.Name,
        short_name: f.short_name ?? f.ShortName,
      }));
      setFaculties(normalized);
    } catch (err) {
      console.error("โหลดสำนักวิชาล้มเหลว:", err);
    }
  }

  async function loadProgramsByFaculty(facultyId: number) {
    try {
      const data = await fetchPrograms(facultyId);
      const normalized: ProgramDTO[] = (data as any[]).map((p) => ({
        id: p.id ?? p.ID,
        name: p.name ?? p.Name,
        short_name: p.short_name ?? p.ShortName,
      }));
      setPrograms(normalized);
    } catch (err) {
      console.error("โหลดสาขาวิชาล้มเหลว:", err);
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadFaculties();
    }
  }, [isAuthorized]);

  function openNewForm() {
    setForm(emptyForm);
    setPrograms([]);
    setShowForm(true);
  }

  function openEditForm(cur: CurriculumDTO) {
    const anyCur = cur as any;
    const facultyIdStr = cur.faculty?.id ? String(cur.faculty.id) : "";
    const programIdStr = cur.program?.id ? String(cur.program.id) : "";

    let sDate = "";
    let eDate = "";
    const periodStr = anyCur.application_period || "";
    if (periodStr.includes("|")) {
      const parts = periodStr.split("|");
      sDate = parts[0] || "";
      eDate = parts[1] || "";
    }

    setForm({
      id: cur.id,
      code: cur.code ?? "",
      name: cur.name ?? "",
      related_documents: cur.description ?? "",
      link: anyCur.link ?? "",
      gpax_min: String(cur.gpax_min ?? ""),
      faculty_id: facultyIdStr,
      program_id: programIdStr,
      status: cur.status ?? "",
      start_date: sDate,
      end_date: eDate,
      quota: anyCur.quota !== undefined && anyCur.quota !== null ? String(anyCur.quota) : "",
    });

    if (facultyIdStr) {
      loadProgramsByFaculty(Number(facultyIdStr));
    } else {
      setPrograms([]);
    }
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.faculty_id || !form.program_id) {
        alert("กรุณาเลือกสำนักวิชาและสาขาวิชา");
        setSaving(false);
        return;
      }

      // ✅ 1. ตรวจสอบ GPAX (ต้องอยู่ระหว่าง 0.00 - 4.00)
      const gpaxValue = parseFloat(form.gpax_min);
      if (isNaN(gpaxValue) || gpaxValue < 0.00 || gpaxValue > 4.00) {
          alert("⚠️ GPAX ขั้นต่ำต้องอยู่ระหว่าง 0.00 - 4.00 เท่านั้น");
          setSaving(false);
          return;
      }

      // ✅ 2. ตรวจสอบวันที่ (วันปิดรับห้ามมาก่อนวันเปิดรับ)
      if (form.start_date && form.end_date) {
        const startDate = new Date(form.start_date);
        const endDate = new Date(form.end_date);
        if (endDate < startDate) {
            alert("⚠️ วันปิดรับสมัคร (End) ห้ามมาก่อนวันเปิดรับสมัคร (Start)");
            setSaving(false);
            return;
        }
      }

      // ✅ 3. ตรวจสอบจำนวนรับ (ต้องเป็นจำนวนเต็ม และไม่ติดลบ)
      const quotaValue = Number(form.quota);
      if (form.quota && (!Number.isInteger(quotaValue) || quotaValue < 0)) {
          alert("⚠️ จำนวนรับ (คน) ต้องเป็นจำนวนเต็มและห้ามติดลบ (ห้ามมีทศนิยม)");
          setSaving(false);
          return;
      }

      const userStr = localStorage.getItem("user");
      let userId = 0;
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id ?? user.ID ?? user.user_id ?? 0;
      }

      const combinedPeriod = `${form.start_date}|${form.end_date}`;

      const payload = {
        code: form.code,
        name: form.name,
        description: form.related_documents,
        link: form.link,
        gpax_min: parseFloat(form.gpax_min || "0"),
        portfolio_max_pages: 0,
        faculty_id: Number(form.faculty_id),
        program_id: Number(form.program_id),
        status: form.status,
        user_id: userId,
        application_period: combinedPeriod,
        quota: parseInt(form.quota || "0", 10),
      };

      if (form.id) {
        await updateCurriculum(form.id, payload);
      } else {
        await createCurriculum(payload);
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("บันทึกหลักสูตรไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: number) {
    if (!id || !confirm("ต้องการลบหลักสูตรนี้หรือไม่?")) return;
    try {
      await deleteCurriculum(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("ลบหลักสูตรไม่สำเร็จ");
    }
  }

  function exportToCSV() {
    if (items.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const headers = ["ID,รหัสหลักสูตร,ชื่อโครงการ,สำนักวิชา,สาขาวิชา,GPAX ขั้นต่ำ,จำนวนรับ (คน),วันเริ่มรับสมัคร,วันปิดรับสมัคร,สถานะ,Link"];
    const rows = items.map((item) => {
      const anyItem = item as any;
      let sDate = "", eDate = "";
      if (anyItem.application_period?.includes("|")) {
           const parts = anyItem.application_period.split("|");
           sDate = parts[0] ? new Date(parts[0]).toLocaleString("th-TH") : "";
           eDate = parts[1] ? new Date(parts[1]).toLocaleString("th-TH") : "";
      }
      const esc = (text: any) => {
        if (!text) return "";
        const str = String(text);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      return [
        item.id,
        esc(item.code),
        esc(item.name),
        esc(item.faculty?.name),
        esc(item.program?.name),
        item.gpax_min,
        anyItem.quota || 0,
        esc(sDate),
        esc(eDate),
        esc(item.status),
        esc(anyItem.link)
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `curricula_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open":
        return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">🟢 เปิดอยู่</span>;
      case "opening":
        return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">🟠 กำลังเปิด</span>;
      case "closed":
        return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">🔴 ปิดแล้ว</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">⚪ ไม่มีสถานะ</span>;
    }
  }

  function formatPeriodDisplay(period: string) {
    if (!period) return <span className="text-gray-400">-</span>;
    if (period.includes("|")) {
      const [start, end] = period.split("|");
      const fmt = (d: string) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '?';
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-600">{fmt(start)}</span>
          <span className="text-xs text-gray-400 text-center">↓</span>
          <span className="text-xs text-gray-600">{fmt(end)}</span>
        </div>
      );
    }
    return period;
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ระบบจัดการข้อมูลหลักสูตร</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการรายชื่อหลักสูตร การรับสมัคร และรายละเอียดโครงการ</p>
          </div>
          <div className="flex gap-3">
             {/* 1. Export CSV */}
             <button
                onClick={exportToCSV}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-orange-600 transition-all"
             >
                <Icons.Download /> Export CSV
             </button>

             {/* ✅ 2. ปุ่มรายงานสถิติ */}
             <button
                onClick={() => router.push("/admin/curricula/report")}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-orange-600 transition-all"
             >
                <Icons.Chart /> รายงานสถิติ
             </button>

             {/* 3. เพิ่มหลักสูตร */}
             <button
                onClick={openNewForm}
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 transition-all"
             >
                <Icons.Plus /> เพิ่มหลักสูตรใหม่
             </button>
          </div>
        </header>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ... (ส่วนค้นหา) ... */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icons.Search />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ รหัสหลักสูตร..."
                className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "สำนักวิชา / สาขา",
                    "โครงการ / รหัส",
                    "GPAX",
                    "เอกสาร",
                    "ช่วงเวลา",
                    "จำนวนรับ",
                    "สถานะ",
                    "จัดการ"
                  ].map((header) => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>ไม่พบข้อมูลหลักสูตร</p>
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((c, idx) => (
                  <tr key={c.id ?? idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.faculty?.name}</div>
                      <div className="text-sm text-gray-500">{c.program?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 font-mono">
                          {c.code}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{c.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {c.gpax_min?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {c.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(c as any).application_period ? formatPeriodDisplay((c as any).application_period) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-center font-medium">
                      {(c as any).quota ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(c.status || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {(c as any).link ? (
                          <a 
                            href={(c as any).link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                            title="ดูรายละเอียด"
                          >
                            <Icons.Eye />
                          </a>
                        ) : (
                          <span className="text-gray-200 p-1 cursor-not-allowed"><Icons.Eye /></span>
                        )}
                        <button 
                          onClick={() => openEditForm(c)} 
                          className="text-gray-400 hover:text-orange-600 transition-colors p-1 rounded-full hover:bg-orange-50"
                          title="แก้ไข"
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="ลบ"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)}></div>

          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              
              {/* Modal Header */}
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold leading-6 text-gray-900" id="modal-title">
                  {form.id ? "แก้ไขข้อมูลหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
                </h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  title="ปิด"
                >
                  <Icons.Close />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 py-5 sm:p-6 space-y-5">
                  
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">รหัสหลักสูตร <span className="text-red-500">*</span></label>
                      <input
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 transition-shadow"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        required
                        placeholder="เช่น 660101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">ชื่อโครงการ <span className="text-red-500">*</span></label>
                      <input
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 transition-shadow"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="เช่น โควตาเรียนดี"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">สำนักวิชา <span className="text-red-500">*</span></label>
                      <select
                        className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                        value={form.faculty_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm({ ...form, faculty_id: val, program_id: "" });
                          if (val) loadProgramsByFaculty(Number(val));
                          else setPrograms([]);
                        }}
                        title="เลือกสำนักวิชา"
                      >
                        <option value="">-- เลือก --</option>
                        {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">สาขาวิชา <span className="text-red-500">*</span></label>
                      <select
                        className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-400"
                        value={form.program_id}
                        onChange={(e) => setForm({ ...form, program_id: e.target.value })}
                        disabled={!form.faculty_id}
                        title="เลือกสาขาวิชา"
                      >
                        <option value="">-- เลือก --</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">GPAX ขั้นต่ำ (0.00 - 4.00)</label>
                      <input
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="4"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                        value={form.gpax_min}
                        onChange={(e) => setForm({ ...form, gpax_min: e.target.value })}
                        placeholder="0.00"
                        title="GPAX ขั้นต่ำ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">เอกสาร/เงื่อนไขเพิ่มเติม</label>
                      <input
                        type="text"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                        placeholder="เช่น Portfolio ไม่เกิน 10 หน้า"
                        value={form.related_documents}
                        onChange={(e) => setForm({ ...form, related_documents: e.target.value })}
                      />
                    </div>
                  </div>

                   {/* URL */}
                   <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">ลิงก์ระเบียบการ (URL) <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                      placeholder="https://..."
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      required
                    />
                  </div>

                  {/* Period Section */}
                  <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4">
                    <div className="flex items-center mb-3">
                      <Icons.Calendar />
                      <h4 className="text-sm font-bold text-orange-900">กำหนดการรับสมัคร</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">วันเปิดรับ (Start)</label>
                        <input
                          type="datetime-local"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                          value={form.start_date}
                          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                          title="วันเปิดรับสมัคร"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">วันปิดรับ (End)</label>
                        <input
                          type="datetime-local"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                          value={form.end_date}
                          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                          title="วันปิดรับสมัคร"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status & Quota */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">จำนวนรับ (คน)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
                        value={form.quota}
                        onChange={(e) => setForm({ ...form, quota: e.target.value })}
                        onKeyDown={(e) => {
                          // ป้องกันการพิมพ์ E, +, -, .
                          if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="0"
                        title="จำนวนรับ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">สถานะ</label>
                      <select
                        className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 font-medium"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        title="เลือกสถานะ"
                      >
                        <option value="">⚪ ไม่มีสถานะ</option>
                        <option value="open">🟢 เปิดอยู่</option>
                        <option value="opening">🟠 กำลังเปิด</option>
                        <option value="closed">🔴 ปิดแล้ว</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all"
                    onClick={() => setShowForm(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}