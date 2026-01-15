// // "use client";

// // import { useEffect, useState } from "react";

// // export default function SectionsPage() {
// //   const [sections, setSections] = useState<any[]>([]);
// //   const [selectedSection, setSelectedSection] = useState<any>(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     console.log("Fetching sections...");
// //     fetch("http://localhost:8080/template_sections")
// //       .then((res) => res.json())
// //       .then((data) => {
// //         console.log("Fetched sections:", data);
// //         setSections(data);
// //         setLoading(false);
// //       })
// //       .catch((err) => {
// //         console.error("Error:", err);
// //         setLoading(false);
// //       });
// //   }, []);

// //   if (loading) return <div className="p-6">กำลังโหลด...</div>;

// //   return (
// //     <div className="p-6">
// //       <div className="flex w-full items-center justify-between p-3 mb-6">
// //         <h1 className="text-2xl font-bold">Section Templates</h1>
// //         <button
// //           type="button"
// //           className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
// //         >
// //           สร้าง Section ใหม่
// //         </button>
// //       </div>

// //       {/* Grid แสดง sections */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //         {sections.map((section) => (
// //           <div
// //             key={section.ID}
// //             className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
// //             onClick={() => setSelectedSection(section)}
// //           >
// //             {/* Header ของ card */}
// //             <div className="p-4 border-b">
// //               <h3 className="text-lg font-semibold text-gray-800">
// //                 {section.section_name}
// //               </h3>
// //               <p className="text-sm text-gray-500 mt-1">
// //                 Type: {section.section_type}
// //               </p>
// //               <p className="text-xs text-gray-400 mt-1">
// //                 {section.SectionBlocks?.length || 0} blocks
// //               </p>
// //             </div>

// //             {/* Preview แบบย่อ */}
// //             <div className="p-4 bg-gray-50">
// //               <div className="space-y-2">
// //                 {section.SectionBlocks?.slice(0, 3).map((sb: any, index: number) => (
// //                   <div
// //                     key={sb.ID}
// //                     className="h-12 bg-white border rounded flex items-center justify-center text-xs text-gray-500"
// //                   >
// //                     {sb.TemplatesBlock?.block_name || `Block ${index + 1}`}
// //                   </div>
// //                 ))}
// //                 {(section.SectionBlocks?.length || 0) > 3 && (
// //                   <div className="text-center text-xs text-gray-400">
// //                     +{section.SectionBlocks.length - 3} more blocks
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Footer */}
// //             <div className="p-4 border-t flex justify-end gap-2">
// //               <button
// //                 onClick={(e) => {
// //                   e.stopPropagation();
// //                   setSelectedSection(section);
// //                 }}
// //                 className="text-sm text-blue-600 hover:text-blue-800"
// //               >
// //                 ดูรายละเอียด
// //               </button>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Empty state */}
// //       {sections.length === 0 && (
// //         <div className="text-center py-12 text-gray-400">
// //           <p className="text-lg">ยังไม่มี Section Template</p>
// //           <p className="text-sm mt-2">กดปุ่มด้านบนเพื่อสร้างใหม่</p>
// //         </div>
// //       )}

// //       {/* Modal แสดงรายละเอียด Section */}
// //       {selectedSection && (
// //         <div
// //           className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
// //           onClick={() => setSelectedSection(null)}
// //         >
// //           <div
// //             className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             {/* Header */}
// //             <div className="p-6 border-b flex justify-between items-start">
// //               <div>
// //                 <h2 className="text-2xl font-bold text-gray-800">
// //                   {selectedSection.section_name}
// //                 </h2>
// //                 <p className="text-sm text-gray-500 mt-1">
// //                   Type: {selectedSection.section_type} | ID: {selectedSection.ID}
// //                 </p>
// //               </div>
// //               <button
// //                 onClick={() => setSelectedSection(null)}
// //                 className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
// //               >
// //                 ×
// //               </button>
// //             </div>

// //             {/* Content - Scrollable */}
// //             <div className="flex-1 overflow-y-auto p-6">
// //               <h3 className="text-lg font-semibold mb-4">
// //                 Blocks ใน Section ({selectedSection.SectionBlocks?.length || 0})
// //               </h3>

// //               <div className="space-y-4">
// //                 {selectedSection.SectionBlocks?.map((sb: any, index: number) => (
// //                   <div
// //                     key={sb.ID}
// //                     className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
// //                   >
// //                     {/* Block Header */}
// //                     <div className="flex justify-between items-start mb-3">
// //                       <div>
// //                         <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
// //                           Position {sb.order_index}
// //                         </span>
// //                         <h4 className="text-md font-semibold mt-2">
// //                           {sb.TemplatesBlock?.block_name || "Unnamed Block"}
// //                         </h4>
// //                         <p className="text-sm text-gray-600">
// //                           Type: {sb.TemplatesBlock?.block_type || "unknown"}
// //                         </p>
// //                       </div>
// //                       <span className="text-xs text-gray-400">
// //                         Block ID: {sb.TemplatesBlock?.ID}
// //                       </span>
// //                     </div>

