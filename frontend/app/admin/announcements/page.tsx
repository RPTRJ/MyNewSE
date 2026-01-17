"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, List, ChevronDown, MoreVertical, Eye, Edit, Trash2, Pin, Clock, Loader2 } from 'lucide-react';
import AnnouncementService, { type Announcement } from '@/services/announcement';
import { useRouter } from 'next/navigation';

const AnnouncementDashboard = () => {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const didFetch = React.useRef(false);

  // Fetch announcements and categories on mount
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchAnnouncements();
    fetchCategories();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await AnnouncementService.getAdminAnnouncements();
      console.log('Announcements from API:', data); // Debug log
      setAnnouncements(data);
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error);
      alert('ไม่สามารถโหลดข้อมูลประกาศได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await AnnouncementService.getCategories();
      console.log('Categories from API:', data); // Debug log
      const categoryNames = data.map(cat => cat.cetagory_name);
      setCategories(['All', ...categoryNames]);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      // ถ้าดึงไม่ได้ ให้ใช้ค่าเริ่มต้น
      setCategories(['All', 'ทั่วไป', 'วิชาการ', 'กิจกรรม']);
    }
  };

  const statuses = ['All', 'Published', 'Scheduled', 'Draft', 'Expired'];

  // Determine status from announcement data
  const getAnnouncementStatus = (announcement: Announcement): string => {
    const now = new Date();

    if (announcement.expires_at) {
      const expiresAt = new Date(announcement.expires_at);
      if (now > expiresAt) {
        return 'Expired';
      }
    }

    if (announcement.published_at) {
      return 'Published';
    }

    if (announcement.scheduled_publish_at) {
      const scheduledDate = new Date(announcement.scheduled_publish_at);
      if (scheduledDate > now) {
        return 'Scheduled';
      }
    }

  

    return 'Draft';
  };

  // Filter logic
  const filteredAnnouncements = announcements.filter(announcement => {
    const status = getAnnouncementStatus(announcement);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || announcement.cetagory?.cetagory_name === categoryFilter;
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(filteredAnnouncements.map(a => a.ID!));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) return;

    try {
      await AnnouncementService.deleteAnnouncement(id);

      await AnnouncementService.createAdminLog({
        action_type: "DELETE",
        announcement_id: id,
      });

      alert('ลบประกาศสำเร็จ');
      fetchAnnouncements();
    } catch (error: any) {
      alert('ไม่สามารถลบประกาศได้: ' + error.message);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await AnnouncementService.updateAnnouncement(announcement.ID!, {
        is_pinned: !announcement.is_pinned
      });
      alert(announcement.is_pinned ? 'ยกเลิกปักหมุดแล้ว' : 'ปักหมุดแล้ว');
      fetchAnnouncements();
    } catch (error: any) {
      alert('ไม่สามารถอัปเดตได้: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ ${selectedItems.length} รายการ?`)) return;

    try {
      await Promise.all(selectedItems.map(id => AnnouncementService.deleteAnnouncement(id)));
      alert('ลบประกาศทั้งหมดสำเร็จ');
      setSelectedItems([]);
      fetchAnnouncements();
    } catch (error: any) {
      alert('ไม่สามารถลบประกาศบางรายการได้: ' + error.message);
    }
  };

  const handleBulkPin = async () => {
    try {
      await Promise.all(
        selectedItems.map(id =>
          AnnouncementService.updateAnnouncement(id, { is_pinned: true })
        )
      );
      alert('ปักหมุดประกาศทั้งหมดสำเร็จ');
      setSelectedItems([]);
      fetchAnnouncements();
    } catch (error: any) {
      alert('ไม่สามารถปักหมุดประกาศบางรายการได้: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-700';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAuthorName = (announcement: Announcement) => {
    if (announcement.user) {
      return `${announcement.user.first_name_th} ${announcement.user.last_name_th}`;
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-orange-600">ประกาศทั้งหมด</h1>
            <button
              onClick={() => router.push('/admin/announcements/create')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={20} />
              สร้างประกาศใหม่
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาประกาศ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
                >
                  <option value="All">สถานะ: ทั้งหมด</option>
                  {statuses.slice(1).map(status => (
                    <option key={status} value={status}>
                      {status === 'Expired' ? 'หมดอายุ' : status === 'Published' ? 'เผยแพร่แล้ว' : status === 'Scheduled' ? 'กำหนดเวลา' : 'ฉบับร่าง'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer"
                >
                  <option value="All">หมวดหมู่: ทั้งหมด</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>การดำเนินการ</span>
                    <ChevronDown size={16} />
                  </button>
                  {showBulkMenu && (
                    <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-48">
                      <button
                        onClick={() => {
                          handleBulkPin();
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Pin size={16} />
                        ปักหมุดที่เลือก
                      </button>
                      <button
                        onClick={() => {
                          handleBulkDelete();
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        ลบที่เลือก
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-orange-600" size={32} />
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredAnnouncements.length && filteredAnnouncements.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หัวข้อ
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมวดหมู่
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่เผยแพร่
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้สร้าง
                    </th>
                    <th className="w-12 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAnnouncements.map((announcement, index) => {
                    const status = getAnnouncementStatus(announcement);
                    const isLastItems = index >= filteredAnnouncements.length - 2 && filteredAnnouncements.length > 2;

                    return (
                      <tr key={announcement.ID} className="hover:bg-gray-50 transition-colors">
                        <td className="w-12 px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(announcement.ID!)}
                            onChange={() => handleSelectItem(announcement.ID!)}
                            className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {announcement.is_pinned && (
                              <Pin size={14} className="text-orange-600" fill="currentColor" />
                            )}
                            <span className="font-medium text-gray-900">{announcement.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{announcement.cetagory?.cetagory_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status === 'Scheduled' && <Clock size={12} />}
                            {status === 'Expired' ? 'หมดอายุ' : status === 'Published' ? 'เผยแพร่แล้ว' : status === 'Scheduled' ? 'กำหนดเวลา' : 'ฉบับร่าง'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(announcement.published_at || announcement.scheduled_publish_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{getAuthorName(announcement)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === announcement.ID ? null : announcement.ID!)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <MoreVertical size={18} className="text-gray-400" />
                            </button>
                            {actionMenuOpen === announcement.ID && (
                              <div className={`absolute right-0 ${isLastItems ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40`}>
                                <button
                                  onClick={() => {
                                    router.push(`/admin/announcements/${announcement.ID}`);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye size={14} />
                                  ดู
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(`/admin/announcements/${announcement.ID}/edit`);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit size={14} />
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => {
                                    handleTogglePin(announcement);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Pin size={14} />
                                  {announcement.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={() => {
                                    handleDelete(announcement.ID!);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  ลบ
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Empty State */}
              {filteredAnnouncements.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Search className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบประกาศ</h3>
                  <p className="text-gray-500">ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา</p>
                </div>
              )}

              {/* Footer */}
              {filteredAnnouncements.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    แสดง {filteredAnnouncements.length} จาก {announcements.length} รายการ
                    {selectedItems.length > 0 && (
                      <span className="ml-2 text-orange-600 font-medium">
                        ({selectedItems.length} รายการที่เลือก)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDashboard;