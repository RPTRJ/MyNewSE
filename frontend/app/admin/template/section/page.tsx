"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Section } from "@/src/interfaces/section"; 
import { fetchSections } from "@/services/sections";
import { Camera, ImageIcon, FileText } from "lucide-react";
import { color } from "framer-motion";


export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
     
      const data = await fetchSections();
      
      console.log("🔍 API Response:", data);
      
      // เรียง section_blocks ตาม order_index
      const sortedData = data.map((section: Section) => ({
        ...section,
        section_blocks: section.section_blocks?.sort(
        (a, b) => a.order_index - b.order_index
        ) || [],
      }));
      
      setSections(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">

              <div className="hidden md:flex items-center gap-6">
                <Link href="/admin/template" className="text-gray-600 hover:text-gray-900 transition pb-1">
                  Templates
                </Link>
                <Link href="/admin/template/section" className="text-orange-500 font-medium hover:text-orange-600 transition border-b-2 border-orange-500 pb-1">
                  Sections
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-orange-500">Section Templates</h1>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.ID}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              onClick={() => setSelectedSection(section)}
            >
              {/* Enhanced Section Preview */}
              <div 
                className="h-48 flex-shrink-0 relative overflow-hidden p-2"
                style={{ 
                  background: 'linear-gradient(to bottom right,orange ,yellow)',
                }}
              >
                <div className="absolute inset-0 p-2 flex flex-col gap-1.5 z-0 pointer-events-none">
                    {(() => {
                        // Detect profile_picture anywhere in section and render compact preview
                        const profileIndex = section.section_blocks
                          ? section.section_blocks.findIndex(
                              (sb: any) => sb.templates_block?.block_name === 'profile_picture'
                            )
                          : -1;

                        if (profileIndex !== -1 && section.section_blocks) {
                          const isProfileRight = profileIndex === (section.section_blocks.length - 1);

                          const otherBlocks = section.section_blocks
                            .filter((b: any) => b.templates_block?.block_name !== 'profile_picture')
                            .slice(0, 2);

                          const ProfileCircle = () => (
                            <div className="relative z-0 w-16 h-16 rounded-full bg-white/50 flex items-center justify-center text-[18px] flex-shrink-0 shadow-md border-2 border-black/30">
                              <Camera className="w-8 h-8 text-black/80" />
                            </div>
                          );

                          return (
                            <div
                              className="bg-white/25 backdrop-blur-sm rounded-md p-2 border border-white/40 flex items-start justify-between gap-2 h-full"
                            >
                              {!isProfileRight && (
                                <>
                                  <div className="mt-2 relative z-0 ">
                                    <ProfileCircle />
                                  </div>
                                  <div className="flex-1 flex flex-col gap-1.5 w-full pt-2">
                                    {otherBlocks.map((b: any, i: number) => (
                                      <div 
                                        key={i} 
                                        className="bg-white/50 text-[8px] text-gray-700 rounded-sm px-2 py-0.5 truncate shadow-sm border border-white/40 h-8 flex items-center justify-center"
                                      >
                                        {b.templates_block?.block_type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {isProfileRight && (
                                <>
                                  <div className="flex-1 min-w-0 flex flex-col items-start text-left relative z-10 -mr-6 pr-8 pt-2">
                                    <div className="flex flex-col gap-1.5 w-full items-end mt-2 ">
                                      {otherBlocks.map((b: any, i: number) => (
                                        <div 
                                          key={i} 
                                          className="bg-white/50 text-[8px] text-gray-700 rounded-sm px-2 py-0.5 truncate shadow-sm border border-white/40 h-8 flex items-center justify-center w-full"
                                        >
                                          {b.templates_block?.block_type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="mt-5 relative z-0 ">
                                    <ProfileCircle />
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        }

                        // Fallback for non-profile sections
                        return (() => {
                          const blocks = section.section_blocks?.slice(0, 4) || [];
                          const hasImage = blocks.some(block => block.templates_block?.block_type === 'image');
                          const gridColsClass = hasImage ? 'grid-cols-2' : 'grid-cols-1';

                          return (
                            <div className="bg-white/25 backdrop-blur-sm rounded-md p-1.5 border border-white/40 h-full">
                              <div className={`grid ${gridColsClass} gap-1 h-full`}>
                                {blocks.map((block, blockIdx) => (
                                  <div
                                    key={blockIdx}
                                    className="flex-1 bg-white/50 rounded-sm p-0.5 text-center min-w-0 flex items-center justify-center"
                                  >
                                    <div className="text-black">
                                      {block.templates_block?.block_type === 'image' ? <ImageIcon /> : <FileText />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })();
                    })()}
                </div>
                 <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all transform scale-90 group-hover:scale-100">
                    ดูรายละเอียด
                  </button>
                </div>
              </div>

              {/* Section Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{section.section_name}</h3>
                  {section.section_type && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {section.section_type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                    </svg>
                    <span>{section.section_blocks?.length || 0} blocks</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSection(section);
                  }}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                >
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📑</div>
            <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections</p>
            <p className="text-gray-500">กดปุ่มด้านบนเพื่อสร้าง Section ใหม่</p>
          </div>
        )}
      </div>

      {/* Modal - Section Detail */}
      {selectedSection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSection(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedSection.section_name}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  {selectedSection.section_type && (
                    <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {selectedSection.section_type}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSection(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {selectedSection.section_blocks?.length || 0}
                </span>
                Blocks ใน Section นี้
              </h3>

              {/* Section Preview Container */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-6 min-h-[300px]" style={{ overflow: 'auto', }}>
                {selectedSection.section_blocks && selectedSection.section_blocks.length > 0 ? (
                  <>
                    {selectedSection.section_blocks.map((sb) => {
                      const block = sb.templates_block;
                      if (!block) return null;

                      // Parse JSON
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

                      // Combined styles - ใช้ค่าจาก database
                      const combinedStyle: React.CSSProperties = {
                        ...flexSettings,
                        ...position,
                        backgroundColor: defaultStyle.background_color || '#ffffff',
                        border: defaultStyle.border || '2px solid #e5e7eb',
                        padding: defaultStyle.padding || '16px',
                        boxShadow: defaultStyle.box_shadow || '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative',
                        minHeight: block.block_type === 'image' ? '200px' : '60px',
                      };

                      return (
                        <div
                          key={sb.ID}
                          style={combinedStyle}
                          className="hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
                        >

                          {/* Block Content */}
                          <div className="flex flex-col items-center justify-center h-full min-h-[80px]">
                            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                              {block.block_type === 'image' ? '🖼️' : 
                               block.block_type === 'text' ? '📝' : '📦'}
                            </div>
                            <div className="text-sm font-bold text-gray-800 text-center">
                              {block.block_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Type: {block.block_type}
                            </div>
                          </div>

                          {/* Layout Badge */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sb.layout_type && (
                              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow">
                                {sb.layout_type}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ clear: 'both' }}></div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[250px]">
                    <div className="text-center">
                      <div className="text-5xl mb-3 opacity-30">📦</div>
                      <p className="text-gray-400">Section นี้ยังไม่มี blocks</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Blocks Details */}
              <div className="space-y-3">
                {/* <h4 className="font-semibold text-gray-700 mb-3">รายละเอียด Blocks:</h4> */}
                {selectedSection.section_blocks?.map((sb) => {
                  const block = sb.templates_block;
                  if (!block) return null;

                  let flexSettings: any = {};
                  let position: any = {};

                  try {
                    flexSettings = sb.flex_settings ? 
                      (typeof sb.flex_settings === 'string' ? JSON.parse(sb.flex_settings) : sb.flex_settings) 
                      : {};
                    position = sb.position ? 
                      (typeof sb.position === 'string' ? JSON.parse(sb.position) : sb.position) 
                      : {};
                  } catch (e) {}

                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSection(null)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                ปิด
              </button>
              <button
                onClick={() => alert(`แก้ไข: ${selectedSection.section_name}`)}
                className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
              >
                แก้ไข Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}