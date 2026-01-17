"use client";

import { useEffect, useState } from "react";
import { 
  fetchMySelections, 
  toggleSelectionAPI, 
  type CurriculumDTO 
} from "@/services/curriculum";

type CalendarView = "year" | "month";

// --- Icons Component ---
const Icons = {
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  // User Icon ไม่ได้ใช้แล้ว ลบออกได้เลย หรือเก็บไว้ก็ได้ครับ
};

export default function StudentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  
  const [selectedCurricula, setSelectedCurricula] = useState<CurriculumDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userId, setUserId] = useState<number>(1);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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
    loadData(currentUserId);
  }, []);

  async function loadData(uid: number) {
    try {
      setLoading(true);
      const data = await fetchMySelections(uid);

      if (!Array.isArray(data)) {
        setSelectedCurricula([]);
        return;
      }
      
      const uniqueMap = new Map();
      data.forEach((item: any) => {
        if (item && item.id) uniqueMap.set(item.id, item);
      });
      const uniqueData = Array.from(uniqueMap.values());
      
      const sorted = uniqueData.sort((a: any, b: any) => {
        const dateA = parseDates(a.application_period)?.start.getTime() || 0;
        const dateB = parseDates(b.application_period)?.start.getTime() || 0;
        return dateA - dateB || a.id - b.id;
      });
      
      setSelectedCurricula(sorted as CurriculumDTO[]);
    } catch (err) {
      console.error(err);
      setSelectedCurricula([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (id: number) => {
    if(!confirm("ต้องการลบออกจากปฏิทินใช่หรือไม่?")) return;
    try {
      await toggleSelectionAPI(userId, id);
      setActiveMenuId(null);
      await loadData(userId);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const parseDates = (periodStr?: string) => {
    if (!periodStr || !periodStr.includes("|")) return null;
    const [startStr, endStr] = periodStr.split("|");
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    return { start, end };
  };

  const getEventStyle = (status: string, isStart: boolean) => {
    const s = status?.toLowerCase() || "";
    let baseStyle = "";
    
    switch (s) {
      case "opening": 
        baseStyle = "bg-orange-100 text-orange-800 border-orange-400"; 
        break;
      case "open":    
        baseStyle = "bg-green-100 text-green-800 border-green-500";    
        break;
      case "closed":  
        baseStyle = "bg-red-100 text-red-800 border-red-500";          
        break;
      default:        
        baseStyle = "bg-gray-100 text-gray-800 border-gray-400"; 
        break;
    }

    if (isStart) {
        return `${baseStyle} border-l-4`;
    } else {
        return `${baseStyle} border-l-0 pl-1`; 
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };
  const handleToday = () => setCurrentDate(new Date());

  const formatMonth = (date: Date) => new Intl.DateTimeFormat("th-TH", { month: "long" }).format(date);
  const formatYear = (date: Date) => new Intl.DateTimeFormat("th-TH", { year: "numeric" }).format(date);

  const MonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);
    monthStart.setHours(0,0,0,0);
    monthEnd.setHours(23,59,59,999);

    const visibleCurricula = selectedCurricula.filter(c => {
      const d = parseDates(c.application_period);
      if(!d) return false;
      return d.end >= monthStart && d.start <= monthEnd;
    });

    const blanks = Array.from({ length: firstDay }, (_, i) => (
      <div key={`blank-${i}`} className="min-h-[140px] bg-gray-50/20 border-r border-b border-gray-100"></div>
    ));

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const currentDayDate = new Date(year, month, day);
      currentDayDate.setHours(0,0,0,0);
      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

      return (
        <div
          key={`day-${day}`}
          style={{ zIndex: 50 - day }} 
          className={`min-h-[140px] border-r border-b border-gray-100 relative pt-10 px-1 transition-colors ${
            isToday ? "bg-white" : "bg-white hover:bg-gray-50"
          }`}
        >
          <span className={`absolute top-3 left-3 w-8 h-8 text-sm font-semibold flex items-center justify-center rounded-full ${
            isToday ? "bg-orange-600 text-white shadow-md ring-2 ring-orange-100" : "text-gray-500"
          }`}>
            {day}
          </span>

          <div className="flex flex-col gap-1.5 w-full"> 
            {visibleCurricula.map((c) => {
              const dates = parseDates(c.application_period);
              if (!dates) return null;

              const currentPlugin = currentDayDate.getTime();
              const startPlugin = dates.start.getTime();
              const endPlugin = dates.end.getTime();
              const isInRange = currentPlugin >= startPlugin && currentPlugin <= endPlugin;

              if (!isInRange) {
                return <div key={`spacer-${c.id}-${day}`} className="h-[60px] w-full invisible"></div>;
              }

              const isStart = currentPlugin === startPlugin;
              const isEnd = currentPlugin === endPlugin;
              const showContent = isStart || (day === 1 && isInRange);

              let shapeClass = ""; 
              if (isStart) shapeClass += " rounded-l-md ml-1"; 
              else shapeClass += " -ml-[1px]"; 
              if (isEnd) shapeClass += " rounded-r-md mr-1"; 
              else shapeClass += " -mr-[1px]"; 

              return (
                <div 
                  key={`ev-${c.id}-${day}`} 
                  className={`relative h-[60px] text-xs ${getEventStyle(c.status, isStart)} ${shapeClass} flex items-center group shadow-sm transition-all hover:brightness-95 cursor-pointer`}
                >
                  {showContent && (
                    <div className="absolute left-0 top-0 bottom-0 w-[200px] z-20 p-1.5 pl-3 flex flex-col justify-center">
                        
                        {/* 1. ส่วนบน: ชื่อสาขาวิชา + ปุ่มเมนู */}
                        <div className="flex justify-between items-start w-full relative">
                          <div className="font-bold truncate w-full leading-tight pr-6 text-[11px]" title={c.program?.name || "ไม่ระบุสาขา"}>
                            {c.program?.name || "ไม่ระบุสาขา"}
                          </div>
                          
                          {/* 3 Dots Menu */}
                          <div className="absolute right-[50px] -top-1 pointer-events-auto">
                             <button 
                               className="text-gray-500 hover:text-black font-bold p-1 rounded-full hover:bg-black/10 transition-colors focus:outline-none"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setActiveMenuId(activeMenuId === c.id ? null : c.id);
                               }}
                             >⋮</button>
                             {activeMenuId === c.id && (
                                <div className="absolute left-4 top-2 bg-white border border-gray-200 shadow-xl rounded-lg z-50 p-1 min-w-[140px] animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleRemove(c.id)} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-md text-xs font-bold flex items-center gap-2 transition-colors">
                                    <Icons.Trash /> ลบรายการ
                                  </button>
                                </div>
                             )}
                          </div>
                        </div>

                        {/* 2. ส่วนกลาง: ชื่อโครงการ (เพิ่มเข้ามา) */}
                        <div className="text-[10px] font-medium truncate w-full pr-2 opacity-90 mt-0.5" title={c.name}>
                           {c.name}
                        </div>

                        {/* 3. ส่วนล่าง: ช่วงเวลา (ย้ายลงมาแทนที่จำนวนรับ) */}
                        <div className="text-[9px] opacity-80 truncate mt-0.5">
                          {dates.start.toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})} - {dates.end.toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}
                        </div>
                        
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="min-w-[900px] md:min-w-full overflow-x-auto">
            <div className="grid grid-cols-7 bg-gray-50 text-gray-500 font-semibold text-center py-3 border-b border-gray-200 text-sm">
            {["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 divide-x divide-gray-100">
                {[...blanks, ...days]}
            </div>
        </div>
      </div>
    );
  };

  const YearView = () => {
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {months.map((m, index) => (
          <div key={m} onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(index);
              setCurrentDate(newDate);
              setView("month");
            }}
            className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all ${
              index === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() ? "ring-2 ring-orange-200 border-orange-300" : ""
            }`}
          >
            <h3 className="font-bold text-gray-800 mb-3 text-center">{m}</h3>
            <div className="flex flex-wrap gap-1.5 justify-center min-h-[40px] content-start">
               {selectedCurricula.map(c => {
                 const dates = parseDates(c.application_period);
                 if(dates && dates.start.getMonth() === index && dates.start.getFullYear() === currentDate.getFullYear()) {
                    let colorClass = "bg-gray-400";
                    if (c.status === "opening") colorClass = "bg-orange-400 ring-2 ring-orange-100";
                    else if (c.status === "open") colorClass = "bg-green-500 ring-2 ring-green-100";
                    else if (c.status === "closed") colorClass = "bg-red-500 ring-2 ring-red-100";
                    
                   return <div key={`d-${c.id}`} title={c.name} className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                 }
                 return null;
               })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-8xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 tracking-tight flex items-center gap-2">
              <Icons.Calendar /> ปฏิทินการรับสมัคร
            </h1>
            <p className="text-gray-600 mt-1">ติดตามกำหนดการและวางแผนการยื่นสมัคร Portfolio</p>
          </div>
          
          {/* Controls & View Toggle */}
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><Icons.ChevronLeft /></button>
                <div className="px-4 font-bold text-gray-800 min-w-[140px] text-center select-none">
                   {view === "month" ? `${formatMonth(currentDate)} ${formatYear(currentDate)}` : `ปี ${formatYear(currentDate)}`}
                </div>
                <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><Icons.ChevronRight /></button>
             </div>

             <div className="flex items-center gap-2">
                <button onClick={handleToday} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                   วันนี้
                </button>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                  <button onClick={() => setView("month")} className={`px-4 py-1.5 text-sm rounded-md font-semibold transition-all ${view === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>รายเดือน</button>
                  <button onClick={() => setView("year")} className={`px-4 py-1.5 text-sm rounded-md font-semibold transition-all ${view === "year" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>รายปี</button>
                </div>
             </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200">
          <span className="font-semibold text-gray-900">คำอธิบายสถานะ:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 ring-2 ring-orange-100"></span>
            <span>กำลังเปิด</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-100"></span>
            <span>เปิดรับสมัคร</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-100"></span>
            <span>ปิดรับสมัคร</span>
          </div>
        </div>

        <main className="min-h-[500px]">
          {loading ? (
             <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
                <p className="text-gray-500">กำลังโหลดข้อมูลปฏิทิน...</p>
             </div>
          ) : (view === "month" ? <MonthView /> : <YearView />)}
        </main>
      </div>
    </div>
  );
}