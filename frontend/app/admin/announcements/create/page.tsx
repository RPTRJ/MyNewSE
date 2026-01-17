"use client";
import React, { useState, useEffect } from "react";
import AnnouncementService, {
  type CreateAnnouncementPayload,
} from "@/services/announcement";
import { AlertError, AlertSuccess, AlertWarning } from "@/utils/alert";

function toBackendDate(value: string) {
  if (!value) return null;

  const date = new Date(value);
  return date.toISOString().slice(0, 16);

}

const CreateAnnouncementForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateAnnouncementPayload>({
    title: "",
    content: "",
    is_pinned: false,
    scheduled_publish_at: "",
    expires_at: "",
    send_notification: false,
    cetagory_id: 0,
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // State สำหรับจัดการ category
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // โหลด categories ที่มีอยู่แล้ว 
  useEffect(() => {
    loadCategories();
  }, []);

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
      // ถ้าไม่มี API ให้เริ่มต้นเป็น array ว่าง
      setCategories([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "กรุณากรอกหัวข้อประกาศ";
    }

    if (!formData.content.trim()) {
      newErrors.content = "กรุณากรอกรายละเอียดเนื้อหา";
    }

    if (formData.cetagory_id === 0) {
      newErrors.cetagory_id = "กรุณาเลือกหมวดหมู่";
    }

    if (!formData.scheduled_publish_at) {
      newErrors.scheduled_publish_at = "กรุณากรอกวัน/เวลาที่ต้องการเผยแพร่";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      AlertWarning("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    try {
      // สร้าง category ใหม่ผ่าน API
      const newCategory = await AnnouncementService.createCategory({
        cetagory_name: newCategoryName.trim(),
      });

      // เพิ่ม category ใหม่เข้า list
      setCategories(prev => [...prev, {
        id: newCategory.ID!,
        name: newCategory.cetagory_name
      }]);

      // เลือก category ที่สร้างใหม่
      setFormData(prev => ({ ...prev, cetagory_id: newCategory.ID! }));

      // รีเซ็ตและปิด input
      setNewCategoryName("");
      setShowNewCategoryInput(false);

      AlertSuccess("สร้างหมวดหมู่สำเร็จ ✅");
    } catch (error: any) {
      console.error(error);
      AlertError(error.message || "เกิดข้อผิดพลาดในการสร้างหมวดหมู่");
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
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }
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

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDraft = async () => {
    if (!validateForm()) {
      AlertWarning("กรุณากรอกข้อมูลที่จำเป็นให้ครบก่อนบันทึก");
      return;
    }
    setLoading(true);
    try {
      const payload: CreateAnnouncementPayload = {
        ...formData,
        status: "DRAFT",
        is_pinned: false,
        send_notification: false,
        scheduled_publish_at: new Date().toISOString(),
        expires_at: null,
      };

      const announcement =
        await AnnouncementService.createAnnouncement(payload);

      const announcementId = announcement.ID!;

      // featured image
      if (featuredImage) {
        const imageRes =
          await AnnouncementService.uploadFile(
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

      // attachments
      for (const file of attachments) {
        const uploadRes =
          await AnnouncementService.uploadFile(file, announcementId);

        await AnnouncementService.createAttachment({
          file_name: file.name,
          file_path: uploadRes.file_path,
          announcement_id: announcementId,
          cetagory_id: formData.cetagory_id,
        });
      }

      AlertSuccess("บันทึกฉบับร่างเรียบร้อย 📝");
      window.history.back();
    } catch (error: any) {
      console.error(error);
      AlertError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================== Submit =====================

  const handleSubmit = async () => {
    if (!validateForm()) {
      AlertWarning("กรุณากรอกข้อมูลที่จำเป็นให้ครบก่อนเผยแพร่\nหัวข้อ, รายละเอียด, หมวดหมู่, และวันที่");
      return;
    }

    setLoading(true);
    try {
      let status: "PUBLISHED" | "SCHEDULED" = "PUBLISHED";

      const scheduledDate = new Date(formData.scheduled_publish_at);
      const now = new Date();

      if (scheduledDate > now) {
        status = "SCHEDULED";
      }

      const payload: CreateAnnouncementPayload = {
        ...formData,
        status,
        scheduled_publish_at: new Date(formData.scheduled_publish_at).toISOString().slice(0, 16),
        expires_at: formData.expires_at
          ? toBackendDate(formData.expires_at)
          : null,
      };

      const announcement =
        await AnnouncementService.createAnnouncement(payload);

      const announcementId = announcement.ID!;

      // featured image
      if (featuredImage) {
        const imageRes =
          await AnnouncementService.uploadFile(
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

      // attachments
      for (const file of attachments) {
        const uploadRes =
          await AnnouncementService.uploadFile(file, announcementId);

        await AnnouncementService.createAttachment({
          file_name: file.name,
          file_path: uploadRes.file_path,
          announcement_id: announcementId,
          cetagory_id: formData.cetagory_id,
        });
      }

      await AnnouncementService.createAdminLog({
        action_type: "CREATE",
        announcement_id: announcementId,
      });

      if (formData.send_notification) {
        await AnnouncementService.createNotificationForStudents({
          notification_title: formData.title,
          notification_type: "Announcement",
          notification_message: formData.content,
          is_read: false,
          announcement_id: announcementId,
        });
      }

      AlertSuccess(
        status === "SCHEDULED"
          ? "ตั้งเวลาเผยแพร่เรียบร้อย ⏰"
          : "เผยแพร่ประกาศสำเร็จ 🎉"
      );
      window.history.back();
    } catch (error: any) {
      console.error(error);
      AlertError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-600">สร้างประชาสัมพัธ์ข่าวสาร</h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDraft}
              className="px-4 py-2 text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50"
            >
              บันทึกแบบร่าง
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "กำลังเผยแพร่..." : "เผยแพร่"}
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
                placeholder="พิมพ์หัวข้อของประชาสัมพันธ์นี้"
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
                placeholder="พิมพ์เนื้อหาข่าวสารที่นี่"
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                required
              />
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                แนบรูปภาพ
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
                    <span className="text-orange-600 hover:text-orange-700">Upload a file</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>

                  {featuredImage && (
                    <div className="mt-4 text-sm text-gray-700">
                      Selected: {featuredImage.name}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
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
                    <span className="text-orange-600 hover:text-orange-700">Upload files</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>

                </div>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Publishing Options Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-25 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900">ตั้งค่ารายละเอียด</h3>

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
                  วัน/เวลา ที่ต้องการเผยแพร่
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
                  เวลาที่หมดการเผยแพร่ (ถ้ามี)
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
                <span className="text-sm font-medium text-gray-700">
                  ปักหมุดประกาศ
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    checked={formData.is_pinned}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateAnnouncementForm;