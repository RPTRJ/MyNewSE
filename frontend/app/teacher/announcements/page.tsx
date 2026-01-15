"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from 'lucide-react';
import AnnouncementService, { type Announcement } from '@/services/announcement';

export default function TeacherPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<string[]>(['ทั้งหมด']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (user.type_id !== 2) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setIsAuthorized(true);
      loadData();
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // โหลดประกาศและหมวดหมู่พร้อมกัน
      const [announcementsData, categoriesData] = await Promise.all([
        AnnouncementService.getTeacherAnnouncements(),
        AnnouncementService.getCategories()
      ]);
      
      setAnnouncements(announcementsData);
      
      // สร้าง array ของชื่อหมวดหมู่ โดยเริ่มต้นด้วย "ทั้งหมด"
      const categoryNames = ['ทั้งหมด', ...categoriesData.map(cat => cat.cetagory_name)];
      setCategories(categoryNames);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // แยกประกาศที่ pinned และไม่ pinned
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

  // กรองตาม category และ search
  const filteredRegularAnnouncements = regularAnnouncements.filter((announcement) => {
    const title = announcement.title?.toLowerCase().trim() || '';
    const content = announcement.content?.toLowerCase().trim() || '';
    const query = searchQuery.toLowerCase().trim();

    const categoryName = announcement.cetagory?.cetagory_name;

    const matchesCategory =
      activeCategory === 'ทั้งหมด' || categoryName === activeCategory;

    const matchesSearch =
      query === '' ||
      title.includes(query) ||
      content.includes(query);

    return matchesCategory && matchesSearch;
  });

  // จำกัดจำนวนที่แสดง
  const displayedAnnouncements = filteredRegularAnnouncements.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ทั่วไป': 'bg-blue-100 text-blue-700',
      'กิจกรรม': 'bg-green-100 text-green-700',
      'วิชาการ': 'bg-purple-100 text-purple-700',
      'ทั้งหมด': 'bg-gray-100 text-gray-700'
    };
    // ถ้าไม่มีสีที่กำหนดไว้ ให้ใช้สีสุ่ม
    return colors[category] || 'bg-orange-100 text-orange-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div style={{ padding: '50px' }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-4 md:p-8 rounded-2xl">
        {/* Announcements Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-2">ประชาสัมพันธ์</h1>
          <p className="text-orange-400">ประกาศและประชาสัมพันธ์ทั้งหมดของมหาวิทยาลัยเทคโนโลยีสุรนารี</p>
        </div>

        {/* Important Notices - Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-orange-500 mb-4">📌 ประชาสัมพันธ์สำคัญ</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {pinnedAnnouncements.map(announcement => (
                <div key={announcement.ID} className="bg-yellow-50 border-2 border-yellow-300 rounded-lg overflow-hidden flex-shrink-0 w-80">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-yellow-700 font-bold text-sm">⭐ PINNED</span>
                      {announcement.cetagory?.cetagory_name && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(announcement.cetagory.cetagory_name)}`}>
                          {announcement.cetagory.cetagory_name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg line-clamp-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">{announcement.content}</p>
                    {announcement.published_at && (
                      <p className="text-xs text-gray-500 mb-3">{formatDate(announcement.published_at)}</p>
                    )}
                    <button 
                      onClick={() => router.push(`/teacher/announcements/${announcement.ID}`)}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาประกาศ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดประกาศ...</p>
          </div>
        )}

        {/* Regular Announcements List */}
        {!loading && displayedAnnouncements.length > 0 && (
          <div className="space-y-4">
            {displayedAnnouncements.map(announcement => (
              <div key={announcement.ID} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  {announcement.cetagory?.cetagory_name && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(announcement.cetagory.cetagory_name)}`}>
                      {announcement.cetagory.cetagory_name}
                    </span>
                  )}
                  {announcement.published_at && (
                    <span className="text-sm text-gray-500">{formatDate(announcement.published_at)}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{announcement.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{announcement.content}</p>
                <div className="flex justify-between items-center">
                  {announcement.attachments > 0 && (
                    <span className="text-sm text-gray-500">📎 {announcement.attachments} ไฟล์แนบ</span>
                  )}
                  <button 
                    onClick={() => router.push(`/teacher/announcements/${announcement.ID}`)}
                    className="ml-auto text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
                  >
                    อ่านเพิ่มเติม
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRegularAnnouncements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">ไม่พบประกาศ</p>
            {searchQuery && (
              <p className="text-gray-400 mt-2">ลองปรับคำค้นหาหรือหมวดหมู่</p>
            )}
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredRegularAnnouncements.length > visibleCount && (
          <div className="mt-8 text-center">
            <button 
              onClick={handleLoadMore}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              โหลดเพิ่มเติม (เหลืออีก {filteredRegularAnnouncements.length - visibleCount} ประกาศ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}