"use client";

import { useEffect, useState } from "react";
import AnnounceService, { Announcement } from "@/services/announcement";
import { getActivitiesWithMeta } from "@/services/activity";
import { getWorkingsByUserWithMeta } from "@/services/working";
import { Loader2, Trophy, Briefcase, FileText, Calendar, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [activityCount, setActivityCount] = useState(0);
  const [workingCount, setWorkingCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        let userId = 0;
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.first_name_th || user.first_name_en || "Student");
          userId = user.ID || user.id;
        }

        if (!userId) {
          // Fallback if userId Not found but should be handled by layout usually
          console.error("User ID not found");
        }

        const [activitiesRes, workingsRes, announcementsRes] = await Promise.all([
          getActivitiesWithMeta({ limit: 1 }), // We only need meta.total
          userId ? getWorkingsByUserWithMeta(userId) : { total: 0 },
          AnnounceService.getStudentAnnouncements(),
        ]);

        setActivityCount((activitiesRes as any).total || 0);
        setWorkingCount((workingsRes as any).total || 0);

        // Take latest 5 announcements and strictly type check
        const newsList = Array.isArray(announcementsRes) ? announcementsRes : [];
        setAnnouncements(newsList.slice(0, 5));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#FF6B35] via-[#FF8F5A] to-[#FF512F] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group min-h-[280px] flex flex-col justify-center border border-white/10">

        {/* Logos Top Right - Adjusted for visibility */}
        {/* Logos Center Right - Adjusted for visibility */}
        <div className="absolute top-6 right-6 md:top-1/2 md:right-12 md:-translate-y-1/2 flex items-center gap-6 z-20">
          <div className="flex items-center gap-6">
            <img src="/logo.sut2.png" alt="SUT Logo 1" className="h-16 md:h-28 lg:h-32 w-auto object-contain drop-shadow-xl filter brightness-0 invert opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105" />
            <div className="w-px h-16 md:h-24 bg-white/30 backdrop-blur-sm"></div>
            <img src="/sut-logo.png" alt="SUT Logo 2" className="h-16 md:h-28 lg:h-32 w-auto object-contain drop-shadow-xl filter brightness-0 invert opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105" />
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mt-12 md:mt-0">
          <h1 className="text-4xl md:text-6x font-black mb-4 tracking-tight drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100">
            สวัสดี, {userName}
          </h1>
          <p className="text-orange-50 text-lg md:text-2x opacity-90 font-light leading-relaxed max-w-xl">
            ยินดีต้อนรับสู่แดชบอร์ดนักเรียนของคุณ ติดตามความก้าวหน้าและอัปเดตข่าวสารล่าสุดได้ที่นี่
          </p>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-[100px] group-hover:blur-[120px] transition-all duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-900 opacity-20 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-400 opacity-20 rounded-full blur-[100px] animate-pulse"></div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Activity Card */}
        <Link href="/student/activity" className="block group">
          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-orange-500/5 border border-orange-100/50 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 relative overflow-hidden h-full">
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                    <Trophy className="w-5 h-5" />
                  </span>
                  <p className="text-gray-500 font-semibold text-sm uppercase tracking-wider">
                    กิจกรรมทั้งหมด
                  </p>
                </div>

                <h2 className="text-6xl font-black text-gray-800 tracking-tighter group-hover:text-orange-500 transition-colors duration-300">{activityCount}</h2>

                <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  บันทึกแล้ว
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-rotate-12">
                <Trophy className="w-40 h-40 text-orange-600" />
              </div>
              <ArrowUpRight className="w-6 h-6 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </div>
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-orange-500 to-orange-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>
        </Link>

        {/* Working Card */}
        <Link href="/student/working" className="block group">
          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-blue-500/5 border border-blue-100/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 relative overflow-hidden h-full">
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <p className="text-gray-500 font-semibold text-sm uppercase tracking-wider">
                    ผลงานทั้งหมด
                  </p>
                </div>

                <h2 className="text-6xl font-black text-gray-800 tracking-tighter group-hover:text-blue-500 transition-colors duration-300">{workingCount}</h2>

                <div className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  ผลงานของคุณ
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-rotate-12">
                <Briefcase className="w-40 h-40 text-blue-600" />
              </div>
              <ArrowUpRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </div>
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>
        </Link>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            ข่าวสารและประกาศ
          </h3>
          <Link href="/student/announcements" className="text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium">ไม่มีประกาศข่าวสารในขณะนี้</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {announcements.map((news) => (
                <div key={news.ID} className="bg-gray-50 hover:bg-white border boundary-transparent hover:border-orange-100 p-6 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-orange-500/5 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex-1 space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-xl text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {news.title}
                      </h4>
                      {news.is_pinned && (
                        <span className="flex-shrink-0 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed font-light">
                      {news.content ? news.content.replace(/<[^>]*>?/gm, "").substring(0, 200) : "ไม่มีรายละเอียด"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400 pt-2">
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        {new Date(news.published_at || news.scheduled_publish_at || new Date()).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>

                      {news.cetagory && (
                        <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100/50">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          {news.cetagory.cetagory_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center px-4 border-l border-gray-200/50">
                    <div className="w-10 h-10 rounded-full bg-white text-gray-300 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
