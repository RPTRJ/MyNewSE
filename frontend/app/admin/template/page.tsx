"use client";

import { useEffect, useState } from "react";
import { Template } from "@/src/interfaces/template";
import { fetchTemplates, deleteTemplate } from "@/services/templates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera,
         CaseSensitive,
         ImageIcon,
         FileText,
 } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean; template: Template | null}>({
    show: false,
    template: null
  });
  const [deleting, setDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState<{show: boolean; message: string}>({
    show: false,
    message: ''
  });

  const loadAll = async () => {
    try {
      const data = await fetchTemplates();
      
      const sortedData = data.map((template: Template) => ({
        ...template,
        template_section_links: template.template_section_links
          ?.sort((a, b) => a.order_index - b.order_index)
          .map((link) => ({
            ...link,
            templates_section: link.templates_section
              ? {
                  ...link.templates_section,
                  section_blocks: link.templates_section.section_blocks
                    ?.sort((a, b) => a.order_index - b.order_index),
                }
              : undefined,
          })),
      }));
      
      setTemplates(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm.template) return;
    
    setDeleting(true);
    try {
      await deleteTemplate(deleteConfirm.template.ID);
      setDeleteConfirm({ show: false, template: null });
      // Show success modal
      setSuccessModal({ show: true, message: 'ลบเทมเพลตเรียบร้อยแล้ว' });
      setTimeout(() => setSuccessModal({ show: false, message: '' }), 2500);
      // Reload templates
      await loadAll();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("ไม่สามารถลบเทมเพลตได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-up">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-2 text-green-700">
              สำเร็จ!
            </h3>

            <p className="text-gray-600 text-center mb-6">
              {successModal.message}
            </p>

            <button
              onClick={() => setSuccessModal({ show: false, message: '' })}
              className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-all hover:shadow-lg"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.template && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirm({ show: false, template: null })}
          />
          
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-up">
            {/* Template Thumbnail Preview */}
            {deleteConfirm.template.thumbnail && (
              <div className="mb-4">
                <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={deleteConfirm.template.thumbnail} 
                    alt={deleteConfirm.template.template_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-2 text-red-700">
              ยืนยันการลบ
            </h3>

            <p className="text-gray-600 text-center mb-2">
              คุณต้องการลบเทมเพลต
            </p>
            <p className="text-lg font-semibold text-center mb-6 text-gray-900">
              "{deleteConfirm.template.template_name}"
            </p>
            <p className="text-sm text-red-600 text-center mb-6">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, template: null })}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                disabled={deleting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:bg-gray-400"
                disabled={deleting}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังลบ...
                  </span>
                ) : (
                  "ลบเทมเพลต"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <Link href="/admin/template" className="text-orange-600 font-medium hover:text-orange-600 transition border-b-2 border-orange-400 pb-1">
                  Templates
                </Link>
                <Link href="/admin/template/section" className="text-gray-600 hover:text-gray-900 transition pb-1">
                  Sections
                </Link>

              </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl px-6">
        <div className="flex items-center justify-between mb-8 mt-4">
          <div >
            <h1 className="text-3xl font-bold text-gray-900 ">Portfolio Templates</h1>
            {/* <p className="text-gray-600 mt-2">เลือกเทมเพลตที่ต้องการสำหรับพอร์ตโฟลิโอของคุณ</p> */}
          </div>
          <button 
            onClick={() => router.push('/admin/template/create')}
            className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600 transition shadow-md hover:shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้างเทมเพลตใหม่
            </span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 mb-10">
          {templates.map((template) => (
            <div
              key={template.ID}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col"
              onClick={() => setSelectedTemplate(template)}
            >
              <div 
                className="h-48 flex-shrink-0 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(to bottom right,orange ,yellow)',
                }}
              >
                {/* Mini Preview of Template Layout - Always show as background */}
                <div className="absolute inset-0 p-3 flex flex-col gap-1.5 z-0 pointer-events-none">
                  {/* Template Name */}
                  <div className="text-center">
                    <div className="text-white text-xs font-bold drop-shadow-md">{template.template_name}</div>
                  </div>
                  
                  {/* Sections Preview */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                        {template.template_section_links && template.template_section_links.length > 0 ? (
                      <>
                        {template.template_section_links.slice(0, 3).map((link, idx) => {
                          const section = link.templates_section;
                          if (!section) return null;

                          // Detect profile_picture anywhere in section and render compact preview
                          const profileIndex = section.section_blocks
                            ? section.section_blocks.findIndex(
                                (sb: any) => sb.templates_block?.block_name === 'profile_picture'
                              )
                            : -1;

                          if (profileIndex !== -1) {
                            const isProfileRight = profileIndex === (section.section_blocks.length - 1);

                            const otherBlocks = section.section_blocks
                              .filter((b: any) => b.templates_block?.block_name !== 'profile_picture')
                              .slice(0, 2);

                            const ProfileCircle = () => (
                              <div className="relative z-0 w-16 h-16 rounded-full bg-white/50 flex items-center justify-center text-[18px] flex-shrink-0 shadow-md border-2 border-white/60">
                                <Camera className="w-8 h-8 text-white/80" />
                              </div>
                            );

                            return (
                              <div
                                key={idx}
                                className="bg-white/25 backdrop-blur-sm rounded-md p-2 border border-white/40 flex items-start justify-between gap-2"
                              >
                                {/* === กรณีที่ 1: รูปอยู่ซ้าย (Profile Left) === */}
                                {/* เอาชื่อ Section มาไว้บนรูป */}
                                {!isProfileRight && (
                                  <>
                                    <div className="flex flex-col items-center min-w-[70px] mr-1">
                                      {/* ชื่อ Section อยู่บนรูป */}
                                      <div className="text-white text-[9px] font-semibold mb-1 truncate drop-shadow text-center w-full">
                                        {idx + 1}. {section.section_name}
                                      </div>
                                      <ProfileCircle />
                                    </div>

                                    {/* กล่องข้อความอยู่ขวา (ดันลงมานิดหน่อยด้วย pt-4 ให้สมดุลกับรูป) */}
                                    <div className="flex-1 flex flex-col gap-1.5 w-full pt-5 mt-1">
                                      {otherBlocks.length > 0 ? (
                                        otherBlocks.map((b: any, i: number) => (
                                          <div 
                                            key={i} 
                                            className="bg-white/50 text-[8px] text-gray-700 rounded-sm px-2 py-0.5 truncate shadow-sm border border-white/40 h-6 flex items-center w-full"
                                          >
                                            {b.templates_block?.block_type === 'image' ? '🖼️ image' : '📝 text'}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="bg-white/50 text-[8px] rounded-sm px-2 py-0.5 h-4 w-full"></div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* === กรณีที่ 2: รูปอยู่ขวา (Profile Right) === */}
                                {/* คง Layout เดิม: ชื่อ Section อยู่บนกล่องข้อความ */}
                                {isProfileRight && (
                                  <>
                                    <div className="flex-1 min-w-0 flex flex-col items-start text-left relative z-10 -mr-6 pr-8">
                                      {/* ชื่อ Section อยู่บนกล่องข้อความ */}
                                      <div className="text-white text-[10px] font-semibold mb-1 truncate drop-shadow w-full">
                                        {idx + 1}. {section.section_name}
                                      </div>
                                      <div className="flex flex-col gap-1.5 w-full items-end mt-2 ">
                                        {otherBlocks.length > 0 ? (
                                          otherBlocks.map((b: any, i: number) => (
                                            <div 
                                              key={i} 
                                              className="bg-white/50 text-[8px] text-gray-700 rounded-sm px-2 py-0.5 truncate shadow-sm border border-white/40 h-6 flex items-center w-full "
                                            >
                                              {b.templates_block?.block_type === 'image' ? '🖼️ image' : '📝 text'}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="bg-white/50 text-[8px] rounded-sm px-2 py-0.5 h-4 w-full"></div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-5 relative z-0">
                                      <ProfileCircle />
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              className="bg-white/25 backdrop-blur-sm rounded-md p-1.5 border border-white/40"
                            >
                              <div className="text-white text-[10px] font-semibold mb-0.5 truncate drop-shadow">
                                {idx + 1}. {section.section_name}
                              </div>
                              <div className="flex gap-0.5">
                                {section.section_blocks?.slice(0, 4).map((block, blockIdx) => (
                                  <div
                                    key={blockIdx}
                                    className="flex-1 bg-white/50 rounded-sm p-0.5 text-center min-w-0"
                                  >
                                    <div className="text-[10px]">
                                      {block.templates_block?.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {template.template_section_links.length > 3 && (
                          <div className="text-center text-white text-[10px] font-medium drop-shadow">
                            +{template.template_section_links.length - 3} sections
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-white text-4xl font-bold opacity-30">
                          {template.template_name.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Thumbnail image overlay - show only if valid thumbnail exists */}
                {template.thumbnail && 
                 !template.thumbnail.includes('example.com') && 
                 !template.thumbnail.includes('soundcloud.com') &&
                 !template.thumbnail.endsWith('/test.jpg') && (
                  <img
                    src={template.thumbnail}
                    alt={template.template_name}
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onLoad={(e) => {
                      console.log('✅ Image DISPLAYED:', template.thumbnail);
                    }}
                    onError={(e) => {
                      console.error('❌ Image ERROR:', template.thumbnail);
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                )}                
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center z-20">
                  <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all transform scale-90 group-hover:scale-100">
                    ดูรายละเอียด
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{template.template_name}</h3>
                  {template.category && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {template.category}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                  {template.description || "ไม่มีคำอธิบาย"}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>{template.template_section_links?.length || 0} sections</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/template/edit/${template.ID}`);
                  }}
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition"
                  title="แก้ไข"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไข
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ show: true, template });
                  }}
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  title="ลบ"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบ
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  ดูตัวอย่าง
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-xl text-gray-600 mb-2">ยังไม่มีเทมเพลต</p>
            <p className="text-gray-500">กดปุ่มด้านบนเพื่อสร้างเทมเพลตใหม่</p>
          </div>
        )}
      </div>

      {/* Modal - Template Detail */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedTemplate.template_name}
                </h2>
                <p className="text-gray-600">{selectedTemplate.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  {selectedTemplate.category && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {selectedTemplate.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {selectedTemplate.template_section_links?.length || 0}
                </span>
                Sections ในเทมเพลตนี้
              </h3>

              <div className="space-y-6">
                {selectedTemplate.template_section_links?.map((link) => {
                  const section = link.templates_section;
                  if (!section) return null;

                  return (
                    <div
                      key={link.ID}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">
                              Section {link.order_index + 1}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">
                              {section.section_name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-500">
                            {section.section_blocks?.length || 0} blocks
                          </p>
                        </div>
                      </div>

                      {/* Section Container with Layout */}
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                        {/* ตรวจสอบว่าเป็น Profile Layout หรือไม่ */}
                        {section.section_blocks && section.section_blocks.length > 0 && 
                         section.section_blocks[0].templates_block?.block_name === 'profile_picture' ? (
                          // Layout พิเศษสำหรับ Profile: วงกลมซ้าย + textbox เรียงแนวตั้งขวา
                          <div className="flex gap-4 items-center">
                            {/* Profile Picture - ด้านซ้าย */}
                            {(() => {
                              const sb = section.section_blocks[0];
                              const block = sb.templates_block;
                              let flexSettings: any = {};
                              let defaultStyle: any = {};
                              
                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {}

                              const combinedStyle: React.CSSProperties = {
                                width: '200px',
                                height: '200px',
                                minHeight: '200px',
                                display: 'flex',
                                borderRadius: '50%',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                                flexShrink: 0,
                              };

                              return (
                                <div style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">1</span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                    <div className="text-2xl mb-2">🖼️</div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Text Boxes - ด้านขวาเรียงแนวตั้ง */}
                            <div className="flex-1 flex flex-col gap-4">
                              {section.section_blocks.slice(1).map((sb, idx) => {
                                const block = sb.templates_block;
                                if (!block) return null;

                                let flexSettings: any = {};
                                let defaultStyle: any = {};

                                try {
                                  flexSettings = sb.flex_settings ? 
                                    (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                    : {};
                                  defaultStyle = block.default_style ? 
                                    (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                    : {};
                                } catch (e) {}

                                const combinedStyle: React.CSSProperties = {
                                  width: '100%',
                                  height: 'auto',
                                  minHeight: '60px',
                                  display: 'flex',
                                  borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                  backgroundColor: defaultStyle.background_color || '#ffffff',
                                  border: defaultStyle.border || '2px dashed #d1d5db',
                                  padding: defaultStyle.padding || '16px',
                                  boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                  position: 'relative',
                                };

                                return (
                                  <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                    <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                        {idx + 2}
                                      </span>
                                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                      <div className="text-2xl mb-2">📝</div>
                                      <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                      <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          ): section.section_blocks && section.section_blocks.length > 0 && 
                            section.section_blocks[section.section_blocks.length - 1].templates_block?.block_name === 'profile_picture' ? (

                            <div className="flex gap-4 items-start">
                              
                              {/* ส่วนที่ 1: Text Boxes - อยู่ฝั่งซ้าย (เอาทุกตัว ยกเว้นตัวสุดท้าย) */}
                              <div className="flex-1 flex flex-col gap-4">
                                {section.section_blocks.slice(0, -1).map((sb, idx) => {
                                  const block = sb.templates_block;
                                  if (!block) return null;

                                  // Logic ดึง Style (เหมือนเดิม)
                                  let flexSettings: any = {};
                                  let defaultStyle: any = {};
                                  try {
                                    flexSettings = sb.flex_settings ? (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) : {};
                                    defaultStyle = block.default_style ? (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) : {};
                                  } catch (e) {}

                                  const combinedStyle: React.CSSProperties = {
                                    width: '100%',
                                    height: 'auto',
                                    minHeight: '60px',
                                    display: 'flex',
                                    borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                    backgroundColor: defaultStyle.background_color || '#ffffff',
                                    border: defaultStyle.border || '2px dashed #d1d5db',
                                    padding: defaultStyle.padding || '16px',
                                    boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                    position: 'relative',
                                  };

                                  return (
                                    <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                          {sb.order_index + 1}
                                        </span>
                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                        <div className="text-2xl mb-2">📝</div>
                                        <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                        <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* ส่วนที่ 2: Profile Picture - อยู่ฝั่งขวา (เอาตัวสุดท้าย) */}
                              {(() => {
                                // ดึงตัวสุดท้ายมา
                                const sb = section.section_blocks[section.section_blocks.length - 1];
                                const block = sb.templates_block;
                                
                                let defaultStyle: any = {};
                                try {
                                  defaultStyle = block?.default_style ? (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) : {};
                                } catch (e) {}

                                const combinedStyle: React.CSSProperties = {
                                  width: '200px',
                                  height: '200px',
                                  minHeight: '200px',
                                  display: 'flex',
                                  borderRadius: '50%', // ทำเป็นวงกลม
                                  backgroundColor: defaultStyle.background_color || '#ffffff',
                                  border: defaultStyle.border || '2px dashed #d1d5db',
                                  padding: defaultStyle.padding || '16px',
                                  boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                  position: 'relative',
                                  flexShrink: 0,
                                };

                                return (
                                  <div style={combinedStyle} className="hover:shadow-lg transition-all group">
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                          {sb.order_index + 1}
                                      </span>
                                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">image</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                      <div className="text-2xl mb-2">🖼️</div>
                                      <div className="text-sm font-medium text-gray-700">{block?.block_name}</div>
                                      <div className="text-xs text-gray-400 mt-1">Right</div>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>
                        // วางเป็นกริด 2x2 สำหรับ Portfolio Showcase
                        ) : section.section_name === 'ผลงาน' || section.section_name === 'กิจกรรม' ? (
                          // Layout Grid 2x2 สำหรับ Portfolio Showcase
                          <div className="grid grid-cols-2 gap-4">
                            {section.section_blocks?.map((sb, index) => {
                              const block = sb.templates_block;
                              if (!block) return null;

                              let flexSettings: any = {};
                              let defaultStyle: any = {};

                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {}

                              const combinedStyle: React.CSSProperties = {
                                width: '100%',
                                height: 'auto',
                                minHeight: block.block_type === 'image' ? '200px' : '100px',
                                display: 'flex',
                                borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                              };

                              return (
                                <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                      {sb.order_index + 1}
                                    </span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                    <div className="text-2xl mb-2">
                                      {block.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div> 
                        ) : section.section_name === 'ทักษะ' || section.section_name === 'แนะนำตัว เพิ่มเติม' ? (
                          // Layout: เรียงข้างๆกันแนวตั้ง (Vertical Side-by-Side / Grid)
                          <div className="grid grid-cols-1 gap-4">
                            {section.section_blocks?.map((sb, index) => {
                              const block = sb.templates_block;
                              if (!block) return null;

                              let flexSettings: any = {};
                              let defaultStyle: any = {};

                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {}

                              const combinedStyle: React.CSSProperties = {
                                width: '100%',
                                height: 'auto',
                                minHeight: '80px',
                                display: 'flex',
                                borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                              };

                              return (
                                <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                      {sb.order_index + 1}
                                    </span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                    <div className="text-2xl mb-2">
                                      {block.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          ): (
                          // Layout ปกติ: เรียงข้างๆกันในแนวนอน
                          <div className="flex flex-wrap gap-4 items-start">
                            {section.section_blocks?.map((sb, index) => {
                              const block = sb.templates_block;
                              if (!block) return null;

                              let flexSettings: any = {};
                              let position: any = {};
                              let defaultStyle: any = {};

                              try {
                                flexSettings = sb.flex_settings ? 
                                  (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                                  : {};
                                position = sb.position ? 
                                  (typeof sb.position === 'string' ? JSON.parse(sb.position) : sb.position) 
                                  : {};
                                defaultStyle = block.default_style ? 
                                  (typeof block.default_style === 'string' ? JSON.parse(block.default_style) : block.default_style) 
                                  : {};
                              } catch (e) {
                                console.error('Error parsing JSON:', e);
                              }

                              const combinedStyle: React.CSSProperties = {
                                width: flexSettings.width || defaultStyle.width || 'auto',
                                height: flexSettings.height || defaultStyle.height || 'auto',
                                minHeight: block.block_type === 'image' ? '120px' : '60px',
                                minWidth: block.block_type === 'image' ? '120px' : '150px',
                                display: 'flex',
                                borderRadius: flexSettings.borderRadius || defaultStyle.border_radius || '8px',
                                flex: flexSettings.flex || '1',
                                backgroundColor: defaultStyle.background_color || '#ffffff',
                                border: defaultStyle.border || '2px dashed #d1d5db',
                                padding: defaultStyle.padding || '16px',
                                boxShadow: defaultStyle.box_shadow || '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                              };

                              return (
                                <div key={sb.ID} style={combinedStyle} className="hover:shadow-lg transition-all group">
                                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow">
                                      {sb.order_index + 1}
                                    </span>
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">{block.block_type}</span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center h-full text-gray-500 w-full text-center">
                                    <div className="text-2xl mb-2">
                                      {block.block_type === 'image' ? '🖼️' : '📝'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{block.block_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{block.block_type}</div>
                                  </div>
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {Object.keys(flexSettings).length > 0 && (
                                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                        Layout: {sb.layout_type || 'flex'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section Details (Expandable) */}
                      
                    </div>
                  );
                })}

                {(!selectedTemplate.template_section_links ||
                  selectedTemplate.template_section_links.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-lg">เทมเพลตนี้ยังไม่มี sections</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                ปิด
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}