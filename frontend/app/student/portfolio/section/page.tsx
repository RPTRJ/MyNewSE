"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ProfileBlock,
    ShowcaseBlock
} from "@/src/components/informationPortfolio";
import {
    API,
    theme,
    fetchMyPortfolios,
    fetchActivities,
    fetchWorkings,
    createSection,
    updateSection,
    createBlock,
    updateBlock,
    deleteBlock,
    deleteSection,
    updatePortfolio,
    getAuthHeaders,
} from "@/services/sectionsPortfolio"
import { PortfolioSection } from "@/src/interfaces/section";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { CirclePlus, Settings,Trophy, BriefcaseBusiness,ScrollText } from "lucide-react";
import EditorSidebar from "@/src/components/editorSidebar";
import CustomSelect from "@/components/CustomSelect";
import { ColorTheme, FontTheme } from "@/src/interfaces/design";
import { getFileUrl } from "@/utils/fileUrl";
// Utility Functions
function parseBlockContent(content: any): any {
    if (!content) return null;
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to renderSectionContentparse:', e);
            return null;
        }
    }
    return content;
}

function getImageUrl(image: any): string {
    const rawUrl = image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url;
    return getFileUrl(rawUrl) || "/placeholder.jpg";
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

function formatDateThai(dateString?: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short", // ม.ค., ก.พ.
        year: "numeric", // 2569
    });
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%", // เลื่อนมาจากขวา/ซ้ายสุด
        opacity: 1, // ✅ ต้องเป็น 1 เพื่อไม่ให้รูปหายวูบ
        zIndex: 1
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    // ...
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? "100%" : "-100%", // เลื่อนออกไปจนสุด
        opacity: 1 // ✅ ต้องเป็น 1
    })
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const PortfolioItemCard = ({
    block,
    data,
    contentType,
    onEdit,
    onDelete
}: {
    block: any,
    data: any,
    contentType: 'activity' | 'working',
    onEdit: () => void,
    onDelete: () => void
}) => {
    // State สำหรับเก็บ index ของรูปภาพในการ์ดใบนี้โดยเฉพาะ
    const [[page, direction], setPage] = useState([0, 0]);
    const [isHovered, setIsHovered] = useState(false);

    const images = extractImages(data, contentType);
    const hasMultipleImages = images.length > 1;
    const imageIndex = ((page % images.length) + images.length) % images.length;

    // ตรวจสอบ index ให้ถูกต้องเสมอ (กัน Error กรณีข้อมูลเปลี่ยน)
    // const validIndex = (currentImgIdx >= 0 && currentImgIdx < images.length) ? currentImgIdx : 0;
    const coverImage = images.length > 0 ? getImageUrl(images[imageIndex]) : "";
    const title = contentType === 'activity' ? data.activity_name : data.working_name;

    // ดึงข้อมูลรายละเอียด
    let level, category, reward, date, location, description;
    if (contentType === 'activity') {
        level = data.activity_detail?.level_activity?.level_name;
        category = data.activity_detail?.type_activity?.type_name;
        reward = data.reward?.level_name;
        date = data.activity_detail?.activity_at;
        location = data.activity_detail?.institution;
        description = data.activity_detail?.description;
    } else {
        category = data.working_detail?.type_working?.type_name;
        date = data.working_detail?.working_at;
        description = data.working_detail?.description;
    }
    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };
    useEffect(() => {
        if (!hasMultipleImages || !isHovered) return; // ถ้ามีรูปเดียวไม่ต้องทำอะไร

        const interval = setInterval(() => {
            paginate(1);
        }, 5000); // เลื่อนทุกๆ 5 วินาที

        return () => clearInterval(interval); // ล้าง timer เมื่อ component ถูกทำลาย
    }, [hasMultipleImages, isHovered, page]);

    return (
        <motion.div variants={fadeInUp} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-[460px] relative group hover:shadow-md transition-shadow"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >

            {/* --- ส่วนรูปภาพ (Carousel) --- */}
            <div
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="h-64 w-full bg-gray-100 relative overflow-hidden cursor-pointer flex-shrink-0 group/image"
            >
                <AnimatePresence initial={false} custom={direction}>
                    {coverImage ? (
                        <motion.img
                            key={page}
                            src={coverImage}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover"
                            draggable="false"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <span className="text-2xl">🖼️</span>
                        </div>
                    )}
                </AnimatePresence>

                {/* ปุ่มเลื่อนรูป (แสดงเมื่อมี > 1 รูป) */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {images.map((_: any, i: number) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-white scale-125' : 'bg-white/60'}`}></div>
                            ))}
                        </div>
                    </>
                )}

                {/* Badge ประเภท */}
                <span className={`absolute top-2 right-2 text-[9px] text-white px-2 py-0.5 rounded-full font-bold uppercase shadow-sm z-10 ${contentType === 'activity' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {contentType}
                </span>

            </div>

            {/* --- ส่วนรายละเอียด --- */}
            <div className="p-3 flex-1 flex flex-col bg-white">
                <h4 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight h-10" title={title}>
                    {title}
                </h4>

                <div className="flex flex-wrap gap-1.5 mb-2">
                    {level && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">{level}</span>}
                    {category && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">{category}</span>}
                    {reward && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">🏆 {reward}</span>}
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate">{description}</span>
                    </div>
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-2">
                    {date && (
                        <div className="flex items-center gap-1.5">
                            <span>📅</span> <span>{formatDateThai(date)}</span>
                        </div>
                    )}
                    {location && (
                        <div className="flex items-center gap-1.5">
                            <span>📍</span> <span className="truncate">{location}</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded transition-colors font-medium border border-blue-200"
                    >
                        แก้ไข
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded transition-colors font-medium border border-red-200"
                    >
                        ลบ
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const EmptySlot = ({ onClick }: { onClick: () => void }) => (
    <div
        onClick={onClick}
        className="border-2 border-gray-200 rounded-lg h-[460px] overflow-hidden cursor-pointer group hover:border-blue-400 transition-colors bg-white relative"
    >
        {/* ส่วนรูปจำลอง */}
        <div className="h-64 bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <CirclePlus className="text-gray-300 group-hover:text-blue-400" size={48} />
        </div>
        {/* ส่วนข้อความจำลอง */}
        <div className="p-3 space-y-2">
            <div className="h-2 bg-gray-100 rounded w-3/4 group-hover:bg-blue-50"></div>
            <div className="h-2 bg-gray-100 rounded w-1/2 group-hover:bg-blue-50"></div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm">
                + เลือกข้อมูล
            </span>
        </div>
    </div>
);

function SectionsContent() {
    const [designConfig, setDesignConfig] = useState({
        primaryColor: theme.primary || '#ff6b35', // สีหลัก (เดิมคือสีส้ม)
        backgroundColor: '#f9fafb',               // สีพื้นหลัง Canvas
        borderRadius: 'rounded-xl',               // ความมนของขอบ
    });
    const [sections, setSections] = useState<PortfolioSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<PortfolioSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPortfolioID, setCurrentPortfolioID] = useState<number | null>(null);
    const [currentPortfolioName, setCurrentPortfolioName] = useState<string>("");

    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);

    const [isEditingItem, setIsEditingItem] = useState(false);

    const [selectedDataType, setSelectedDataType] = useState<'activity' | 'working' | 'profile' | 'text'>('activity');
    const [selectedDataId, setSelectedDataId] = useState<string>("");
    const [currentBlock, setCurrentBlock] = useState<any>(null);
    const [customText, setCustomText] = useState("");

    const [imageIndices, setImageIndices] = useState<{ [blockId: number]: number }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const portfolioIdParam = searchParams.get("portfolio_id");

    const [isModalOpen, setIsModalOpen] = useState(false); // เปิด/ปิด Modal
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list'); // สลับหน้า List/Form

    const [activeTheme, setActiveTheme] = useState<ColorTheme | null>(null);
    const [activeFont, setActiveFont] = useState<FontTheme | null>(null);
    const [initialTheme, setInitialTheme] = useState<ColorTheme | null>(null);
    const [initialFont, setInitialFont] = useState<FontTheme | null>(null);
    const [introText, setIntroText] = useState("");
    const router = useRouter();
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Modal state (for beautiful alerts)
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

    // Confirm modal state (for delete confirmations)
    const [confirmModal, setConfirmModal] = useState<{show: boolean; title: string; message: string; action: 'deleteSection' | 'deleteBlock' | null; targetId: number | null}>({ 
        show: false, 
        title: '', 
        message: '', 
        action: null,
        targetId: null
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const showDeleteConfirm = (title: string, message: string, action: 'deleteSection' | 'deleteBlock', targetId: number) => {
        setConfirmModal({ show: true, title, message, action, targetId });
    };

    const closeConfirm = () => {
        setConfirmModal({ show: false, title: '', message: '', action: null, targetId: null });
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.targetId || !confirmModal.action) return;
        
        setIsDeleting(true);
        try {
            if (confirmModal.action === 'deleteSection') {
                await deleteSection(confirmModal.targetId);
                showModal('สำเร็จ!', 'ลบ Section เรียบร้อย', 'success');
                loadAll();
            } else if (confirmModal.action === 'deleteBlock') {
                await deleteBlock(confirmModal.targetId);
                showModal('สำเร็จ!', 'ลบข้อมูลเรียบร้อย', 'success');
                await loadAll();
                await refreshSelectedSection();
            }
            closeConfirm();
        } catch (err) {
            console.error(err);
            closeConfirm();
            showModal('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้ กรุณาลองใหม่', 'error', false);
        } finally {
            setIsDeleting(false);
        }
    };


    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleSaveAndExit = async () => {
        if (!currentPortfolioID) {
            showModal("เกิดข้อผิดพลาด", "ไม่พบ Portfolio ID", "error", false);
            return;
        }

        try {
            const payload: any = {};

            // ตรวจสอบว่ามีการเปลี่ยนธีมสีหรือไม่
            if (activeTheme?.ID !== initialTheme?.ID) {
                payload.colors_id = activeTheme?.ID;
            }

            // ตรวจสอบว่ามีการเปลี่ยนฟอนต์หรือไม่
            if (activeFont?.ID !== initialFont?.ID) {
                payload.font_id = activeFont?.ID;
            }

            payload.content_description = introText;

            if (Object.keys(payload).length > 0) {
                await updatePortfolio(currentPortfolioID, payload);
            }

            showModal("สำเร็จ!", "บันทึกการแก้ไขเรียบร้อย", "success");
            setTimeout(() => router.push("/student/portfolio"), 2000);
        } catch (error) {
            console.error("Save error:", error);
            showModal("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง", "error", false);
        }
    };

    const handleThemeChange = (newTheme: ColorTheme) => {
        setActiveTheme(newTheme);
    };

    const handleFontChange = (newFont: FontTheme) => {
        setActiveFont(newFont);
    };

    const setBlockImageIndex = (blockId: number, index: number) => {
        setImageIndices(prev => ({ ...prev, [blockId]: index }));
    };

    useEffect(() => {
        if (activeFont?.font_url) {
            const link = document.createElement('link');
            link.href = activeFont.font_url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => { document.head.removeChild(link); };
        }
    }, [activeFont]);
    const 
    currentPrimaryColor = activeTheme?.primary_color || theme.primary || '#ff6b35';

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${API}/users/me/profile`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                // The endpoint returns { user: {...}, education: {...}, ... }
                const userObj = json.user || {};
                const eduObj = json.education || {};

                setCurrentUser({
                    firstname: userObj.first_name_th || userObj.first_name_en || "-",
                    lastname: userObj.last_name_th || userObj.last_name_en || "-",
                    major: eduObj.curriculum_type?.name || "-",
                    school: eduObj.school_name || eduObj.school?.name || "Suranaree University of Technology",
                    profile_image: userObj.profile_image_url || "",
                    // Add other fields if needed for profile section
                    bio: "นักศึกษาชั้นปีที่ ...", // Placeholder or from DB if available
                    gpa: json.academic_score?.gpax || "-"
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Auto-play timer อาจจะลบ
    useEffect(() => {
        const interval = setInterval(() => {
            setImageIndices(prev => {
                const newIndices = { ...prev };
                sections.forEach(section => {
                    const blocks = section.section_blocks || [];
                    if (blocks.length === 0) return;

                    const content = parseBlockContent(blocks[0].content);
                    const images = extractImages(content?.data, content?.type);

                    if (images.length > 1) {
                        const currentIndex = prev[section.ID] || 0;
                        newIndices[section.ID] = (currentIndex + 1) % images.length;
                    }
                });
                return newIndices;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [sections]);



    const loadAll = async () => {
        try {
            const [portfoliosComp, activitiesComp, workingsComp] = await Promise.all([
                fetchMyPortfolios(),
                fetchActivities(),
                fetchWorkings()
            ]);

            setActivities(activitiesComp.data || []);
            setWorkings(workingsComp.data || []);

            const portfolios = portfoliosComp.data || [];
            let targetPortfolioID: number | null = null;
            if (portfolioIdParam && !isNaN(Number(portfolioIdParam))) {
                targetPortfolioID = Number(portfolioIdParam);
            } else if (portfolios.length > 0) {
                targetPortfolioID = portfolios[0].ID;
            }

            setCurrentPortfolioID(targetPortfolioID);
            const targetPortfolio = portfolios.find((p: any) => p.ID === targetPortfolioID);

            if (targetPortfolio) {
                setCurrentPortfolioName(targetPortfolio.portfolio_name || targetPortfolio.PortfolioName || "");

                const savedTheme = targetPortfolio.colors || targetPortfolio.Color;
                const savedFont = targetPortfolio.font || targetPortfolio.Font;

                if (savedTheme) {
                    setActiveTheme(savedTheme);
                    setInitialTheme(savedTheme);
                }
                if (savedFont) {
                    setActiveFont(savedFont);
                    setInitialFont(savedFont);

                }
                setIntroText(targetPortfolio.content_description || targetPortfolio.ContentDescription || "");
             
                const allSections: PortfolioSection[] = [];
                if (targetPortfolio.portfolio_sections) {
                    targetPortfolio.portfolio_sections.forEach((s: any) => {
                        allSections.push({
                            ID: s.ID,
                            section_title: s.section_title || "Untitled Section",
                            section_port_key: s.section_port_key,
                            section_blocks: s.portfolio_blocks || [],
                            portfolio_id: targetPortfolio.ID,
                            order_index: s.section_order,
                            is_enabled: s.is_enabled !== undefined ? s.is_enabled : true,
                        });
                    });
                }
                allSections.sort((a, b) => a.order_index - b.order_index);
                setSections(allSections);

                if (selectedSection) {
                    const updated = allSections.find(s => s.ID === selectedSection.ID);
                    if (updated) setSelectedSection(updated);
                }
            } else {
                console.warn("⚠️ Portfolio not found:", targetPortfolioID);
                setSections([]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error:", err);
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        if (!currentPortfolioID) {
            showModal("เกิดข้อผิดพลาด", "ไม่พบ Portfolio กรุณาสร้าง Portfolio ก่อน", "error", false);
            return;
        }
        const name = prompt("ชื่อ Section ใหม่:");
        if (!name) return;

        try {
            await createSection({
                section_title: name,
                section_port_key: name,
                portfolio_id: currentPortfolioID,
                section_order: sections.length + 1,
                is_enabled: true
            });
            showModal("สำเร็จ!", "สร้าง Section เรียบร้อย", "success");
            loadAll();
        } catch (e) {
            console.error(e);
            showModal("เกิดข้อผิดพลาด", "ไม่สามารถสร้าง Section ได้", "error", false);
        }
    };

    const handleToggleSection = async (id: number, currentStatus: boolean) => {
        try {
            // ส่งไปยัง Backend
            await updateSection(id, { is_enabled: !currentStatus });

            // รอให้ DB อัปเดต
            await new Promise(resolve => setTimeout(resolve, 200));

            // โหลดข้อมูลใหม่
            await loadAll();

            showModal("สำเร็จ!", !currentStatus ? "เปิดใช้งาน Section แล้ว" : "ปิดการใช้งาน Section", "success");
        } catch (err) {
            console.error(err);
            showModal("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตสถานะได้", "error", false);
        }
    };

    const handleDeleteSection = async (id: number) => {
        showDeleteConfirm("ยืนยันการลบ", "คุณแน่ใจหรือไม่ที่จะลบ Section นี้? ข้อมูลทั้งหมดใน Section นี้จะหายไป", 'deleteSection', id);
    };

    // ฟังก์ชันสำหรับเปิด Modal และตั้งค่าเริ่มต้น
    const openModal = (section: PortfolioSection) => {
        setSelectedSection(section);
        setViewMode('list');
        setIsModalOpen(true);
        setIsEditingItem(false);
    };

    const openForm = (block: any | null) => {
        setCurrentBlock(block);
        setCustomText(block?.custom_text || "");
        if (block) {
            const c = parseBlockContent(block.content);
            setSelectedDataType(c?.type || 'activity');
            if (c?.type === 'text') {
                setCustomText(c.detail || "");
                setSelectedDataId("");
            } else {
                setSelectedDataId(c?.data_id?.toString() || "");
            }
        } else {
            // ตั้ง selectedDataType ตามชื่อ section อัตโนมัติ
            const sectionTitle = selectedSection?.section_title?.toLowerCase() || '';
            const sectionKey = selectedSection?.section_port_key?.toLowerCase() || '';
            
            const isActivitySection = sectionTitle.includes('กิจกรรม') || sectionTitle.includes('activity') || sectionKey.includes('กิจกรรม') || sectionKey.includes('activity');
            const isWorkingSection = sectionTitle.includes('ผลงาน') || sectionTitle.includes('working') || sectionKey.includes('ผลงาน') || sectionKey.includes('working');
            const isTextSection = sectionTitle.includes('ข้อความ') || sectionTitle.includes('text') || sectionTitle.includes('แนะนำตัว') || sectionKey.includes('ข้อความ') || sectionKey.includes('text') || sectionKey.includes('แนะนำตัว');
            
            if (isActivitySection && !isWorkingSection && !isTextSection) {
                setSelectedDataType('activity');
            } else if (isWorkingSection && !isActivitySection && !isTextSection) {
                setSelectedDataType('working');
            } else if (isTextSection && !isActivitySection && !isWorkingSection) {
                setSelectedDataType('text');
            } else {
                setSelectedDataType('activity');
            }
            setSelectedDataId("");
        }
        setIsEditingItem(true);
        setViewMode('form');
    };

    const handleDirectEdit = (section: PortfolioSection, block: any) => {
        setSelectedSection(section);
        openForm(block);
    };

    const handleDirectAdd = (section: PortfolioSection) => {
        setSelectedSection(section);
        openForm(null);
    };

    const handleSaveItem = async () => {
        // ตรวจสอบประเภท section เพื่อกำหนด dataType ที่ถูกต้อง
        const sectionTitle = selectedSection?.section_title?.toLowerCase() || '';
        const sectionKey = selectedSection?.section_port_key?.toLowerCase() || '';
        
        const isActivitySection = sectionTitle.includes('กิจกรรม') || sectionTitle.includes('activity') || sectionKey.includes('กิจกรรม') || sectionKey.includes('activity');
        const isWorkingSection = sectionTitle.includes('ผลงาน') || sectionTitle.includes('working') || sectionKey.includes('ผลงาน') || sectionKey.includes('working');
        const isTextSection = sectionTitle.includes('ข้อความ') || sectionTitle.includes('text') || sectionTitle.includes('แนะนำตัว') || sectionKey.includes('ข้อความ') || sectionKey.includes('text') || sectionKey.includes('แนะนำตัว');
        
        // กำหนด dataType ตาม section (ถ้า section กำหนดชัดเจน)
        let actualDataType = selectedDataType;
        if (isActivitySection && !isWorkingSection && !isTextSection) {
            actualDataType = 'activity';
        } else if (isWorkingSection && !isActivitySection && !isTextSection) {
            actualDataType = 'working';
        } else if (isTextSection && !isActivitySection && !isWorkingSection) {
            actualDataType = 'text';
        }
        
        if (!selectedSection || (actualDataType !== 'profile' && actualDataType !== 'text' && !selectedDataId)) {
            showModal("คำเตือน", "กรุณาเลือกข้อมูลก่อน", "warning", false);
            return;
        }

        try {
            let contentData = {};
            if (actualDataType === 'profile') {
                contentData = {
                    type: 'profile',
                    title: 'My Profile'
                };
            } else if (actualDataType === 'text') {
                if (!customText.trim()) {
                    showModal("คำเตือน", "กรุณากรอกข้อความ", "warning", false);
                    return;
                }
                contentData = {
                    type: 'text',
                    title: 'ข้อความ',
                    detail: customText
                };
            } else {
                let dataItem: any = null;
                let dataName = "";

                if (actualDataType === 'activity') {
                    dataItem = activities.find(a => a.ID.toString() === selectedDataId);
                    dataName = dataItem?.activity_name || "";
                } else {
                    dataItem = workings.find(w => w.ID.toString() === selectedDataId);
                    dataName = dataItem?.working_name || "";
                }

                if (!dataItem) {
                    showModal("เกิดข้อผิดพลาด", "ไม่พบข้อมูลที่เลือก", "error", false);
                    return;
                }

                contentData = {
                    title: actualDataType === 'activity' ? dataItem.activity_name : dataItem.working_name,
                    type: actualDataType,
                    data_id: parseInt(selectedDataId),
                    data: dataItem
                };
            }

            if (currentBlock) {
                await updateBlock(currentBlock.ID, { content: contentData });
                showModal("สำเร็จ!", "แก้ไขข้อมูลเรียบร้อย", "success");
            } else {
                // สร้าง block ใหม่โดยคำนวณ order
                const maxOrder = Math.max(0, ...selectedSection.section_blocks.map((b: any) => b.block_order || 0));
                await createBlock({
                    portfolio_section_id: selectedSection.ID,
                    block_order: maxOrder + 1,
                    content: contentData
                });
                showModal("สำเร็จ!", "เพิ่มข้อมูลเรียบร้อย", "success");
            }

            await loadAll();
            
            // รอให้ React render รอบใหม่เสร็จก่อน
            await new Promise(resolve => setTimeout(resolve, 100));
            
            setIsEditingItem(false);
            setCurrentBlock(null);
            setViewMode('list');
        } catch (err) {
            console.error(err);
            showModal("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error", false);
        }
    };

    const handleDeleteBlock = async (blockId: number) => {
        showDeleteConfirm("ยืนยันการลบ", "คุณต้องการลบข้อมูลนี้ใช่หรือไม่?", 'deleteBlock', blockId);
    };

    const handleEditBlock = (block: any) => {
        const content = parseBlockContent(block.content);
        setCurrentBlock(block);
        setSelectedDataType(content?.type || 'activity');
        setSelectedDataId(content?.data_id?.toString() || "");
        setIsEditingItem(true);
    };

    const refreshSelectedSection = async () => {
        if (!selectedSection || !currentPortfolioID) return;
        const updated = await fetchMyPortfolios();
        const portfolio = updated.data.find((p: any) => p.ID === currentPortfolioID);
        const updatedSection = portfolio?.portfolio_sections?.find((s: any) => s.ID === selectedSection.ID);
        if (updatedSection) {
            setSelectedSection({
                ID: updatedSection.ID,
                section_title: updatedSection.section_title,
                section_port_key: updatedSection.section_port_key,
                section_blocks: updatedSection.portfolio_blocks || [],
                portfolio_id: portfolio.ID,
                order_index: updatedSection.section_order,
                is_enabled: updatedSection.is_enabled,
            });
        }
    };

    const renderSectionContent = (section: PortfolioSection) => {
        const blocks = section.section_blocks || [];

        const isIntroSection = section.section_title?.includes("แนะนำตัว") ||
            section.section_title?.toLowerCase().includes("profile") ||
            (section as any).layout_type?.includes('profile');

        if (isIntroSection) {
            const isAdditionalIntro = section.section_title?.includes("แนะนำตัว เพิ่มเติม");

            // กรองเอาเฉพาะ Text Blocks ที่กดเพิ่มเข้ามา
            const textBlocks = blocks.filter((block: any) => {
                const c = parseBlockContent(block.content);
                return c?.type === 'text';
            });
            const sectionBgColor = activeTheme?.background_color || theme.primary;

            if (isAdditionalIntro) {
                return (
                    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto"
                        style={{
                            backgroundColor: sectionBgColor,
                            color: activeTheme?.primary_color || 'black',
                            fontFamily: activeFont?.font_family || 'inherit',
                        }}
                    >
        
                        {/* แสดงรายการกล่องข้อความ */}
                        {textBlocks.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {textBlocks.map((block: any, idx: number) => {
                                    const c = parseBlockContent(block.content);
                                    return (
                                        <div key={block.ID || idx} className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition relative group">
                                            <div className="flex items-start gap-4">
                                                
                                                <div className="flex-1 pr-24 ">
                                            
                                                    <div className="text-gray-600 whitespace-pre-wrap leading-relaxed break-words">{c.detail}</div>
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleDirectEdit(section, block); }} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition">แก้ไข</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.ID); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">ลบ</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}

                        {/* ปุ่มเพิ่มข้อมูล */}
                        <button 
                            onClick={() => handleDirectAdd(section)} 
                            className="w-full py-3 border-2 border-dashed rounded-xl transition flex items-center justify-center gap-2 font-medium"
                            style={{ 
                                borderColor: currentPrimaryColor, 
                                color: currentPrimaryColor, 
                                backgroundColor: isHovered ? `${currentPrimaryColor}60` : `${currentPrimaryColor}30`  // Apply hover color here
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <CirclePlus size={20} /> เพิ่มข้อความใหม่
                        </button>
                    </div>
                );
            }
        }


        const isProfile = section.section_title?.toLowerCase().includes('profile') ||
            section.section_title?.includes('ประวัติ') ||
            section.section_title?.includes('แนะนำตัว');

        if (isProfile) {
            const user = currentUser || {};
            const academic = user.academic_score || {};
            const languageScores = user.language_scores || [];
            const ged = user.ged_score || {};
            return (
                <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto"
                    style={{
                        backgroundColor: activeTheme?.background_color || 'white',
                        color: activeTheme?.primary_color || 'black',
                        fontFamily: activeFont?.font_family || 'inherit',
                    }}
                >
                    <h3 className="text-2xl font-bold border-b pb-2" style={{ borderColor: activeTheme?.primary_color || theme.primary }}>
                        แนะนำตัว เพิ่มเติม
                    </h3>

                    <div className="mt-1 space-y-4">
                        {/* <h4 className="font-bold text-gray-400 text-sm">ข้อมูลอื่นๆ ที่เพิ่มเข้ามา</h4> */}

                        {blocks.map((block: any, idx: number) => {
                            const c = parseBlockContent(block.content);
                            if (!c) return null;

                            // แสดงผลถ้าเป็น Text
                            if (c.type === 'text') {
                                return (
                                    <div key={block.ID || idx} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition relative group">
                                        <div className="flex items-start gap-4">
                                            {/* ไอคอน */}
                                           

                                            {/* เนื้อหา (เว้นที่ขวาไว้ 100px กันชนปุ่ม) */}
                                            <div className="flex-1 pr-24">
                                                {c.title && <h4 className="font-bold text-gray-800 mb-2 text-lg">{c.title}</h4>}
                                                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
                                                    {c.detail}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDirectEdit(section, block);
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1"
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBlock(block.ID);
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition flex items-center gap-1"
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            // ถ้าอยากให้แสดง Activity/Working ในหน้านี้ด้วย ก็เพิ่ม case ตรงนี้ได้
                            return null;
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full bg-white p-4 overflow-y-auto w-full no-arrow"
                style={{
                    backgroundColor: activeTheme?.background_color || 'white',
                    color: activeTheme?.primary_color || 'black',
                    fontFamily: activeFont?.font_family || 'inherfirstnameit',
                }}
            >
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-4 p-4"
                >

                    {/* Loop แสดงรายการที่มีอยู่จริง */}
                    {blocks.map((block: any, idx: number) => {
                        const c = parseBlockContent(block.content);
                        if (c?.type === 'profile') return null;

                        if (c?.type === 'text') {
                            return (
                                <div className="flex items-start gap-4 w-full">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">
                                        📝
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 text-lg mb-2">
                                            {c.title || "ข้อความ"}
                                        </h4>
                                        <div className="text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
                                            {c.detail || c.content}
                                        </div>
                                    </div>

                                </div>
                            );
                        }

                        let itemData = null;
                        if (c?.type === 'activity') itemData = activities.find(a => a.ID == c.data_id);
                        else if (c?.type === 'working') itemData = workings.find(w => w.ID == c.data_id);

                        const finalData = itemData || c?.data;
                        if (!finalData) return null;
                        return (
                            <PortfolioItemCard
                                key={block.ID || idx}
                                block={block}
                                data={finalData}
                                contentType={c.type}
                                onEdit={() => handleDirectEdit(section, block)}
                                onDelete={() => handleDeleteBlock(block.ID)}
                            />
                        );
                    })}

                    <EmptySlot onClick={() => handleDirectAdd(section)} />

                </motion.div>
            </div>
        );
    };


    useEffect(() => {
        loadAll();
        fetchUserData();
    }, [portfolioIdParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col overflow-hidden font-sans text-slate-800">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-0 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Beautiful Modal Popup */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
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

            {/* Delete Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !isDeleting && closeConfirm()}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-up">
                        <button
                            onClick={() => !isDeleting && closeConfirm()}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                            disabled={isDeleting}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-2 text-red-700">
                            {confirmModal.title}
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            {confirmModal.message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        กำลังลบ...
                                    </>
                                ) : (
                                    'ลบ'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-lg font-bold text-gray-800">{currentPortfolioName || "แก้ไข Portfolio"}</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-600 "
                    >
                        ย้อนกลับ
                    </button>
                    <button
                        onClick={handleSaveAndExit}
                        className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition shadow-sm">
                        บันทึกการแก้ไข
                    </button>
                </div>
            </header>

            {/* 2. Main Workspace Container */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="max-w-[1800px] mx-auto h-full grid grid-cols-12 gap-6">

                    <main className="col-span-12 lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">

                        {/* Header ของกล่องเนื้อหา */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500">
                                    พื้นที่จัดวางเนื้อหา
                                </h2>
                                <p className="text-gray-400">Section ที่คุณสร้างจะแสดงผลตามสีและฟอนต์ที่เลือก</p>
                            </div>
                        </div>

                        {/* พื้นที่แสดง Section (Scroll ได้) */}
                        <div
                            className="flex-1 overflow-y-auto p-6 transition-colors duration-500"
                            style={{
                                fontFamily: activeFont?.font_family
                            }}
                        >
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 gap-6"
                            >
                                {sections.map((section) => {
                                    const isProfile = section.section_title?.toLowerCase().includes('profile') ||
                                        (section as any).layout_type === 'profile_header_left';
                                    if (isProfile) return null;

                                    return (
                                        <div key={`${section.ID}-${section.section_blocks?.length || 0}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                                            {/* Section Header */}
                                            <div className="flex-1 bg-gray-50 overflow-hidden relative border-b border-gray-200 inner-shadow">
                                                {renderSectionContent(section)}
                                            </div>
                                            {/* Section Footer */}
                                            <div className="p-4 bg-white flex flex-col gap-3 z-10">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleToggleSection(section.ID, section.is_enabled); }} className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${section.is_enabled ? 'bg-green-100 border-green-300 text-green-600' : 'bg-gray-100 border-gray-300 text-gray-300'}`}>✓</button>
                                                        <h3 className="font-bold text-gray-800 truncate text-lg">{section.section_title}</h3>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.ID) }} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </div>
                                                <button onClick={() => openModal(section)} className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-lg font-medium shadow-sm hover:opacity-90 transition" style={{ backgroundColor: currentPrimaryColor }}>
                                                    <Settings size={18} /> จัดการข้อมูล
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>

                            {/* Empty State */}
                            {sections.filter(s => !s.section_title?.toLowerCase().includes('profile')).length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="text-6xl mb-4 opacity-20">📄</div>
                                    <p>ยังไม่มี Section ให้แสดงผล</p>
                                    <button onClick={handleCreateSection} className="mt-4 text-blue-500 underline">คลิกเพื่อสร้าง Section แรก</button>
                                </div>
                            )}
                        </div>
                    </main>
                    <aside className="col-span-12 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                        {/* ใส่ Component Sidebar ลงในนี้ */}
                        <div className="h-full overflow-hidden">
                            <EditorSidebar
                                onThemeSelect={handleThemeChange}
                                onFontSelect={handleFontChange}
                                currentFont={activeFont}
                                currentTheme={activeTheme}
                            />
                        </div>
                    </aside>

                </div>
            </div>

            {/* --- Modals (ยังคงอยู่เหมือนเดิม) --- */}
            <AnimatePresence>
                {selectedSection && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSection(null)}>
                        {/* ... (Code Modal เดิม ใส่ตรงนี้) ... */}
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedSection.section_title}</h3>
                                </div>
                                <button onClick={() => setSelectedSection(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 text-xl">×</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                {isEditingItem ? (
                                    /* Form View */
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                                            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                {currentBlock ? ' แก้ไขข้อมูล' : ' เพิ่มข้อมูลใหม่'}
                                            </h4>
                                        </div>
                                        
                                        {/* ตรวจสอบประเภท section และแสดง UI ตามประเภท */}
                                        {(() => {
                                            const sectionTitle = selectedSection?.section_title?.toLowerCase() || '';
                                            const sectionKey = selectedSection?.section_port_key?.toLowerCase() || '';
                                            
                                            const isActivitySection = sectionTitle.includes('กิจกรรม') || sectionTitle.includes('activity') || sectionKey.includes('กิจกรรม') || sectionKey.includes('activity');
                                            const isWorkingSection = sectionTitle.includes('ผลงาน') || sectionTitle.includes('working') || sectionKey.includes('ผลงาน') || sectionKey.includes('working');
                                            const isTextSection = sectionTitle.includes('ข้อความ') || sectionTitle.includes('text') || sectionTitle.includes('แนะนำตัว') || sectionKey.includes('ข้อความ') || sectionKey.includes('text') || sectionKey.includes('แนะนำตัว');
                                            
                                            // Section กิจกรรม - แสดงเฉพาะกิจกรรมให้เลือก
                                            if (isActivitySection && !isWorkingSection && !isTextSection) {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">ประเภท:</span>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-medium text-sm">
                                                                <Trophy className="w-4 h-4" /> กิจกรรม
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกกิจกรรม</label>
                                                            <CustomSelect
                                                                placeholder="-- กรุณาเลือกกิจกรรม --"
                                                                options={
                                                                    activities.map(item => ({
                                                                        value: item.ID.toString(),
                                                                        label: item.activity_name,
                                                                        icon: <Trophy className="w-5 h-5 text-orange-500 flex-shrink-0" />,
                                                                        searchable_fields: [
                                                                            item.reward?.level_name,
                                                                            item.activity_detail?.type_activity?.type_name,
                                                                            item.activity_detail?.level_activity?.level_name,
                                                                        ].filter(Boolean) as string[]
                                                                    }))
                                                                }
                                                                value={selectedDataId}
                                                                onChange={(value) => setSelectedDataId(value)}
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            }
                                            
                                            // Section ผลงาน - แสดงเฉพาะผลงานให้เลือก
                                            if (isWorkingSection && !isActivitySection && !isTextSection) {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">ประเภท:</span>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium text-sm">
                                                                <BriefcaseBusiness className="w-4 h-4" /> ผลงาน
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกผลงาน</label>
                                                            <CustomSelect
                                                                placeholder="-- กรุณาเลือกผลงาน --"
                                                                options={
                                                                    workings.map(item => ({
                                                                        value: item.ID.toString(),
                                                                        label: item.working_name,
                                                                        icon: <BriefcaseBusiness className="w-5 h-5 text-blue-500 flex-shrink-0" />,
                                                                        searchable_fields: [
                                                                            item.working_detail?.type_working?.type_name,
                                                                        ].filter(Boolean) as string[]
                                                                    }))
                                                                }
                                                                value={selectedDataId}
                                                                onChange={(value) => setSelectedDataId(value)}
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            }
                                            
                                            // Section ข้อความ - แสดงช่องกรอกข้อความ
                                            if (isTextSection && !isActivitySection && !isWorkingSection) {
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">ประเภท:</span>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                                                                <ScrollText className="w-4 h-4" /> ข้อความ
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดข้อความ</label>
                                                            <textarea
                                                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none min-h-[150px]"
                                                                placeholder="พิมพ์ข้อความแนะนำตัว หรือรายละเอียดที่ต้องการแสดง..."
                                                                value={customText}
                                                                onChange={(e) => setCustomText(e.target.value)}
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            }
                                            
                                            // Section ทั่วไป - แสดง dropdown เลือกประเภทก่อน
                                            const options = [
                                                { value: 'activity', label: 'กิจกรรม (Activity)', icon: <Trophy className="w-5 h-5 text-orange-500" /> },
                                                { value: 'working', label: 'ผลงาน (Working)', icon: <BriefcaseBusiness className="w-5 h-5 text-blue-500" /> },
                                                { value: 'text', label: 'ข้อความ / แนะนำตัว (Text)', icon: <ScrollText className="w-5 h-5 text-green-500" /> }
                                            ];
                                            return (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทข้อมูล</label>
                                                        <CustomSelect
                                                            isSearchable={false}
                                                            options={options}
                                                            value={selectedDataType}
                                                            onChange={(value) => {
                                                                setSelectedDataType(value as any);
                                                                setSelectedDataId("");
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    {selectedDataType === 'text' ? (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดข้อความ</label>
                                                            <textarea
                                                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none min-h-[150px]"
                                                                placeholder="พิมพ์ข้อความแนะนำตัว หรือรายละเอียดที่ต้องการแสดง..."
                                                                value={customText}
                                                                onChange={(e) => setCustomText(e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกรายการ</label>
                                                            <CustomSelect
                                                                placeholder={`-- กรุณาเลือก${selectedDataType === 'activity' ? 'กิจกรรม' : 'ผลงาน'} --`}
                                                                options={
                                                                    (selectedDataType === 'activity' ? activities : workings).map(item => {
                                                                        const isActivity = selectedDataType === 'activity';
                                                                        return {
                                                                            value: item.ID.toString(),
                                                                            label: isActivity ? item.activity_name : item.working_name,
                                                                            icon: isActivity
                                                                                ? <Trophy className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                                                                : <BriefcaseBusiness className="w-5 h-5 text-blue-500 flex-shrink-0" />,
                                                                            searchable_fields: [
                                                                                isActivity ? item.reward?.level_name : null,
                                                                                isActivity ? item.activity_detail?.type_activity?.type_name : item.working_detail?.type_working?.type_name,
                                                                                isActivity ? item.activity_detail?.level_activity?.level_name : null,
                                                                            ].filter(Boolean) as string[]
                                                                        };
                                                                    })
                                                                }
                                                                value={selectedDataId}
                                                                onChange={(value) => setSelectedDataId(value)}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {/* ปุ่มบันทึก/ยกเลิก */}
                                        <div className="flex gap-3 pt-4">
                                            <button onClick={() => { setIsEditingItem(false); setViewMode('list'); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition">
                                                ยกเลิก
                                            </button>
                                            <button onClick={handleSaveItem} className="flex-1 text-white py-2.5 rounded-lg font-medium transition shadow-sm hover:opacity-90" style={{ backgroundColor: currentPrimaryColor }}>
                                                บันทึก
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* List View */
                                    <div className="space-y-4">
                                        <button onClick={() => openForm(null)} className="w-full border-2 border-dashed border-orange-300 bg-orange-50 text-orange-600 py-4 rounded-xl font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"><span className="text-xl">+</span> เพิ่มข้อมูลลงใน Section นี้</button>
                                        <div className="grid grid-cols-1 gap-3">
                                            {(selectedSection.section_blocks || []).length === 0 ? (
                                                <div className="text-center py-10 text-gray-400">ยังไม่มีข้อมูล</div>) :
                                                ((selectedSection.section_blocks || []).map((block: any) => {
                                                    const c = parseBlockContent(block.content);
                                                    if (c?.type === 'profile') return null;
                                                    if (c?.type === 'text') {
                                                        return (
                                                            <div key={block.ID} className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                                                                <div className="flex items-start gap-4 w-full">
                                                                    {/* ไอคอนสำหรับ Text */}

                                                                    <div className="flex-1 min-w-0"> {/* min-w-0 ช่วยเรื่อง truncate */}
                                                                        <h4 className="font-bold text-gray-800">
                                                                            {c.title || 'ข้อความ'}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-500 uppercase font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1 mb-2">
                                                                            Text / Description
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 whitespace-pre-wrap break-words line-clamp-3">
                                                                            {c.detail || c.content || "- ไม่มีข้อความ -"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* ปุ่มจัดการ */}
                                                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => { openForm(block); }}
                                                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                                                                    >
                                                                        แก้ไข
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBlock(block.ID)}
                                                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                                                                    >
                                                                        ลบ
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    let itemData = null;
                                                    if (c?.type === 'activity') itemData = activities.find(a => a.ID == c.data_id);
                                                    else if (c?.type === 'working') itemData = workings.find(w => w.ID == c.data_id);

                                                    const finalData = itemData || c?.data;
                                                    if (!finalData) return null; // ถ้าหาข้อมูลไม่เจอ ไม่ต้องแสดง
                                                    return (
                                                        <div key={block.ID} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <h4 className="font-bold text-gray-800">{c.title || 'Untitled'}</h4>
                                                                    <p className="text-xs text-gray-500 uppercase font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{c.type}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openForm(block)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition">แก้ไข</button>
                                                                <button onClick={() => handleDeleteBlock(block.ID)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition">ลบ</button>
                                                            </div>
                                                        </div>);
                                                }))}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
export default function SectionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
            <SectionsContent />
        </Suspense>
    );
}