// //                     {/* Block Preview */}
// //                     {sb.TemplatesBlock?.default_style && (
// //                       <div
// //                         style={{
// //                           width: sb.TemplatesBlock.default_style.width || "100%",
// //                           height: sb.TemplatesBlock.default_style.height || "100px",
// //                           backgroundColor:sb.TemplatesBlock.default_style.background_color || "#f3f4f6",
// //                           border: sb.TemplatesBlock.default_style.border || "1px solid #e5e7eb",
// //                           borderRadius: sb.TemplatesBlock.default_style.border_radius || "4px",
// //                           padding: sb.TemplatesBlock.default_style.padding || "16px",
// //                         }}
// //                         className="flex items-center justify-center text-gray-400 text-sm"
// //                       >
// //                         {sb.TemplatesBlock?.block_name} Preview
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}

// //                 {(!selectedSection.SectionBlocks || selectedSection.SectionBlocks.length === 0) && (
// //                   <div className="text-center py-8 text-gray-400">
// //                     Section นี้ยังไม่มี blocks
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Footer */}
// //             <div className="p-6 border-t flex justify-end gap-3">
// //               <button
// //                 onClick={() => setSelectedSection(null)}
// //                 className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
// //               >
// //                 ปิด
// //               </button>
// //               <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
// //                 ใช้ Section นี้
// //               </button>
// //               <button className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
// //                 แก้ไข Section
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }


// "use client";

// import { useEffect, useState } from "react";
// import { fetchSections } from "@/services/sections";

// export default function SectionsPage() {
//   const [sections, setSections] = useState<any[]>([]);
//   const [selectedSection, setSelectedSection] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   const loadAll = async () => {
//     try {
//       const data = await fetchSections();
//       console.log("Fetched sections:", data);
//       setSections(data);
//     } catch (err) {
//       console.error("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

      
//   useEffect(() => {
//     // fetch("http://localhost:8080/template_sections")
//     //   .then((res) => res.json())
//     //   .then((data) => {
//     //     console.log("Sections data:", data);
//     //     setSections(data);
//     //     setLoading(false);
//     //   })
//     //   .catch((err) => {
//     //     console.error("Error:", err);
//     //     setLoading(false);
//     //   });
//     loadAll();
  
//   }, []);

//   if (loading) return <div className="p-6">กำลังโหลด...</div>;

//   return (
//     <div className="p-6">
//       <div className="flex w-full items-center justify-between p-3 mb-6">
//         <h1 className="text-2xl font-bold">Section Templates</h1>
//         <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
//           สร้าง Section ใหม่
//         </button>
//       </div>

//       {/* Grid แสดง sections */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {sections.map((section) => (
//           <div
//             key={section.ID}
//             className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
//             onClick={() => setSelectedSection(section)}
//           >
//             {/* Header ของ card */}
//             <div className="p-4 border-b">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 {section.section_name}
//               </h3>
//               <p className="text-sm text-gray-500 mt-1">
//                 {section.section_blocks?.length || 0} blocks
//               </p>
//             </div>

//             {/* Preview blocks ย่อ */}
//             <div className="p-4 bg-gray-50">
//               <div className="space-y-2">
//                 {section.section_blocks?.slice(0, 3).map((sb: any, index: number) => (
//                   <div
//                     key={sb.ID}
//                     className="h-12 bg-white border rounded flex items-center justify-center text-xs text-gray-500"
//                   >
//                     {sb.templates_block?.block_name || `Block ${index + 1}`}
//                   </div>
//                 ))}
//                 {(section.section_blocks?.length || 0) > 3 && (
//                   <div className="text-center text-xs text-gray-400">
//                     +{section.section_blocks.length - 3} more blocks
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="p-4 border-t flex justify-end">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setSelectedSection(section);
//                 }}
//                 className="text-sm text-blue-600 hover:text-blue-800"
//               >
//                 ดูรายละเอียด
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Empty state */}
//       {sections.length === 0 && (
//         <div className="text-center py-12 text-gray-400">
//           <p className="text-lg">ยังไม่มี Section Template</p>
//         </div>
//       )}

