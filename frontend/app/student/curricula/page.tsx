"use client";

import { useEffect, useState } from "react";
import { 
  fetchPublicCurricula, 
  fetchMySelections, 
  toggleSelectionAPI, 
  toggleNotificationAPI,
  type CurriculumDTO 
} from "@/services/curriculum";
import {
  fetchCurriculumCourseGroups,
  type CurriculumCourseGroupDTO,
} from "@/services/courseGroup";

// --- Icons Component ---
const Icons = {
  Search: () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Academic: () => <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
  UserGroup: () => <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Calendar: () => <svg className="w-4 h-4 text-orange-500 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Document: () => <svg className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Bell: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  List: () => <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Lightbulb: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Star: () => <svg className="w-3 h-3 text-orange-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  ChevronUp: () => <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
};

export default function StudentCurriculaSearchPage() {
  const [search, setSearch] = useState("");
  
  const [items, setItems] = useState<CurriculumDTO[]>([]); // ข้อมูลที่จะแสดงใน Grid
  const [myList, setMyList] = useState<CurriculumDTO[]>([]); // ข้อมูลรายวิชาที่เลือกไว้ (Cache)
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<number>(1); 

  // State ควบคุมการแสดงผล "ดูเพิ่มเติม"
  const [showAll, setShowAll] = useState(false);

  // Recommendation Popup State
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);
  const [selectedCurriculumForRecommendation, setSelectedCurriculumForRecommendation] = useState<CurriculumDTO | null>(null);
  const [curriculumCourseGroups, setCurriculumCourseGroups] = useState<CurriculumCourseGroupDTO[]>([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false); 

  // 1. Initial Load: User & Selections
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let currentUserId = 1;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        currentUserId = user.ID || user.id || 1;
      } catch (e) { console.error(e); }
    }
    setUserId(currentUserId);
    loadSelections(currentUserId);
  }, []);

  // 2. Logic การแสดงผลหลัก (Search / MyList / Examples)
  useEffect(() => {
    // รีเซ็ตปุ่มดูเพิ่มเติมทุกครั้งที่เงื่อนไขเปลี่ยน
    setShowAll(false);

    const delayDebounceFn = setTimeout(() => {
        // กรณีที่ 1: มีการค้นหา -> โหลดตามคำค้นหา
        if (search.trim() !== "") {
            loadSearchResults(search);
        } else {
            // กรณีที่ 2: ไม่ได้ค้นหา (หน้าแรก)
            if (myList.length > 0) {
                // ถ้ามีรายการที่เลือกไว้ -> แสดงรายการที่เลือกทั้งหมด
                setItems(myList);
                setError(null);
            } else {
                // ถ้ายังไม่เลือกอะไรเลย -> โหลดตัวอย่าง (ทั้งหมดแล้วค่อยมาตัดเอา)
                loadSearchResults(""); 
            }
        }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [search, myList]); // ทำงานเมื่อ Search หรือ MyList เปลี่ยน

  // โหลดรายการที่เลือกจาก Server
  async function loadSelections(uid: number) {
    try {
      const selections = await fetchMySelections(uid);
      
      // แปลง Selection เป็น CurriculumDTO แล้วเก็บลง myList
      const myCurricula = selections.map((s: any) => s.curriculum ? s.curriculum : s);
      setMyList(myCurricula); 

      // Update ID Sets for UI state
      const newSelectedIds = new Set<number>();
      const newNotifiedIds = new Set<number>();
      selections.forEach((s: any) => {
        const cId = s.curriculum ? s.curriculum.id : s.id;
        newSelectedIds.add(cId);
        if (s.is_notified) newNotifiedIds.add(cId);
      });
      setSelectedIds(newSelectedIds);
      setNotifiedIds(newNotifiedIds);

    } catch (err) { console.error(err); }
  }

  // โหลดข้อมูลหลักสูตร (Public)
  async function loadSearchResults(keyword: string) {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPublicCurricula(keyword);
      // เรียงลำดับจาก ID มากไปน้อย (ล่าสุดขึ้นก่อน)
      const sortedData = data.sort((a, b) => b.id - a.id);
      
      setItems(sortedData);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Action: Toggle Select
  const toggleSelect = async (curriculumId: number) => {
    try {
      await toggleSelectionAPI(userId, curriculumId);
      // โหลด Selections ใหม่ -> myList จะเปลี่ยน -> useEffect จะทำงาน -> อัปเดตหน้าจออัตโนมัติ
      await loadSelections(userId); 
    } catch (err) { 
      alert("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  // Action: Toggle Notify
  const toggleNotify = async (curriculumId: number) => {
    try {
      await toggleNotificationAPI(userId, curriculumId);
      await loadSelections(userId);
    } catch (err) { 
      alert("แจ้งเตือนไม่สำเร็จ");
    }
  };

  function formatPeriodDisplay(period?: string) {
    if (!period) return "-";
    if (period.includes("|")) {
      const [start, end] = period.split("|");
      const fmt = (d: string) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '?';
      return (
        <span className="flex items-center gap-1">
            <span>{fmt(start)}</span>
            <span className="text-gray-400">→</span>
            <span>{fmt(end)}</span>
        </span>
      );
    }
    return period;
  }

  function getStatusBadge(status: string) {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "opening": return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">🟠 กำลังเปิด</span>;
      case "open": return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 animate-pulse">🟢 เปิดรับสมัคร</span>;
      case "closed": return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">🔴 ปิดรับสมัคร</span>;
      default: return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">⚪ ไม่ระบุ</span>;
    }
  }

  async function openRecommendationPopup(curriculum: CurriculumDTO) {
    setSelectedCurriculumForRecommendation(curriculum);
    setShowRecommendationPopup(true);
    setLoadingRecommendation(true);
    try {
      const groups = await fetchCurriculumCourseGroups(curriculum.id);
      setCurriculumCourseGroups(groups);
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ:", err);
      setCurriculumCourseGroups([]);
    } finally {
      setLoadingRecommendation(false);
    }
  }

  function closeRecommendationPopup() {
    setShowRecommendationPopup(false);
    setSelectedCurriculumForRecommendation(null);
    setCurriculumCourseGroups([]);
  }

  // ✅ Logic คำนวณ visibleItems:
  // - โหมดตัวอย่าง (search ว่าง และ ยังไม่เลือกอะไรเลย) -> แสดง 3 อัน (ถ้ากด showAll ถึงแสดงหมด)
  // - โหมดอื่นๆ (Search หรือ MyList) -> แสดงทั้งหมด
  const isExampleMode = search.trim() === "" && myList.length === 0;
  const visibleItems = (showAll || !isExampleMode) ? items : items.slice(0, 3);

  // Badge Text Logic
  let badgeText = "";
  if (search.trim() !== "") badgeText = `🔍 ผลการค้นหา (${items.length})`;
  else if (myList.length > 0) badgeText = `📋 รายการที่เลือกไว้ (${items.length})`;
  else badgeText = `💡 หลักสูตรแนะนำ (${items.length})`;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ระบบรับสมัครนักศึกษา</h1>
            <p className="text-sm text-gray-500 mt-1">ค้นหาและจัดการรายการหลักสูตรที่คุณสนใจ (Portfolio)</p>
          </div>
          <div className="text-right hidden md:block">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${search ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                {badgeText}
            </span>
          </div>
        </div>

        {/* --- Search Bar --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center sticky top-2 z-10">
            <div className="relative flex-1 w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Icons.Search />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6 transition-all"
                    placeholder="พิมพ์เพื่อค้นหาหลักสูตรเพิ่มเติม..."
                />
            </div>
            <button 
                onClick={() => loadSearchResults(search)} 
                className="w-full md:w-auto inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 transition-all active:scale-95"
            >
                ค้นหา
            </button>
        </div>

        {/* --- Content Grid --- */}
        {loading && (
            <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                {error}
            </div>
        )}

        {!loading && !error && items.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="flex justify-center mb-4 text-gray-300">
                    {search ? <Icons.Search /> : <Icons.List />}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                    {search ? "ไม่พบหลักสูตรที่ค้นหา" : "คุณยังไม่ได้เลือกหลักสูตรใดๆ"}
                </h3>
                <p className="text-gray-500 mt-1">
                    {search ? "ลองเปลี่ยนคำค้นหา หรือตรวจสอบตัวสะกด" : "ลองค้นหาหลักสูตรที่เปิดรับสมัคร แล้วกด 'เลือกสมัคร' เพื่อเริ่มทำ Portfolio"}
                </p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleItems.map((cur) => {
            const isSelected = selectedIds.has(cur.id);
            const isNotified = notifiedIds.has(cur.id);
            const isSelectable = cur.status === 'open';

            return (
              <div key={cur.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative">
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                   {getStatusBadge(cur.status)}
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3">
                    {/* Header */}
                    <div className="pr-16">
                        <div className="mb-2">
                          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 font-mono">
                            {cur.code}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                          {cur.name}
                        </h3>
                        <div className="mt-1 flex flex-col">
                           <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {cur.faculty?.name}
                           </span>
                           <span className="text-sm text-gray-600 font-medium">
                              {cur.program?.name}
                           </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center text-xs text-gray-600">
                         <Icons.Academic />
                         <span>GPAX ขั้นต่ำ: <strong className="text-gray-900 ml-1">{cur.gpax_min?.toFixed(2)}</strong></span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                         <Icons.UserGroup />
                         <span>รับจำนวน: <strong className="text-gray-900 ml-1">{cur.quota ? `${cur.quota} คน` : "-"}</strong></span>
                      </div>
                      <div className="col-span-2 flex items-start text-xs text-gray-600 pt-1 border-t border-gray-200 mt-1">
                         <Icons.Calendar />
                         <span className="leading-snug">{formatPeriodDisplay(cur.application_period)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {cur.description && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 px-1">
                            <Icons.Document />
                            <span className="line-clamp-2">{cur.description}</span>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 mt-auto flex items-center gap-3">
                    <button
                        onClick={() => toggleSelect(cur.id)}
                        disabled={!isSelectable && !isSelected}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 ${
                            isSelected
                            ? "bg-green-600 text-white hover:bg-green-700 ring-1 ring-green-600"
                            : isSelectable 
                                ? "bg-orange-600 text-white hover:bg-orange-700 ring-1 ring-orange-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200"
                        }`}
                    >
                        {isSelected && <Icons.Check />}
                        {isSelected ? "เลือกแล้ว" : isSelectable ? "เลือกสมัคร" : "ไม่เปิดรับ"}
                    </button>

                    <button
                        onClick={() => isSelected && toggleNotify(cur.id)}
                        disabled={!isSelected}
                        title={!isSelected ? "กรุณากดเลือกก่อน" : isNotified ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน"}
                        className={`p-2.5 rounded-lg border transition-all duration-200 active:scale-95 ${
                            !isSelected
                            ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                            : isNotified
                                ? "bg-yellow-50 border-yellow-300 text-yellow-600 shadow-sm"
                                : "bg-white border-gray-200 text-gray-400 hover:text-yellow-500 hover:border-yellow-300"
                        }`}
                    >
                        <Icons.Bell className={isNotified ? "w-5 h-5 fill-current" : "w-5 h-5"} />
                    </button>
                </div>

                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <button
                      onClick={() => openRecommendationPopup(cur)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg"
                      title="ดูคำแนะนำ"
                    >
                      <Icons.Lightbulb /> คำแนะนำ
                    </button>

                    {cur.link ? (
                        <a href={cur.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                            <Icons.Eye /> ดูรายละเอียดฉบับเต็ม
                        </a>
                    ) : (
                        <span className="text-xs font-semibold text-gray-300 cursor-not-allowed flex items-center gap-1">
                            <Icons.Eye /> ดูรายละเอียด
                        </span>
                    )}
                </div>

              </div>
            );
          })}
        </div>

        {/* ✅ ปุ่ม ดูเพิ่มเติม (Show More) */}
        {/* แสดงเฉพาะตอนที่เป็นโหมด Example (ยังไม่เลือกอะไร) และมีข้อมูลมากกว่า 3 รายการ */}
        {isExampleMode && items.length > 3 && (
            <div className="flex justify-center pt-6 pb-10">
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="group flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm ring-1 ring-gray-200 hover:ring-orange-500 hover:text-orange-600 text-gray-600 font-medium transition-all"
                >
                    {showAll ? (
                        <>
                            <span>ย่อรายการ (แสดง 3 ล่าสุด)</span>
                            <Icons.ChevronUp />
                        </>
                    ) : (
                        <>
                            <span>ดูหลักสูตรทั้งหมด ({items.length})</span>
                            <Icons.ChevronDown />
                        </>
                    )}
                </button>
            </div>
        )}

      </div>

      {/* ==================== Recommendation Popup ==================== */}
      {showRecommendationPopup && selectedCurriculumForRecommendation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={closeRecommendationPopup}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icons.Lightbulb />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">คำแนะนำหลักสูตร</h3>
                    <p className="text-orange-100 text-sm">{selectedCurriculumForRecommendation.name}</p>
                  </div>
                </div>
                <button 
                  onClick={closeRecommendationPopup}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                  title="ปิด"
                >
                  <Icons.Close />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {loadingRecommendation ? (
                  <div className="py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
                    <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        คำแนะนำจากอาจารย์
                      </h4>
                      {selectedCurriculumForRecommendation.description ? (
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-xl p-4">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedCurriculumForRecommendation.description}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <p className="text-gray-400">ยังไม่มีคำแนะนำ</p>
                        </div>
                      )}
                    </div>

                    {curriculumCourseGroups.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          กลุ่มวิชาและทักษะที่เกี่ยวข้อง
                        </h4>
                        <div className="space-y-4">
                          {curriculumCourseGroups.map((ccg) => (
                            <div key={ccg.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="font-semibold text-gray-800">
                                    {ccg.course_group?.name || "กลุ่มวิชา"}
                                  </h5>
                                  {ccg.course_group?.name_en && (
                                    <p className="text-sm text-gray-500">{ccg.course_group.name_en}</p>
                                  )}
                                </div>
                              </div>

                              {ccg.description && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-gray-600">{ccg.description}</p>
                                </div>
                              )}

                              {ccg.course_group?.course_group_skills && ccg.course_group.course_group_skills.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">ทักษะที่ต้องการ:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {ccg.course_group.course_group_skills.map((skill) => (
                                      <div
                                        key={skill.id}
                                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100"
                                      >
                                        <span>{skill.skill?.skill_name_th}</span>
                                        <span className="flex items-center">
                                          {Array.from({ length: skill.importance }).map((_, i) => (
                                            <Icons.Star key={i} />
                                          ))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={closeRecommendationPopup}
                  className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}