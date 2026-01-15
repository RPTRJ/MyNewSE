"use client";
import React, { useState, useEffect } from "react";
import AnnouncementService, {
  type UpdateAnnouncementPayload,
  type Announcement,
} from "@/services/announcement";
import { useRouter, useParams } from "next/navigation";
import { Loader2, X, FileText } from "lucide-react";

const EditAnnouncementForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const announcementId = Number(params?.id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [originalData, setOriginalData] = useState<Announcement | null>(null);
  
  const [formData, setFormData] = useState<UpdateAnnouncementPayload>({
    title: "",
    content: "",
    is_pinned: false,
    scheduled_publish_at: "",
    expires_at: null,
    send_notification: false,
    cetagory_id: 0,
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);

  // State สำหรับจัดการ category
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // โหลด categories ที่มีอยู่แล้ว
  useEffect(() => {
    loadCategories();
  }, []);

  // Fetch announcement data
  useEffect(() => {
    if (announcementId && announcementId > 0) {
      fetchAnnouncementData();
    }
  }, [announcementId]);

  const loadCategories = async () => {
    try {
      const result = await AnnouncementService.getCategories();
      const formattedCategories = result.map(cat => ({
        id: cat.ID!,
        name: cat.cetagory_name
      }));
      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      const newCategory = await AnnouncementService.createCategory({
        cetagory_name: newCategoryName.trim(),
      });

      setCategories(prev => [...prev, { 
        id: newCategory.ID!, 
        name: newCategory.cetagory_name 
      }]);
      
      setFormData(prev => ({ ...prev, cetagory_id: newCategory.ID! }));
      
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      
      alert("สร้างหมวดหมู่สำเร็จ ✅");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "เกิดข้อผิดพลาดในการสร้างหมวดหมู่");
    }
  };

  const fetchAnnouncementData = async () => {
    try {
      setFetchLoading(true);
      const data = await AnnouncementService.getAnnouncementById(announcementId);
      setOriginalData(data);
      
      const scheduledDate = data.scheduled_publish_at 
        ? new Date(data.scheduled_publish_at).toISOString().slice(0, 16)
        : "";
      
      const expiresDate = data.expires_at
        ? new Date(data.expires_at).toISOString().slice(0, 16)
        : null;

      setFormData({
        title: data.title,
        content: data.content,
        is_pinned: data.is_pinned,
        scheduled_publish_at: scheduledDate,
        expires_at: expiresDate,
        send_notification: data.send_notification,
        cetagory_id: data.cetagory?.ID ?? 0,
      });

      const fetchedAttachments = await AnnouncementService.getAttachmentsByAnnouncementId(announcementId);
      setExistingAttachments(fetchedAttachments);
      
    } catch (error: any) {
      console.error("Failed to fetch announcement:", error);
      alert("ไม่สามารถโหลดข้อมูลประกาศได้: " + error.message);
      router.back();
    } finally {
      setFetchLoading(false);
    }
  };

  // ===================== Handlers =====================

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleFeaturedImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      setFeaturedImage(e.target.files[0]);
    }
  };

  const handleAttachmentsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeNewAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToDelete((prev) => [...prev, attachmentId]);
    setExistingAttachments((prev) => prev.filter((att) => att.ID !== attachmentId));
  };

  // ===================== Submit =====================

  const handleSubmit = async () => {
    if (!formData.cetagory_id || formData.cetagory_id === 0) {
      alert("กรุณาเลือกหมวดหมู่ก่อนอัปโหลดไฟล์");
      return;
    }
    
    setLoading(true);
    try {
      let status: "PUBLISHED" | "SCHEDULED" | "DRAFT" = "PUBLISHED";

      const scheduledDate = new Date(formData.scheduled_publish_at || "");
      const now = new Date();

      if (scheduledDate > now) {
        status = "SCHEDULED";
      }

      const payload: UpdateAnnouncementPayload = {
        ...formData,
        status,
        scheduled_publish_at: new Date(formData.scheduled_publish_at || "").toISOString(),
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
      };

      await AnnouncementService.updateAnnouncement(announcementId, payload);

      // Delete marked attachments
      for (const attachmentId of attachmentsToDelete) {
        try {
          await AnnouncementService.deleteAttachment(attachmentId);
        } catch (error) {
          console.error("Failed to delete attachment:", error);
        }
      }

      // Upload new featured image if changed
      if (featuredImage) {
        const imageRes = await AnnouncementService.uploadFile(
          featuredImage,
          announcementId
        );

        await AnnouncementService.createAttachment({
          file_name: featuredImage.name,
          file_path: imageRes.file_path,
          announcement_id: announcementId,
          cetagory_id: formData.cetagory_id,
        });
      }

      // Upload new attachments
      for (const file of attachments) {
        const uploadRes = await AnnouncementService.uploadFile(
          file,
          announcementId
        );

        await AnnouncementService.createAttachment({
          file_name: file.name,
          file_path: uploadRes.file_path,
          announcement_id: announcementId,
          cetagory_id: formData.cetagory_id,
        });
      }

      // Log the edit action
      await AnnouncementService.createAdminLog({
        action_type: "UPDATE",
        announcement_id: announcementId,
      });

      // Send notification if enabled
      if (formData.send_notification) {
        await AnnouncementService.createNotification({
          notification_title: formData.title || "",
          notification_type: "ANNOUNCEMENT",
          notification_message: formData.content || "",
          is_read: false,
          announcement_id: announcementId,
        });
      }

      alert("อัปเดตประกาศสำเร็จ 🎉");
      router.push("/admin/announcements");
    } catch (error: any) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload: UpdateAnnouncementPayload = {
        ...formData,
        status: "DRAFT",
      };

      await AnnouncementService.updateAnnouncement(announcementId, payload);

      alert("บันทึกฉบับร่างเรียบร้อย 📝");
      router.push("/admin/announcements");
    } catch (error: any) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-600" size={40} />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-600">แก้ไขประกาศ</h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveDraft}
              className="px-4 py-2 text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50 disabled:opacity-50"
            >
              บันทึกฉบับร่าง
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "กำลังอัปเดต..." : "อัปเดตประกาศ"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcement Title */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หัวข้อประกาศ
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="ใส่หัวข้อประกาศที่นี่"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เนื้อหา
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="เริ่มเขียนเนื้อหาประกาศที่นี่..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                required
              />
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                รูปภาพหลัก
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageChange}
                  className="hidden"
                  id="featured-image"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <label htmlFor="featured-image" className="cursor-pointer">
                    <span className="text-orange-600 hover:text-orange-700">อัปโหลดไฟล์</span>
                    <span className="text-gray-600"> หรือลากไฟล์มาวางที่นี่</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF สูงสุด 10MB (แนะนำ 1920x1080px)
                  </p>
                  {featuredImage && (
                    <div className="mt-4 text-sm text-gray-700">
                      เลือกแล้ว: {featuredImage.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                ไฟล์แนบ
              </label>

              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">ไฟล์แนบปัจจุบัน:</p>
                  <div className="space-y-2">
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.ID}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ไฟล์เดิม
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(attachment.ID)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="ลบไฟล์"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Attachments */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleAttachmentsChange}
                  className="hidden"
                  id="attachments"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <label htmlFor="attachments" className="cursor-pointer">
                    <span className="text-orange-600 hover:text-orange-700">อัปโหลดไฟล์ใหม่</span>
                    <span className="text-gray-600"> หรือลากไฟล์มาวางที่นี่</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOCX, XLSX สูงสุด 25MB ต่อไฟล์
                  </p>
                </div>
              </div>

              {/* New Attachments List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">ไฟล์ใหม่ที่จะอัปโหลด:</p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewAttachment(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Publishing Options Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">ตั้งค่าการเผยแพร่</h3>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่
                </label>
                <select
                  name="cetagory_id"
                  value={formData.cetagory_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "new") {
                      setShowNewCategoryInput(true);
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        cetagory_id: Number(value),
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="0">กรุณาเลือกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="new" className="text-orange-600 font-medium">
                    + สร้างหมวดหมู่ใหม่
                  </option>
                </select>

                {/* New Category Input */}
                {showNewCategoryInput && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อหมวดหมู่ใหม่
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="เช่น ทั่วไป, วิชาการ, กิจกรรม"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                      >
                        สร้าง
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่และเวลาเผยแพร่
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_publish_at"
                  value={formData.scheduled_publish_at}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่หมดอายุ
                </label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  value={formData.expires_at ?? ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Pin to Top */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <label htmlFor="pin-to-top" className="text-sm font-medium text-gray-700">
                  ปักหมุดด้านบน
                </label>
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  id="pin-to-top"
                  className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer appearance-none checked:bg-orange-600 transition-colors"
                />
              </div>

              {/* Send Notification */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <label htmlFor="send-notification" className="text-sm font-medium text-gray-700">
                  ส่งการแจ้งเตือน
                </label>
                <input
                  type="checkbox"
                  name="send_notification"
                  checked={formData.send_notification}
                  onChange={handleInputChange}
                  id="send-notification"
                  className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer appearance-none checked:bg-orange-600 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAnnouncementForm;