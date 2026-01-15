"use client";
import { useEffect, useState } from "react";
import { Search, User } from 'lucide-react';
import SubmissionService, { PortfolioSubmission } from "@/services/submission";
import { useRouter } from "next/navigation";



export default function CheckPortfolioPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [loading, setLoading] = useState(false);
  const [portfolioSubmissions, setPortfolioSubmissions] = useState<PortfolioSubmission[]>([]);


  // โหลดข้อมูลจาก backend เฉพาะ status = awaiting
  useEffect(() => {
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await SubmissionService.fetchSubmissionsByStatus("awaiting");
        console.log("Fetched submissions:", data);
        setPortfolioSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter เฉพาะ is_current_version = true
  const pendingSubmissions = portfolioSubmissions.filter(
    item => item.status === 'awaiting' && item.is_current_version
  );

  const categories = [
    'ทั้งหมด',
    ...Array.from(
      new Set(
        pendingSubmissions
          .map(item => item.portfolio?.portfolio_name ?? "")
          .filter(name => name !== "")
      )
    )
  ];

  const handleStartReview = (id: number): void => {
    router.push(`/teacher/scorecard/${id}`);
  };


  const filteredItems = pendingSubmissions.filter(item => {
    const matchesSearch =
      (item.user?.first_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.user?.last_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.portfolio?.portfolio_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesCategory =
      selectedCategory === 'ทั้งหมด' || item.portfolio?.portfolio_name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };



  return (
    <div style={{ padding: '50px' }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-4 md:p-8 rounded-2xl ">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-orange-400">ให้คะแนน Portfolio</h1>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาผลงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 bg-white focus:outline-none transition-colors"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none bg-white cursor-pointer transition-colors"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Portfolio Grid */}
          {loading ? (
            <div className="text-center py-16 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  onClick={() => handleStartReview(item.ID)}
                  key={item.ID}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden shadow-2xl"
                >
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                      <img src={item.user.profile_image_url || ""} alt="Profile" className="w-10 h-10 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black font-medium text-l truncate">
                        {item.user.first_name_th} {item.user.last_name_th}
                      </p>
                      <p className="text-black text-xs truncate">Version {item.version}</p>
                    </div>
                  </div>

                  {/* Portfolio Info */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 aspect-square flex items-center justify-center p-4">
                    <div className="text-center">
                      <User className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm font-medium mb-1">{item. portfolio.portfolio_name}</p>
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-m text-gray-600">
                      <span>ส่งเมื่อ:</span>
                      <span className="font-medium">{formatDate(item.submission_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <User className="w-20 h-20 mx-auto mb-4" />
                <p className="text-xl">ไม่พบผลงานที่ค้นหา</p>
                <p className="text-sm mt-2">ลองค้นหาด้วยคำค้นอื่น หรือเปลี่ยนหมวดหมู่</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}