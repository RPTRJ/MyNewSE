"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSections } from "@/services/sections";
import { createTemplate } from "@/services/templates";
import { fetchCategoryTemplates } from "@/services/categoryTemplates";
import { uploadImage } from "@/services/upload";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    template_name: "",
    category_template_id: 0, // ยังไม่เลือก
    description: "",
    thumbnail: "",
  });
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSections, setSelectedSections] = useState<{id: number, order: number}[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({
    template_name: '',
    category_template_id: '',
    sections: ''
  });
  
  // Modal state (for success/error from API only)
  const [modal, setModal] = useState<{show: boolean; title: string; message: string; type: 'success' | 'error' | 'warning'}>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', autoClose = true) => {
    setModal({ show: true, title, message, type });
    if (autoClose) {
      setTimeout(() => setModal({ show: false, title: '', message: '', type: 'success' }), 2500);
    }
  };

  const closeModal = () => {
    setModal({ show: false, title: '', message: '', type: 'success' });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // โหลด sections และ categories พร้อมกัน
        const [sectionsData, categoriesData] = await Promise.all([
          fetchSections(),
          fetchCategoryTemplates()
        ]);
        setSections(sectionsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingSections(false);
        setLoadingCategories(false);
      }
    };
    loadData();
  }, []);

  const toggleSection = (sectionId: number) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s.id === sectionId);
      if (exists) {
        return prev.filter(s => s.id !== sectionId);
      } else {
        return [...prev, { id: sectionId, order: prev.length }];
      }
    });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setSelectedSections(prev => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === selectedSections.length - 1) return;
    setSelectedSections(prev => {
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    const newErrors: {[key: string]: string} = {
      template_name: '',
      category_template_id: '',
      sections: ''
    };

    let hasError = false;

    // Validate template name
    if (!formData.template_name || formData.template_name.trim() === '') {
      newErrors.template_name = 'กรุณากรอกชื่อเทมเพลต';
      hasError = true;
    }

    // Validate category
    if (!formData.category_template_id || formData.category_template_id === 0) {
      newErrors.category_template_id = 'กรุณาเลือกหมวดหมู่';
      hasError = true;
    }

    // Validate sections selection
    if (selectedSections.length < 2) {
      newErrors.sections = 'กรุณาเลือก Section อย่างน้อย 2 รายการ';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        template_name: formData.template_name.trim(),
        category_template_id: formData.category_template_id,
        description: formData.description,
        thumbnail: formData.thumbnail,
        section_ids: selectedSections.map(s => s.id),
      };
      
      console.log("Creating template:", templateData);
      
      // เรียก API สร้าง template
      const result = await createTemplate(templateData);
      console.log("Template created:", result);
      
      showModal("สำเร็จ!", "สร้างเทมเพลตเรียบร้อยแล้ว", 'success');
      setTimeout(() => router.push("/admin/template"), 2000);
    } catch (error) {
      console.error("Error creating template:", error);
      showModal("เกิดข้อผิดพลาด", "ไม่สามารถสร้างเทมเพลตได้ กรุณาลองใหม่อีกครั้ง", 'error', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Modal Popup */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-up">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              {modal.type === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {modal.type === 'warning' && (
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-2xl font-bold text-center mb-2 ${
              modal.type === 'success' ? 'text-green-700' :
              modal.type === 'error' ? 'text-red-700' :
              'text-orange-700'
            }`}>
              {modal.title}
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              {modal.message}
            </p>

            {/* Button */}
            <button
              onClick={closeModal}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg ${
                modal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                modal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Sticky Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link 
                href="/admin/template" 
                className="relative text-orange-600 hover:text-orange-400 transition pb-1"
              >
                Templates
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400"></span>
              </Link>
              <Link href="/admin/template/section" className="text-gray-600 hover:text-gray-900 transition pb-1">
                Sections
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header Card with Gradient */}
        <div className="mt-4 bg-gradient-to-r from-orange-300 to-orange-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-3xl font-bold">สร้างเทมเพลตใหม่</h1>
          </div>
          <p className="text-orange-100 text-lg">กรอกข้อมูลเพื่อสร้างเทมเพลตพอร์ตโฟลิโอแบบมืออาชีพ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            {/* Template Name */}
            <div className="group">
              <label htmlFor="template_name" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ชื่อเทมเพลต <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="template_name"
                  required
                  value={formData.template_name}
                  onChange={(e) => {
                    setFormData({ ...formData, template_name: e.target.value });
                    if (errors.template_name) {
                      setErrors({ ...errors, template_name: '' });
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white ${
                    errors.template_name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300'
                  }`}
                  placeholder="เช่น Professional Portfolio"
                  maxLength={50}
                />
                {errors.template_name && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.template_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    กรอกชื่อที่สื่อความหมายของเทมเพลต
                  </p>
                  <span className={`text-xs font-medium ${
                    formData.template_name.length > 40 ? 'text-orange-600' : 
                    formData.template_name.length > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {formData.template_name.length}/50
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="group">
              <label htmlFor="category_template_id" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="category_template_id"
                  required
                  value={formData.category_template_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_template_id: parseInt(e.target.value) });
                    if (errors.category_template_id) {
                      setErrors({ ...errors, category_template_id: '' });
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer ${
                    errors.category_template_id
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500 hover:border-gray-300'
                  }`}
                  disabled={loadingCategories}
                >
                  {loadingCategories ? (
                    <option value="0">กำลังโหลด...</option>
                  ) : categories.length === 0 ? (
                    <option value="0">ไม่มีหมวดหมู่</option>
                  ) : (
                    <>
                      <option value="0" disabled>เลือกหมวดหมู่</option>
                      {categories.map((category) => (
                        <option key={category.ID} value={category.ID}>
                          {category.category_name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {errors.category_template_id && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.category_template_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="group">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                คำอธิบาย <span className="text-gray-400 text-xs font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white resize-none"
                placeholder="อธิบายเกี่ยวกับเทมเพลตนี้..."
                rows={4}
                maxLength={100}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  ข้อมูลเพิ่มเติมเกี่ยวกับเทมเพลต
                </p>
                <span className={`text-xs font-medium ${
                  formData.description.length > 80 ? 'text-orange-600' : 
                  formData.description.length > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {formData.description.length}/100
                </span>
              </div>
            </div>

            {/* Thumbnail Upload - Commented out temporarily */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพตัวอย่าง (ไม่บังคับ)
              </label>
              
              <input
                type="file"
                id="thumbnail_file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

                  // ตรวจสอบ file extension (รองรับทุก browser รวม Edge)
                  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
                  const fileName = file.name.toLowerCase();
                  const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
                  
                  if (!isValidFile) {
                    alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP, BMP)');
                    e.target.value = '';
                    return;
                  }

                  // แสดง preview ทันที (ใช้ได้ทุก browser)
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
                  };
                  reader.onerror = () => {
                    console.error('Failed to read file');
                    alert('ไม่สามารถอ่านไฟล์ได้');
                  };
                  reader.readAsDataURL(file);

                  // Upload ไฟล์ไปยัง backend
                  try {
                    console.log('Uploading file to backend...');
                    const url = await uploadImage(file);
                    console.log('Upload success! URL:', url);
                    setFormData(prev => ({ ...prev, thumbnail: url }));
                    // alert('อัพโหลดรูปภาพสำเร็จ!');
                  } catch (error) {
                    console.error('Upload error:', error);
                    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
                    alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ: ' + errorMessage);
                    e.target.value = '';
                    setFormData(prev => ({ ...prev, thumbnail: '' }));
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />

              <p className="text-xs text-gray-500 mt-2">
                อัพโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP)
              </p>
              
              {formData.thumbnail && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">ตัวอย่าง:</p>
                  <div className="w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={formData.thumbnail} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div> */}

            {/* Sections Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือก Sections <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                เลือก sections ที่ต้องการเพิ่มในเทมเพลต <span className="font-semibold text-orange-600">(อย่างน้อย 2 sections)</span>
              </p>
              
              {loadingSections ? (
                <div className="text-center py-4 text-gray-500">กำลังโหลด sections...</div>
              ) : (
                <div className="space-y-4">
                  {/* Available Sections */}
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto no-arrow">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sections ที่มีทั้งหมด</h4>
                    <div className="space-y-2 ">
                      {sections.map((section) => {
                        const isSelected = selectedSections.some(s => s.id === section.ID);
                        return (
                          <label
                            key={section.ID}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                              isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSection(section.ID)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{section.section_name}</div>
                              <div className="text-xs text-gray-500">
                                {section.section_blocks?.length || 0} blocks
                              </div>
                            </div>
                            {section.layout_type && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {section.layout_type}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Sections Order */}
                  {selectedSections.length > 0 && (
                    <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Sections ที่เลือก ({selectedSections.length})
                      </h4>
                      <p className="text-xs text-gray-600 mb-3">จัดเรียงลำดับการแสดงผล</p>
                      <div className="space-y-2">
                        {selectedSections.map((selected, index) => {
                          const section = sections.find(s => s.ID === selected.id);
                          return (
                            <div
                              key={selected.id}
                              className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{section?.section_name}</div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSectionUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="ย้ายขึ้น"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSectionDown(index)}
                                  disabled={index === selectedSections.length - 1}
                                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="ย้ายลง"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSection(selected.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="ลบ"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Error message for sections */}
              {errors.sections && (
                <div className="flex items-center gap-1 mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{errors.sections}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังสร้าง...
                </span>
              ) : (
                "สร้างเทมเพลต"
              )}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="text-blue-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">ข้อมูลเพิ่มเติม</h3>
              <p className="text-sm text-blue-800">
                หลังจากสร้างเทมเพลตแล้ว คุณสามารถเพิ่ม Sections และ Blocks เข้าไปในเทมเพลตได้ในภายหลัง
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
