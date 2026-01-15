"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchSections } from "@/services/sections";
import { fetchTemplateById, updateTemplate } from "@/services/templates";
import { fetchCategoryTemplates } from "@/services/categoryTemplates";
import { uploadImage } from "@/services/upload";
import html2canvas from "html2canvas";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = parseInt(params.id as string);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    template_name: "",
    category_template_id: 0,
    description: "",
    thumbnail: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSections, setSelectedSections] = useState<{id: number, order: number}[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({
    template_name: '',
    category_template_id: '',
    sections: ''
  });
  
  // Modal state
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

  // Generate thumbnail from preview
  const generateThumbnail = async () => {
    if (!previewRef.current || selectedSections.length === 0) {
      showModal("ไม่สามารถสร้างภาพ", "กรุณาเลือก Sections อย่างน้อย 1 รายการ", 'warning', false);
      return;
    }

    setGeneratingThumbnail(true);
    try {
      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#f0f0f0',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT';
        },
        onclone: (clonedDoc, clonedElement) => {
          // Get all elements from original and cloned
          const originalElements = previewRef.current?.querySelectorAll('*');
          const clonedElements = clonedElement.querySelectorAll('*');
          
          // Copy computed styles to inline styles
          originalElements?.forEach((original, index) => {
            const cloned = clonedElements[index] as HTMLElement;
            if (cloned && original instanceof HTMLElement) {
              const computed = window.getComputedStyle(original);
              
              // Copy essential styles
              cloned.style.backgroundColor = computed.backgroundColor;
              cloned.style.color = computed.color;
              cloned.style.border = computed.border;
              cloned.style.borderRadius = computed.borderRadius;
              cloned.style.padding = computed.padding;
              cloned.style.margin = computed.margin;
              cloned.style.width = computed.width;
              cloned.style.height = computed.height;
              cloned.style.display = computed.display;
              cloned.style.fontSize = computed.fontSize;
              cloned.style.fontWeight = computed.fontWeight;
            }
          });
        },
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showModal("ผิดพลาด", "ไม่สามารถสร้างภาพได้", 'error', false);
          setGeneratingThumbnail(false);
          return;
        }

        // Convert blob to File object
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' });

        try {
          const imageUrl = await uploadImage(file);
          setFormData(prev => ({ ...prev, thumbnail: imageUrl }));
          showModal("สำเร็จ!", "สร้างภาพหน้าปกแล้ว", 'success');
        } catch (error) {
          console.error("Error uploading thumbnail:", error);
          showModal("ผิดพลาด", "ไม่สามารถอัปโหลดภาพได้", 'error', false);
        } finally {
          setGeneratingThumbnail(false);
        }
      }, 'image/png');
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      showModal("ผิดพลาด", "เกิดข้อผิดพลาดในการสร้างภาพ", 'error', false);
      setGeneratingThumbnail(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // โหลดข้อมูลทั้งหมด
        const [templateData, sectionsData, categoriesData] = await Promise.all([
          fetchTemplateById(templateId),
          fetchSections(),
          fetchCategoryTemplates()
        ]);
        
        // Set template data
        setFormData({
          template_name: templateData.template_name || "",
          category_template_id: templateData.category_template_id || 0,
          description: templateData.description || "",
          thumbnail: templateData.thumbnail || "",
        });
        
        // Set selected sections from template_section_links
        if (templateData.template_section_links && templateData.template_section_links.length > 0) {
          const sortedLinks = templateData.template_section_links.sort((a: any, b: any) => a.order_index - b.order_index);
          const selectedSecs = sortedLinks.map((link: any, index: number) => ({
            id: link.templates_section_id,
            order: index
          }));
          setSelectedSections(selectedSecs);
        }
        
        setSections(sectionsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
        showModal("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลเทมเพลตได้", 'error', false);
      } finally {
        setLoadingTemplate(false);
        setLoadingSections(false);
        setLoadingCategories(false);
      }
    };
    
    if (templateId) {
      loadData();
    }
  }, [templateId]);

  const toggleSection = (sectionId: number) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s.id === sectionId);
      if (exists) {
        return prev.filter(s => s.id !== sectionId).map((item, idx) => ({ ...item, order: idx }));
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
      newErrors.category_template_id = 'กรูณาเลือกหมวดหมู่';
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
      
      console.log("Updating template:", templateData);
      
      // เรียก API อัพเดท template
      const result = await updateTemplate(templateId, templateData);
      console.log("Template updated:", result);
      
      showModal("สำเร็จ!", "อัพเดทเทมเพลตเรียบร้อยแล้ว", 'success');
      setTimeout(() => router.push("/admin/template"), 2000);
    } catch (error) {
      console.error("Error updating template:", error);
      showModal("เกิดข้อผิดพลาด", "ไม่สามารถอัพเดทเทมเพลตได้ กรุณาลองใหม่อีกครั้ง", 'error', false);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 relative">
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
                className="relative text-orange-600 hover:text-orange-700 transition pb-1"
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
        <div className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h1 className="text-3xl font-bold">แก้ไขเทมเพลต</h1>
          </div>
          <p className="text-orange-100 text-lg">แก้ไขข้อมูลเทมเพลตพอร์ตโฟลิโอ</p>
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

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพหน้าปก <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={generateThumbnail}
                  disabled={selectedSections.length === 0 || generatingThumbnail}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingThumbnail ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      สร้างภาพอัตโนมัติ
                    </>
                  )}
                </button>

                <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  อัปโหลดรูป
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
                      const fileName = file.name.toLowerCase();
                      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
                      
                      if (!isValidFile) {
                        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP, BMP)');
                        e.target.value = '';
                        return;
                      }

                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
                      };
                      reader.onerror = () => {
                        alert('ไม่สามารถอ่านไฟล์ได้');
                      };
                      reader.readAsDataURL(file);

                      try {
                        const url = await uploadImage(file);
                        setFormData(prev => ({ ...prev, thumbnail: url }));
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
                        alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ: ' + errorMessage);
                        e.target.value = '';
                        setFormData(prev => ({ ...prev, thumbnail: '' }));
                      }
                    }}
                  />
                </label>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 คลิก "สร้างภาพอัตโนมัติ" เพื่อใช้ภาพจากเทมเพลต หรืออัปโหลดรูปเอง
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
            </div>

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
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sections ที่มีทั้งหมด</h4>
                    <div className="space-y-2">
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

          {/* Hidden Preview for Screenshot */}
          <div style={{ position: 'fixed', left: '-9999px', top: '0' }}>
            <div
              ref={previewRef}
              style={{ 
                width: '800px', 
                backgroundColor: '#ffffff', 
                padding: '32px',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                  {formData.template_name || "Template"}
                </h2>
                {formData.description && (
                  <p style={{ color: '#4b5563' }}>{formData.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedSections.map((selected, index) => {
                  const section = sections.find(s => s.ID === selected.id);
                  if (!section) return null;
                  
                  return (
                    <div
                      key={`preview-${index}`}
                      style={{
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '16px',
                        background: 'linear-gradient(to right, #eff6ff, #faf5ff)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          padding: '4px 12px',
                          borderRadius: '9999px'
                        }}>
                          {index + 1}
                        </span>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                          {section.section_name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {section.section_blocks && section.section_blocks.slice(0, 3).map((block: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              flex: '1 1 0%',
                              minWidth: '100px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              padding: '12px',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ color: '#9ca3af', marginBottom: '4px' }}>
                              {block.templates_block?.block_type === 'image' ? '🖼️' : '📝'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4b5563' }}>
                              {block.templates_block?.block_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/admin/template")}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : (
                "บันทึกการแก้ไข"
              )}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="text-orange-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">ข้อมูลเพิ่มเติม</h3>
              <p className="text-sm text-orange-800">
                การแก้ไขเทมเพลตจะมีผลกับการแสดงผลพอร์ตโฟลิโอทั้งหมดที่ใช้เทมเพลตนี้
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
