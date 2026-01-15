"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAdminCurricula, fetchSelectionStats, type CurriculumDTO } from "@/services/curriculum";

// --- Icons (เหมือนเดิม) ---
const Icons = {
  ChartBar: () => <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Users: () => <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  BookOpen: () => <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  CheckCircle: () => <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

export default function AdminReportPage() {
  // ข้อมูลสถิติ (Real Data)
  const [facultyData, setFacultyData] = useState<{name: string, value: number}[]>([]);
  const [programData, setProgramData] = useState<{name: string, value: number, group_name: string}[]>([]);
  
  // ข้อมูลหลักสูตร (เอามานับพวกยอดรวม/สถานะ)
  const [courses, setCourses] = useState<CurriculumDTO[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. ดึงข้อมูลหลักสูตรทั้งหมด (เพื่อดูภาพรวม)
        const allCourses = await fetchAdminCurricula("");
        setCourses(allCourses);

        // 2. ดึงข้อมูลสถิติการเลือกจริง (Real Data from Selections)
        const stats = await fetchSelectionStats();
        
        // ถ้า Backend ส่งกลับมาใน key 'data' หรือแยก key
        // ปรับตาม JSON ที่ Backend ส่งมา (ในโค้ด Backend ด้านบนส่ง faculty_stats, program_stats)
        if (stats.faculty_stats) setFacultyData(stats.faculty_stats);
        if (stats.program_stats) setProgramData(stats.program_stats);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- คำนวณสถิติภาพรวม (จากข้อมูลหลักสูตร) ---
  const overviewStats = useMemo(() => {
    const totalCourses = courses.length;
    const statusCount = { open: 0, opening: 0, closed: 0 };
    courses.forEach(item => {
      const s = item.status?.toLowerCase();
      if (s === 'open') statusCount.open++;
      else if (s === 'opening') statusCount.opening++;
      else if (s === 'closed') statusCount.closed++;
    });
    
    // ยอดรวมการเลือกทั้งหมด (Sum จาก facultyData ก็ได้)
    const totalSelections = facultyData.reduce((sum, item) => sum + item.value, 0);

    return { totalCourses, totalSelections, statusCount };
  }, [courses, facultyData]);

  // --- Filter สาขาวิชาตามคณะที่เลือก (Drill-down) ---
  const filteredPrograms = useMemo(() => {
    if (!selectedFaculty) return [];
    return programData.filter(p => p.group_name === selectedFaculty);
  }, [programData, selectedFaculty]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
                <p className="text-gray-500">กำลังประมวลผลข้อมูลจริง...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">รายงานสถิติภาพรวม</h1>
          <p className="text-sm text-gray-500 mt-1">ข้อมูลสถิติจากระบบจริง (Real-time Data)</p>
        </div>

        {/* --- Summary Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg"><Icons.Users /></div>
            <div>
              <p className="text-sm text-gray-500">ยอดกดเลือกทั้งหมด</p>
              <h3 className="text-2xl font-bold text-gray-900">{overviewStats.totalSelections.toLocaleString()} ครั้ง</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg"><Icons.BookOpen /></div>
            <div>
              <p className="text-sm text-gray-500">หลักสูตรทั้งหมด</p>
              <h3 className="text-2xl font-bold text-gray-900">{overviewStats.totalCourses}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg"><Icons.CheckCircle /></div>
            <div>
              <p className="text-sm text-gray-500">กำลังเปิดรับสมัคร</p>
              <h3 className="text-2xl font-bold text-green-600">{overviewStats.statusCount.open}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg"><Icons.ChartBar /></div>
            <div>
              <p className="text-sm text-gray-500">รอเปิดรับสมัคร</p>
              <h3 className="text-2xl font-bold text-orange-600">{overviewStats.statusCount.opening}</h3>
            </div>
          </div>
        </div>

        {/* --- 🔥 MAIN CHART: Faculty Selection Stats --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    🏆 สถิตินักเรียนเลือกสำนักวิชา (เรียงตามความนิยม)
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    คลิกที่กราฟเพื่อดูสาขา
                </span>
            </div>
            
            <div className="space-y-4">
                {facultyData.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูลการเลือกในระบบ</p>
                ) : (
                    facultyData.map((f, index) => {
                        const maxVal = facultyData[0]?.value || 1;
                        const percent = (f.value / maxVal) * 100;
                        
                        return (
                            <div 
                                key={index} 
                                onClick={() => setSelectedFaculty(f.name)}
                                className="group cursor-pointer"
                            >
                                <div className="flex justify-between text-sm mb-1 group-hover:text-orange-600 transition-colors">
                                    <span className="font-medium flex items-center gap-2">
                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${index < 3 ? 'bg-yellow-100 text-yellow-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                            {index + 1}
                                        </span>
                                        {f.name}
                                    </span>
                                    <span className="font-bold text-gray-600 group-hover:text-orange-600 flex items-center gap-1">
                                        {f.value.toLocaleString()} <span className="text-xs font-normal text-gray-400">คน</span>
                                        <Icons.ChevronRight />
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-700 ease-out ${
                                            index === 0 ? 'bg-orange-500' : 
                                            index === 1 ? 'bg-orange-400' : 
                                            index === 2 ? 'bg-orange-300' : 'bg-gray-300 group-hover:bg-orange-200'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

      </div>

      {/* --- 🔥 DRILL-DOWN MODAL: Program Stats --- */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedFaculty(null)}></div>

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl animate-in fade-in zoom-in duration-200">
                    
                    <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">สถิติแยกตามสาขา</p>
                            <h3 className="text-xl font-bold text-gray-900">{selectedFaculty}</h3>
                        </div>
                        <button 
                            onClick={() => setSelectedFaculty(null)}
                            className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Icons.Close />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-5">
                            {filteredPrograms.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">ไม่มีข้อมูลสาขาวิชา</p>
                            ) : (
                                filteredPrograms.map((p, index) => {
                                    const maxVal = filteredPrograms[0]?.value || 1;
                                    const percent = (p.value / maxVal) * 100;

                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-800 font-medium">{p.name}</span>
                                                <span className="font-bold text-gray-600">{p.value.toLocaleString()} คน</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => setSelectedFaculty(null)}
                            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}