//       {/* Modal แสดงรายละเอียด Section */}
//       {selectedSection && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedSection(null)}
//         >
//           <div
//             className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Header */}
//             <div className="p-6 border-b flex justify-between items-start">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-800">
//                   {selectedSection.section_name}
//                 </h2>
//                 <p className="text-sm text-gray-500 mt-1">
//                   ID: {selectedSection.ID} | {selectedSection.section_blocks?.length || 0} blocks
//                 </p>
//               </div>
//               <button
//                 onClick={() => setSelectedSection(null)}
//                 className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
//               >
//                 ×
//               </button>
//             </div>

//             {/* Content - Scrollable */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <h3 className="text-lg font-semibold mb-4">
//                 Blocks ใน Section นี้
//               </h3>

//               <div className="space-y-4">
//                 {selectedSection.section_blocks?.map((sb: any, index: number) => {
//                   const block = sb.templates_block;
//                   const style = block?.default_style || {};

//                   return (
//                     <div
//                       key={sb.ID}
//                       className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
//                     >
//                       {/* Block Header */}
//                       <div className="flex justify-between items-start mb-3">
//                         <div>
//                           <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
//                             Position {sb.order_index}
//                           </span>
//                           <h4 className="text-md font-semibold mt-2">
//                             {block?.block_name || "Unnamed Block"}
//                           </h4>
//                           <p className="text-sm text-gray-600">
//                             Type: {block?.block_type || "unknown"}
//                           </p>
//                         </div>
//                         <span className="text-xs text-gray-400">
//                           Block ID: {block?.ID}
//                         </span>
//                       </div>

//                       {/* Block Preview */}
//                       <div className="mt-3">
//                         <p className="text-xs text-gray-500 mb-2">Preview:</p>
//                         <div
//                           style={{
//                             width: style.width || "100%",
//                             height: style.height || "100px",
//                             backgroundColor: style.background_color || "#f3f4f6",
//                             border: style.border || "1px solid #e5e7eb",
//                             borderRadius: style.border_radius || "4px",
//                             padding: style.padding || "16px",
//                             boxShadow: style.box_shadow || "none",
//                             maxWidth: "100%",
//                             margin: "0 auto",
//                           }}
//                           className="flex items-center justify-center text-gray-400 text-sm"
//                         >
//                           {block?.block_name}
//                         </div>

//                         {/* แสดง default_content ถ้ามี */}
//                         {block?.default_content && (
//                           <div className="mt-2 text-xs text-gray-600">
//                             <p className="font-semibold">Default Content:</p>
//                             <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
//                               {JSON.stringify(block.default_content, null, 2)}
//                             </pre>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {(!selectedSection.section_blocks || selectedSection.section_blocks.length === 0) && (
//                   <div className="text-center py-8 text-gray-400">
//                     Section นี้ยังไม่มี blocks
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="p-6 border-t flex justify-end gap-3">
//               <button
//                 onClick={() => setSelectedSection(null)}
//                 className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
//               >
//                 ปิด
//               </button>
//               <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
//                 ใช้ Section นี้
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


//test code v2
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Section } from "@/src/interfaces/section"; 
import { fetchSections } from "@/services/sections";


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
    <div className="min-h-screen bg-white-50">
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Section Templates</h1>
            <p className="text-gray-600 mt-2">จัดการ Sections สำหรับสร้าง Portfolio</p>
          </div>
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              สร้าง Section ใหม่
            </span>
          </button>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.ID}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              onClick={() => setSelectedSection(section)}
            >
              {/* Section Preview */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 relative overflow-hidden p-4">
                <div className="text-white">
                  <div className="text-xs font-semibold mb-2 opacity-80">PREVIEW</div>
                  <div className="space-y-2">
                    {section.section_blocks?.slice(0, 3).map((sb, idx) => (
                      <div
                        key={sb.ID}
                        className="bg-white bg-opacity-20 backdrop-blur-sm rounded px-3 py-2 text-xs"
                      >
                        {sb.templates_block?.block_name || `Block ${idx + 1}`}
                      </div>
                    ))}
                    {(section.section_blocks?.length || 0) > 3 && (
                      <div className="text-xs opacity-70">
                        +{(section.section_blocks?.length || 0) - 3} more...
                      </div>
                    )}
                  </div>
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
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>ID: {section.ID}</span>
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
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500 transition"
                >
                  ดูรายละเอียด
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`แก้ไข: ${section.section_name}`);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  แก้ไข
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
                  <span className="text-sm text-gray-500">
                    Section ID: {selectedSection.ID}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedSection.section_blocks?.length || 0} Blocks
                  </span>
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
                          {/* Block Badge */}
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              #{sb.order_index + 1}
                            </span>
                            <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                              {block.block_type}
                            </span>
                          </div>

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
                className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
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