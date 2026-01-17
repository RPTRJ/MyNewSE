"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    fetchMyPortfolios,
    fetchActivities,
    fetchWorkings,
    fetchPortfolioByStatusActive,
} from "@/services/portfolio";
import { fetchMyProfile } from "@/services/user";
import type { UserDTO } from "@/services/user";
import { color } from "motion-dom";
import type { DisplayUser } from "@/src/interfaces/portfolio";


// --- Helper Functions ---
function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const formatDateTH = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

function parseBlockContent(content: any): any {
    if (!content) return null;
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }
    return content;
}

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cuc3ZnLm9yZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4=";

function getImageUrl(image: any): string {
    return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || placeholderImage;
}

function extractImages(data: any, type: 'activity' | 'working'): any[] {
    if (!data) return [];
    let images = [];
    if (type === 'activity') {
        images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
    } else {
        images = data.WorkingDetail?.Images || data.working_detail?.images || [];
    }
    return Array.isArray(images) ? images : [];
}

export default function PortfolioPreviewPage() {
    const router = useRouter();

    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<DisplayUser | null>(null);
    const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});

    // --- DEBUGGING STATE ---
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const log = useCallback((message: string) => {
        // Use a function for setState to get the latest state
        setDebugLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, []);
    // --- END DEBUGGING STATE ---

    useEffect(() => {
        const loadData = async () => {
            // log("---" + "Starting Data Load" + "---");
            try {
                setLoading(true);
                setErrorMsg(null);

                log("Fetching portfolios, activities, workings, and profile in parallel...");
                const [activeRes, allPortfoliosRes, activitiesRes, workingsRes, userRes] = await Promise.all([
                    fetchPortfolioByStatusActive(),
                    fetchMyPortfolios({ includeBlocks: true }),
                    fetchActivities({ includeImages: true }),
                    fetchWorkings({ includeImages: true }),
                    fetchMyProfile(log), // Pass logger to fetchMyProfile
                ]);
                // log("All fetches complete.");
                // log(`userRes received in page: ${JSON.stringify(userRes, null, 2)}`);

                let activePortfolio = activeRes.data;

                if (!activePortfolio || !activePortfolio.ID) {
                    // log("No active portfolio found, searching latest from all portfolios.");
                    const allPortfolios = allPortfoliosRes.data || [];
                    if (allPortfolios.length > 0) {
                        allPortfolios.sort((a: any, b: any) => (b.ID || 0) - (a.ID || 0));
                        activePortfolio = allPortfolios[0];
                        // log(`Using latest portfolio with ID: ${activePortfolio.ID}`);
                    }
                }

                if (activePortfolio && activePortfolio.ID) {
                    if (activePortfolio.portfolio_sections) {
                        activePortfolio.portfolio_sections.sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));
                    }
                    setPortfolio(activePortfolio);
                    // log("Portfolio state set.");
                }

                setActivities(activitiesRes.data || []);
                setWorkings(workingsRes.data || []);
                // log("Activities and Workings state set.");

                // log("Processing user profile data...");
                const education = (userRes as UserDTO).education || {};
                const academic_score = (userRes as UserDTO).academic_score || {};

                const schoolName = education.school?.name || education.school_name || "Suranaree University of Technology";
                const majorName = education.curriculum_type?.name || "-";

                const rawGpax = academic_score.gpax;
                const gpax = rawGpax ? Number(rawGpax).toFixed(2) : "-";

                const finalUser = {
                    firstname: (userRes as UserDTO).first_name_th || (userRes as UserDTO).first_name_en || "-",
                    lastname: (userRes as UserDTO).last_name_th || (userRes as UserDTO).last_name_en || "-",
                    major: majorName,
                    school: schoolName,
                    profile_image: (userRes as UserDTO).profile_image_url || "",
                    gpa: gpax,
                    academic_score: academic_score || {},
                };

                // log(`Final user object to be set: ${JSON.stringify(finalUser, null, 2)}`);
                setCurrentUser(finalUser);
                // log("currentUser state set.");

            } catch (error: any) {
                // log(`--- CATCH BLOCK: An error occurred ---`);
                // log(`Error message: ${error.message}`);
                // log(`Error status: ${error.status}`);
                // log(`Full error object: ${JSON.stringify(error, null, 2)}`);
                console.error(error);
                setErrorMsg(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลที่ไม่รู้จัก");
            } finally {
                // log("--- Load Finished ---");
                setLoading(false);
            }
        };

        loadData();
    }, [router]); // Add `log` to dependency array

    useEffect(() => {
        if (portfolio?.font?.font_url) {
            const link = document.createElement('link');
            link.href = portfolio.font.font_url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => { document.head.removeChild(link); };
        }
    }, [portfolio]);

    //ฟังชันเปลี่ยนรูปภาพ
    const handleNextImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setImageIndices(prev => ({
            ...prev,
            [blockId]: ((prev[blockId] || 0) + 1) % totalImages
        }));
    };

    const handlePrevImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setImageIndices(prev => ({
            ...prev,
            [blockId]: ((prev[blockId] || 0) - 1 + totalImages) % totalImages
        }));
    };

    const renderSectionContent = (section: any) => {
        const blocks = section.portfolio_blocks || [];

        // เช็คว่าเป็น Section โปรไฟล์
        const isIntroSection = section.section_title?.includes("แนะนำตัว") ||
            section.section_title?.toLowerCase().includes("profile") ||
            (section as any).layout_type?.includes('profile');

        if (isIntroSection) {
            const isRight = section.section_title?.toLowerCase().includes('right') ||
                (section as any).layout_type === 'profile_header_right';

            const user = currentUser || {
                firstname: "Loading...",
                lastname: "",
                major: "-",
                school: "-",
                profile_image: "", // Should be string, not null
                gpa: "0.00", // Add gpa to the placeholder
                academic_score: { gpax: "0.00" }
            };
            const gpax = user.academic_score?.gpax || user.gpa || "-";

            // กรองเอาเฉพาะ Text Blocks ที่กดเพิ่มเข้ามา
            const textBlocks = blocks.filter((block: any) => {
                const c = parseBlockContent(block.content);
                return c?.type === 'text';
            });
            const isAdditionalIntro = section.section_title?.includes("แนะนำตัว เพิ่มเติม");
            const primaryColor = portfolio.colors?.primary_color || '#FF6B35';
            return (
                <div className="flex flex-col w-full gap-6">

                    {/* 1. ส่วน Profile Card (เก็บไว้ตามที่ขอ) */}
                    {!isAdditionalIntro && (
                        <div className={`flex flex-col items-center gap-6 p-6 bg-white border border-gray-100 rounded-xl shadow-sm w-full 
                                     ${isRight ? 'md:flex-row-reverse text-right' : 'md:flex-row text-left'}`}>
                            <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                                <img
                                    src={user.profile_image || placeholderImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => e.currentTarget.src = placeholderImage}
                                />
                            </div>
                            <div className={`flex-1 w-full space-y-3 ${isRight ? 'md:items-end' : 'md:items-start'}`}>
                                <div className={`border-gray-100 ${isRight ? 'flex flex-col items-end' : ''}`}>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {user.firstname} {user.lastname}
                                    </h3>
                                    <p className="font-medium"
                                        style={{ color: primaryColor || '#ff6b35' }} // ✅ ใช้สีจาก Theme
                                    >
                                        {user.school || "Suranaree University of Technology"}
                                    </p>
                                    <p><span className="font-bold text-gray-800">Major:</span> {user.major}</p>
                                    <p><span className="font-bold text-gray-800">GPAX:</span> <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{gpax}</span></p>
                                </div>
                                <div className={`space-y-1 text-sm text-gray-600 ${isRight ? 'flex flex-col items-end' : ''}`}>
                                    {user.academic_score && (user.academic_score.math || user.academic_score.eng || user.academic_score.sci || user.academic_score.lang || user.academic_score.social) && (
                                        <div className="mt-2 border-t border-gray-100 pt-2 text-xs w-full">
                                            <p className="font-bold text-gray-700 mb-1">คะแนนรายวิชา</p>
                                            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                                                {user.academic_score.math && <p><span className="font-semibold">คณิต:</span> {user.academic_score.math}</p>}
                                                {user.academic_score.eng && <p><span className="font-semibold">อังกฤษ:</span> {user.academic_score.eng}</p>}
                                                {user.academic_score.sci && <p><span className="font-semibold">วิทย์:</span> {user.academic_score.sci}</p>}
                                                {user.academic_score.lang && <p><span className="font-semibold">ไทย:</span> {user.academic_score.lang}</p>}
                                                {user.academic_score.social && <p><span className="font-semibold">สังคม:</span> {user.academic_score.social}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. ส่วนรายการข้อความ (Text Blocks) */}
                    {textBlocks.length > 0 && (
                        <div className="flex flex-col gap-4 w-full">
                            {/* หัวข้อเล็กๆ ถ้าต้องการ (ถ้าไม่เอาก็ลบ div นี้ทิ้งได้) */}
                            <div className="flex items-center gap-4">
                                {/* <h3 className="text-xl font-bold text-gray-800">แนะนำตัว เพิ่มเติม</h3> */}
                                {/* <div className="h-1 flex-1 rounded-full bg-gray-100"></div> */}
                            </div>

                            {/* Loop แสดงกล่องข้อความ */}
                            {textBlocks.map((block: any, idx: number) => {
                                const c = parseBlockContent(block.content);
                                return (
                                    <div key={block.ID || idx} className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-start gap-4">
                                            {/* เนื้อหา */}
                                            <div className="flex-1">

                                                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-xl">
                                                    {c.detail}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            );
        }
        // ส่วนแสดงผล Section อื่นๆ (Activity / Work)
        if (blocks.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-2xl mb-2">📭</div>
                    <div className="text-sm">ยังไม่มีเนื้อหาในส่วนนี้</div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block: any, idx: number) => {
                    const c = parseBlockContent(block.content);
                    if (c?.type === 'profile') return null;

                    // แสดง Text Block ใน Section อื่นๆ (ถ้ามี)
                    if (c?.type === 'text') {
                        return (
                            <div key={block.ID || idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
                                <h4 className="font-bold text-gray-800 mb-2">{c.title || 'ข้อความ'}</h4>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap break-words">{c.detail}</div>
                            </div>
                        );
                    }

                    // แสดง Activity / Working (เหมือนเดิม)
                    let itemData = null;
                    if (c?.type === 'activity') itemData = activities.find((a: any) => a.ID == c.data_id);
                    else if (c?.type === 'working') itemData = workings.find((w: any) => w.ID == c.data_id);

                    const finalData = itemData || c?.data;
                    if (!finalData) return null;

                    const images = extractImages(finalData, c.type);
                    const uniqueKey = block.ID ? block.ID.toString() : `${section.ID}-${idx}`;
                    const currentIndex = imageIndices[uniqueKey] || 0;
                    const currentImageSrc = images.length > 0 ? getImageUrl(images[currentIndex]) : placeholderImage;

                    const date = finalData.activity_detail?.activity_at || finalData.working_detail?.working_at;
                    const location = finalData.activity_detail?.institution || finalData.location;
                    const award = finalData.reward?.level_name;
                    const level = finalData.activity_detail?.level_activity?.level_name;
                    const category = finalData.activity_detail?.type_activity?.type_name || finalData.working_detail?.type_working?.type_name;
                    const description = finalData.activity_detail?.description || finalData.working_detail?.description || "-";

                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative">
                            <div className="h-80 w-full bg-gray-100 relative overflow-hidden group">
                                <img src={currentImageSrc} className="w-full h-full object-cover transition-all duration-500" />
                                <span className={`absolute top-2 right-2 text-[10px] text-white px-2 py-1 rounded font-bold uppercase z-10 ${c.type === 'activity' ? 'bg-orange-400' : 'bg-blue-400'}`}>
                                    {c.type}
                                </span>
                                {images.length > 1 && (
                                    <>
                                        <button onClick={(e) => handlePrevImage(uniqueKey, images.length, e)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                        </button>
                                        <button onClick={(e) => handleNextImage(uniqueKey, images.length, e)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                        </button>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                            {images.map((_: any, i: number) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-1 h-full">
                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                                    {c.type === 'activity' ? finalData.activity_name : finalData.working_name}
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {level && <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-medium">{level}</span>}
                                    {category && <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">{category}</span>}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
                                <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-1.5">
                                    {award && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="bg-yellow-50 p-1 rounded"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-600"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.637 6.637 0 002.545 5.123c.388.263.803.493 1.237.682 1.327.58 2.793 1.032 4.302 1.309.37.068.732.14.962.387.246.265.485.642.485 1.139v3.016a29.89 29.89 0 00-6.02 1.365.75.75 0 00-.462.685c.178 1.956 1.48 3.518 3.212 4.295.66.295 1.396.447 2.164.447h2.09c.768 0 1.503-.152 2.164-.447 1.732-.777 3.034-2.339 3.212-4.295a.75.75 0 00-.462-.685 29.89 29.89 0 00-6.02-1.365v-3.016c0-.497.24-.874.485-1.139.23-.247.592-.32.962-.387 1.509-.277 2.975-.729 4.302-1.309.434-.189.849-.419 1.237-.682a6.637 6.637 0 002.545-5.123.75.75 0 00-.584-.859 13.926 13.926 0 00-3.071-.543v-.858a.75.75 0 00-.75-.75h-11.25a.75.75 0 00-.75.75z" clipRule="evenodd" /></svg></div>
                                            <span className="font-medium text-gray-700">{award}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <div className="bg-blue-50 p-1 rounded"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-500"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg></div>
                                        <span className="font-medium text-gray-600">{formatDateTH(date)}</span>
                                    </div>
                                    {location && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="bg-rose-50 p-1 rounded"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-rose-500"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.003.002.001.003.001a.75.75 0 01-.01-.001zM10 12.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" clipRule="evenodd" /></svg></div>
                                            <span className="font-medium text-gray-600 line-clamp-1">{location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="p-10 text-center">
                <div className="p-10 text-center text-red-700 bg-red-100 rounded-lg border border-red-200">
                    <p className="text-lg font-bold mb-2">พบข้อผิดพลาด</p>
                    <p>{errorMsg}</p>
                </div>
            </div>
        );
    }

    if (!portfolio) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-32 h-32 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-orange-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">ยังไม่มีแฟ้มสะสมผลงาน</h2>
                    <p className="text-gray-500 mb-8">
                        เริ่มสร้างแฟ้มสะสมผลงานของคุณเพื่อรวบรวมกิจกรรมและผลงานต่างๆ ไว้ในที่เดียว
                    </p>
                    <button
                        onClick={() => router.push('/student/portfolio/managePortfolio')}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        สร้างแฟ้มสะสมผลงาน
                    </button>
                </div>
            </div>
        );
    }

    const primaryColor = portfolio.colors?.primary_color || '#FF6B35';
    const backgroundColor = portfolio.colors?.background_color || '#ffffff';
    const fontFamily = portfolio.font?.font_family || 'inherit';

    return (
        <div className="min-h-screen bg-white p-6 pb-20"
            style={{ backgroundColor: lightenColor(backgroundColor, 100), fontFamily }}>

            <div className="mx-auto" style={{ maxWidth: 1500 }}>
                <div className="flex justify-end items-center mb-6">
                    <button
                        onClick={() => router.push(`/student/portfolio/managePortfolio`)}
                        className="px-4 py-2 text-white rounded-lg shadow-sm flex items-center gap-2 transition font-medium hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        จัดการ Portfolio
                    </button>
                </div>

                <div className="space-y-6">
                    {portfolio.portfolio_sections?.filter((s: any) => s.is_enabled !== false).map((section: any, idx: number) => {
                        const isProfile = section.section_title?.toLowerCase().includes('profile') ||
                            section.layout_type?.includes('profile');
                        return (
                            <div key={section.ID} className="flex flex-col gap-4">
                                {!isProfile && (
                                    <div className="flex items-center gap-4 mb-4 mt-8">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {section.section_title}
                                        </h2>
                                        <div className="h-1 flex-1 rounded-full bg-gray-100"></div>
                                    </div>
                                )}
                                <div className="p-6 transition-colors duration-500 rounded-lg"
                                    style={{
                                        backgroundColor: backgroundColor,
                                        fontFamily: fontFamily
                                    }}>
                                    {renderSectionContent(section)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}