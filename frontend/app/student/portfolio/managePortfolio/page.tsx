"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import SubmissionService from '@/services/submission';
import { fetchTemplates, fetchTemplateById } from '@/services/templates';
import { API,
        fetchMyPortfolios,
        createPortfolio,
        uploadImage,
        updatePortfolio,
        deletePortfolio,
        createPortfolioFromTemplate,
        fetchActivities,
        fetchWorkings,
 } from "@/services/portfolio";
import { pre } from "framer-motion/client";

// Helper functions for color manipulation
function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Default Color Theme (fallback)
const defaultTheme = {
    primary: '#FF6B35',
    primaryLight: '#FFE5DC',
    primaryDark: '#E85A2A',
    secondary: '#FFA500',
    accent: '#FF8C5A',
};


export default function MyPortfoliosPage() {
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState<'template'|'name'>('template');
    const [newPortfolioName, setNewPortfolioName] = useState("");
    const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
    const [itemImageIndices, setItemImageIndices] = useState<{ [key: number]: number }>({});
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; images: any[]; photoIndex: number }>({ isOpen: false, images: [], photoIndex: 0 });
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [availableColors, setAvailableColors] = useState<any[]>([]);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [portfolioToChangeColor, setPortfolioToChangeColor] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<any | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);
    const router = useRouter();

    // Get theme for a specific portfolio or use default
    const getPortfolioTheme = (portfolio: any) => {
        if (portfolio?.colors) {
            const colors = portfolio.colors;
            return {
                primary: colors.primary_color || defaultTheme.primary,
                primaryLight: lightenColor(colors.primary_color || defaultTheme.primary, 40),
                primaryDark: darkenColor(colors.primary_color || defaultTheme.primary, 10),
                secondary: colors.secondary_color || defaultTheme.secondary,
                accent: colors.primary_color || defaultTheme.accent,
            };
        }
        return defaultTheme;
    };

    // Default theme for header (use first portfolio's color or default)
    const theme = useMemo(() => {
        if (portfolios.length > 0) {
            return getPortfolioTheme(portfolios[0]);
        }
        return defaultTheme;
    }, [portfolios]);

    // Theme for the currently selected portfolio in the detail modal
    const selectedTheme = useMemo(() => {
        return selectedPortfolio ? getPortfolioTheme(selectedPortfolio) : defaultTheme;
    }, [selectedPortfolio]);

    // Compute badge styles for statuses so they follow the current portfolio theme
    const getStatusBadgeStyle = (status: string | undefined, themeObj: any) => {
        const s = (status || '').toString().toUpperCase();
        if (s === 'COMPLETED' || s === 'DONE' || s === 'FINISHED') {
            return {
                backgroundColor: lightenColor(themeObj.primary || defaultTheme.primary, 60),
                color: darkenColor(themeObj.primary || defaultTheme.primary, 30),
                borderColor: lightenColor(themeObj.primary || defaultTheme.primary, 40),
            };
        }
        if (s === 'INPROGRESS' || s === 'WORKING' || s === 'PENDING') {
            const base = themeObj.accent || themeObj.primary || defaultTheme.primary;
            return {
                backgroundColor: lightenColor(base, 55),
                color: darkenColor(base, 30),
                borderColor: lightenColor(base, 40),
            };
        }
        // default neutral
        return {
            backgroundColor: '#f8fafc',
            color: '#374151',
            borderColor: '#e5e7eb',
        };
    };
//ข้อมูลPortfolio
    const loadPortfolios = async () => {
        try {
            setLoading(true);
            const data = await fetchMyPortfolios();

            // Show all portfolios (including those created from templates)
            const allPortfolios = data.data || [];
            allPortfolios.forEach((portfolio: any) => {
                if (portfolio.portfolio_sections) {
                    // เรียงตาม section_order (น้อยไปมาก)
                    portfolio.portfolio_sections.sort((a: any, b: any) => 
                        (a.section_order || 0) - (b.section_order || 0)
                    );
                }
            });

            console.log("Portfolios loaded:", allPortfolios.length);
            setPortfolios(allPortfolios);
            setLoading(false);
        } catch (err) {
            console.error("Error loading portfolios:", err);
            setLoading(false);
        }
    };

    const renderSectionContent = (section: any) => {
        const blocks = section.portfolio_blocks || []; // เช็คชื่อ field ให้ตรงกับ backend
        
        // 1. เช็คว่าเป็น Section Profile หรือไม่ (จากชื่อ หรือ layout_type)
        const isProfileLayout = section.section_title?.toLowerCase().includes('profile') || 
                                (section as any).layout_type === 'profile_header_left';

        // ---------------------------------------------------------
        // CASE A: PROFILE LAYOUT (โชว์รูปวงกลม + ข้อมูล User)
        // ---------------------------------------------------------
        if (isProfileLayout) {
             // ใช้ข้อมูลจาก currentUser (ถ้ายังไม่มี ให้ใช้ Placeholder)
             const user = currentUser || { 
                 firstname: "Loading...", lastname: "", 
                 major: "-", gpa: "-", bio: "...", profile_image: null 
             };

             return (
                 <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white border border-gray-100 rounded-xl shadow-sm h-full w-full">
                     {/* รูปวงกลม */}
                     <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                         <img 
                            src={user.profile_image || "/placeholder.jpg"} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'}
                         />
                     </div>
                     
                     {/* ข้อมูล User */}
                     <div className="flex-1 text-left w-full space-y-3">
                         <div className="border-b pb-2 border-gray-100">
                             <h3 className="text-2xl font-bold text-gray-800">
                                 {user.firstname} {user.lastname}
                             </h3>
                             <p className="text-blue-500 font-medium">
                                 {user.school || "Suranaree University of Technology"}
                             </p>
                         </div>
                         <div className="space-y-1 text-sm text-gray-600">
                             <p><span className="font-bold text-gray-800">Major:</span> {user.major}</p>
                             <p><span className="font-bold text-gray-800">GPAX:</span> <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{user.gpa}</span></p>
                         </div>
                     </div>
                 </div>
             );
        }

        // ---------------------------------------------------------
        // CASE B: ACTIVITY / WORK GRID (โชว์รูปกิจกรรม)
        // ---------------------------------------------------------
        if (blocks.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 py-10">
                    <div className="text-4xl mb-2">📭</div>
                    <div className="text-sm">ยังไม่มีเนื้อหาในส่วนนี้</div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block: any, idx: number) => {
                    const c = parseBlockContent(block.content);
                    if(c?.type === 'profile') return null; // Profile เราจัดการไปแล้วข้างบน

                    // Lookup Data (ดึงข้อมูลจริงจาก ID)
                    let itemData = null;
                    if(c?.type === 'activity') itemData = activities.find(a => a.ID == c.data_id);
                    else if(c?.type === 'working') itemData = workings.find(w => w.ID == c.data_id);
                    
                    const finalData = itemData || c?.data;
                    
                    // ถ้าไม่มีข้อมูล ให้แสดงกล่อง Placeholder ว่างๆ (เหมือนในรูป IMG_6778 ช่องขวา)
                    if(!finalData) {
                        return (
                            <div key={idx} className="h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-3xl text-gray-300">🖼️</span>
                            </div>
                        );
                    }

                    const images = extractImages(finalData, c.type);
                    const cover = images.length > 0 ? getImageUrl(images[0]) : "https://via.placeholder.com/300?text=No+Image";

                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
                            <div className="h-40 w-full bg-gray-100 relative">
                                <img src={cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <span className={`absolute top-2 right-2 text-[10px] text-white px-2 py-1 rounded font-bold uppercase ${c.type === 'activity' ? 'bg-orange-400' : 'bg-blue-400'}`}>
                                    {c.type}
                                </span>
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                                    {c.type === 'activity' ? finalData.activity_name : finalData.working_name}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {c.type === 'activity' ? finalData.activity_detail?.description : finalData.working_detail?.description || "-"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleCreatePortfolio = async () => {
        if (!newPortfolioName.trim()) {
            alert("กรุณากรอกชื่อแฟ้มสะสมผลงาน");
            return;
        }

        try {
            let newPortfolio;

            if (selectedTemplateForCreate?.ID) {
                console.log('Creating portfolio from template ID:', selectedTemplateForCreate.ID);
                newPortfolio = await createPortfolioFromTemplate(newPortfolioName, selectedTemplateForCreate.ID);
            }else{
                console.log('Creating custom portfolio without template');
                const result = await createPortfolio({ portfolio_name: newPortfolioName });
                newPortfolio = result.data;
            }

            console.log('New portfolio created:', newPortfolio);
            // const payload: any = { portfolio_name: newPortfolioName };
            // if (selectedTemplateForCreate?.ID) payload.template_id = selectedTemplateForCreate.ID;
            // console.log('Creating portfolio with payload:', payload);

            // const result = await createPortfolio(payload);
            // console.log('Create portfolio response:', result);
            // const newPortfolio = result.data;

            alert("สร้างแฟ้มสะสมผลงานสำเร็จ!");
            setIsCreateModalOpen(false);
            setNewPortfolioName("");
            setSelectedTemplateForCreate(null);
            setPreviewTemplate(null);

            if (newPortfolio?.ID) {
                router.push(`/student/portfolio/section?portfolio_id=${newPortfolio.ID}`);
            } else {
                loadPortfolios();
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการสร้างแฟ้ม");
        }
    };

    const getSectionsCount = (portfolio: any) => {
        const sections = portfolio.portfolio_sections || portfolio.PortfolioSections || [];
        return sections.filter((s: any) => s.is_enabled !== false).length;
    };

    const getBlocksCount = (portfolio: any) => {
        const sections = portfolio.portfolio_sections || portfolio.PortfolioSections || [];
        let totalBlocks = 0;
        sections.forEach((section: any) => {
            const blocks = section.portfolio_blocks || section.PortfolioBlocks || [];
            totalBlocks += blocks.length;
        });
        return totalBlocks;
    };

    const loadColors = async () => {
        try {
            const response = await fetch(`${API}/colors`);
            const result = await response.json();
            setAvailableColors(result.data || []);
        } catch (err) {
            console.error("Error loading colors:", err);
        }
    };

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [portfoliosRes, activitiesRes, workingsRes] = await Promise.all([
                fetchMyPortfolios(),
                fetchActivities({ includeImages: true }),
                fetchWorkings({ includeImages: true })
            ]);

            // Sort Portfolios by created date or ID if needed
            const allPortfolios = portfoliosRes.data || [];
            allPortfolios.forEach((p: any) => {
                if (p.portfolio_sections) {
                    p.portfolio_sections.sort((a:any, b:any) => (a.section_order||0) - (b.section_order||0));
                }
            });
            setPortfolios(allPortfolios);
            
            setActivities(activitiesRes.data || []);
            setWorkings(workingsRes.data || []);

            // Mock User Data (Replace with API fetchUser)
            // const userRes = await fetchUser();
            setCurrentUser({
                firstname: "Warattaya",
                lastname: "Student",
                major: "Software Engineering",
                gpa: "4.00",
                school: "Suranaree University of Technology",
                bio: "Interested in AI & Blockchain technology.",
                profile_image: "" // ใส่ URL รูปจริงถ้ามี
            });

            setLoading(false);
        } catch (err) {
            console.error("Error loading data:", err);
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await fetchTemplates();
            // backend returns an array of templates (not wrapped in {data: ...})
            setTemplates(res || []);
        } catch (err) {
            console.error('Error loading templates', err);
            setTemplates([]);
        }
    };

    const handlePreviewTemplateClick = async (templateId: number) => {
        try {
            setLoadingPreview(true);
            const res = await fetchTemplateById(templateId);
            console.log('Fetched template for preview:', res);

            // ตรวจสอบว่า API ส่งกลับมาเป็น { data: ... } หรือ object เลย
            setPreviewTemplate(res.data || res); 
            setLoadingPreview(false);
        } catch (err) {
            console.error("Error fetching template details:", err);
            setLoadingPreview(false);
            alert("ไม่สามารถโหลดตัวอย่างเทมเพลตได้");
        }
    };

    const handleSaveTheme = async () => {
        if (!selectedColorId || !portfolioToChangeColor) {
            alert("กรุณาเลือกสีธีม");
            return;
        }

        try {
            // Update only the selected portfolio
            await updatePortfolio(portfolioToChangeColor.ID, { colors_id: selectedColorId });
            
            alert("บันทึกสีธีมสำเร็จ!");
            setIsThemeModalOpen(false);
            setPortfolioToChangeColor(null);
            setSelectedColorId(null);
            
            // Reload portfolios to get updated colors
            await loadPortfolios();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const parseBlockContent = (content: any): any => {
        if (!content) return null;
        if (typeof content === 'string') {
            try {
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }
        return content;
    };

    const getImageUrl = (image: any): string => {
        return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || '/placeholder.jpg';
    };

    const extractImages = (data: any, type: 'activity' | 'working'): any[] => {
        if (!data) return [];
        let images = [];
        if (type === 'activity') {
            images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
        } else {
            images = data.WorkingDetail?.Images || data.working_detail?.images || [];
        }
        return Array.isArray(images) ? images : [];
    };

    useEffect(() => {
        loadPortfolios();
        loadColors();
        loadAllData();
    }, []);

    useEffect(() => {
        if (isCreateModalOpen) {
            setCreateStep('template');
            setSelectedTemplateForCreate(null);
            setPreviewTemplate(null);
            loadTemplates();
        } else {
            setTemplates([]);
            setSelectedTemplateForCreate(null);
            setNewPortfolioName('');
            setPreviewTemplate(null);
        }
    }, [isCreateModalOpen]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="text-5xl mb-4">📚</div>
                    <div className="text-lg text-gray-600">กำลังโหลดแฟ้มสะสมผลงาน...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
           
            {/* Main Content */}
            <div className="mx-auto" style={{ maxWidth: 1500 }}>
            <div className="w-full mx-auto p-6">
                <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">แฟ้มสะสมผลงานทั้งหมด</h2>
                        <p className="text-gray-600 mt-2">
                            จัดการและแสดงผลแฟ้มสะสมผลงานของคุณ
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                        onClick={() => router.back()} 
                        className="px-4 py-3 bg-white text-sm rounded-lg shadow-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-50 transition"
                    >
                        ← ย้อนกลับ
                    </button>
                    <button
                        onClick={() => { setIsCreateModalOpen(true); setCreateStep('template'); setSelectedTemplateForCreate(null); }}
                        className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg flex items-center bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-600"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                สร้างแฟ้มใหม่
                            </span>
                        </button>
                    </div>
                </div>

                {/* Portfolios Grid */}
                {portfolios.length > 0 ? (
                    <div className="mx-auto" style={{ maxWidth: 1500 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {portfolios.map((portfolio) => {
                            const sectionsCount = getSectionsCount(portfolio);
                            const blocksCount = getBlocksCount(portfolio);
                            const status = portfolio.status || 'draft';
                            const portfolioTheme = getPortfolioTheme(portfolio);

                            return (
                                <div
                                    key={portfolio.ID}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 hover:border-opacity-100"
                                    style={{ borderColor: portfolioTheme.primaryLight }}
                                >
                                    {/* Header Image/Preview */}
                                    {/* Header Image/Preview */}
                                    <div
                                        className="h-56 relative flex items-center justify-center bg-gray-100 group"
                                    >
                                        {/* Main Image Area - Click to View */}
                                        <div
                                            className="w-full h-full cursor-pointer overflow-hidden"
                                            onClick={() => {
                                                const imgUrl = portfolio.cover_image || portfolio.CoverImage;
                                                if (imgUrl) {
                                                    setLightboxState({
                                                        isOpen: true,
                                                        images: [{ image_url: imgUrl }],
                                                        photoIndex: 0
                                                    });
                                                }
                                            }}
                                        >
                                            {portfolio.cover_image || portfolio.CoverImage ? (
                                                <img
                                                    src={portfolio.cover_image || portfolio.CoverImage}
                                                    alt="Cover"
                                                    className="w-full h-full object-contain bg-gray-200 transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.classList.add('fallback-gradient');
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center p-4 content-placeholder"
                                                    style={{ background: `linear-gradient(135deg, ${portfolioTheme.primary} 0%, ${portfolioTheme.secondary} 100%)` }}
                                                >
                                                    <div className="text-white text-center">
                                                        <div className="text-6xl font-bold opacity-30 mb-2">📚</div>
                                                        <div className="text-sm font-bold bg-white rounded-full px-3 py-1 inline-block shadow-sm" style={{ color: portfolioTheme.primary }}>
                                                            {sectionsCount} Sections • {blocksCount} Items
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Color Change Button */}
                                        <button
                                            className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPortfolioToChangeColor(portfolio);
                                                setSelectedColorId(portfolio.colors_id || null);
                                                setIsThemeModalOpen(true);
                                            }}
                                            title="เปลี่ยนสีธีม"
                                            style={{ color: portfolioTheme.primary }}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                        </button>

                                        {/* Upload Button at Corner */}
                                        <button
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-primary hover:bg-gray-50 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                document.getElementById(`cover-upload-${portfolio.ID}`)?.click();
                                            }}
                                            title="เปลี่ยนรูปปก"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>

                                        <input
                                            type="file"
                                            id={`cover-upload-${portfolio.ID}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    e.stopPropagation(); // prevent bubbling if needed
                                                    try {
                                                        const file = e.target.files[0];
                                                        const uploadRes = await uploadImage(file);
                                                        if (uploadRes.url) {
                                                            await updatePortfolio(portfolio.ID, { cover_image: uploadRes.url });
                                                            loadPortfolios(); // Reload to see changes
                                                        }
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        alert("อัปโหลดรูปภาพไม่สำเร็จ");
                                                    } finally {
                                                        // Reset the input value so the same file can be selected again if needed
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Stop propagation
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1 truncate pr-2">
                                                {portfolio.portfolio_name || portfolio.PortfolioName || 'ไม่มีชื่อ'}
                                            </h3>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const newStatus = status === 'active' ? 'draft' : 'active';
                                                    try {
                                                        await updatePortfolio(portfolio.ID, { status: newStatus });
                                                        loadPortfolios();
                                                    } catch (err) {
                                                        console.error("Update status failed", err);
                                                        alert("ไม่สามารถเปลี่ยนสถานะได้");
                                                    }
                                                }}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${status === 'active'
                                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                                    }`}
                                                title={status === 'active' ? "คลิกเพื่อยกเลิกการแสดงผลหน้าหลัก" : "คลิกเพื่อแสดงบนหน้าหลัก"}
                                            >
                                                {status === 'active' ? '✓ กำลังแสดงหน้าหลัก' : '📝 แบบร่าง (คลิกเพื่อแสดง)'}
                                            </button>
                                        </div>

                                        {portfolio.description && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {portfolio.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                                <span>{sectionsCount} sections</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>{blocksCount} items</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 ">
                                            <button
                                                onClick={() => router.push(`/student/portfolio/section?portfolio_id=${portfolio.ID}`)}
                                                className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                                style={{ backgroundColor: portfolioTheme.primary }}
                                            >
                                                จัดการเนื้อหา
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // setSelectedPortfolio(portfolio);
                                                    router.push(`/student/portfolio/preview/${portfolio.ID}`);
                                                }}
                                                className="px-4 py-2 border-2 rounded-lg text-sm font-medium transition"
                                                style={{ borderColor: portfolioTheme.primary, color: portfolioTheme.primary }}
                                            >
                                                ดูรายละเอียด
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try{
                                                        await SubmissionService.createSubmission({
                                                            portfolio_id:portfolio.ID,
                                                        });
                                                        alert("ส่งตรวจทานเรียบร้อย")
                                                    }
                                                    catch (error){
                                                        console.log(error);
                                                        alert("ไม่สามารถส่งตรวจทานได้")
                                                    }
                                                }}
                                                className="px-2 py-2 border-2 rounded-lg text-sm font-medium transition"
                                                style={{ borderColor: portfolioTheme.primary, color: portfolioTheme.primary }}
                                            >
                                                ส่งตรวจทาน
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm('คุณต้องการลบแฟ้มนี้ใช่หรือไม่?')) return;
                                                    try {
                                                        await deletePortfolio(portfolio.ID);
                                                        // Reload to get updated statuses from backend
                                                        await loadPortfolios();
                                                        if (selectedPortfolio && selectedPortfolio.ID === portfolio.ID) setSelectedPortfolio(null);
                                                        alert('ลบแฟ้มเรียบร้อย');
                                                    } catch (err) {
                                                        console.error('Delete failed', err);
                                                        alert('ไม่สามารถลบแฟ้มได้');
                                                    }
                                                }}
                                                className="px-3 py-2 border-2 rounded-lg text-sm font-medium transition"
                                                style={{ borderColor: portfolioTheme.primary, color: portfolioTheme.primary }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="px-5 py-3 border-t text-xs text-gray-500" style={{ backgroundColor: portfolioTheme.primaryLight }}>
                                        <div className="flex items-center justify-between">
                                            <span>ID: {portfolio.ID}</span>
                                            <span>อัปเดต: {new Date(portfolio.updated_at || portfolio.UpdatedAt).toLocaleDateString('th-TH')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto" style={{ maxWidth: 1600 }}>
                        <div className="text-center py-16">
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <p className="text-xl text-gray-600 mb-2">ยังไม่มีแฟ้มสะสมผลงาน</p>
                        <p className="text-gray-500 mb-6">เริ่มต้นสร้างแฟ้มของคุณเพื่อรวบรวมผลงานและกิจกรรม</p>
                        <button
                            onClick={() => { setIsCreateModalOpen(true); setCreateStep('template'); setSelectedTemplateForCreate(null); }}
                            className="text-white px-6 py-3 rounded-lg font-medium transition inline-flex items-center gap-2"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            สร้างแฟ้มแรก
                        </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* Theme Color Modal */}
            {isThemeModalOpen && portfolioToChangeColor && (
                <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">เลือกสีธีม</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Portfolio: {portfolioToChangeColor.portfolio_name || portfolioToChangeColor.PortfolioName}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsThemeModalOpen(false);
                                    setPortfolioToChangeColor(null);
                                    setSelectedColorId(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {availableColors.map((color) => (
                                <div
                                    key={color.ID}
                                    onClick={() => setSelectedColorId(color.ID)}
                                    className={`border-2 rounded-xl p-4 cursor-pointer transition hover:shadow-lg ${
                                        selectedColorId === color.ID ? 'ring-4 ring-offset-2' : ''
                                    }`}
                                    style={{
                                        borderColor: selectedColorId === color.ID ? color.primary_color : '#e5e7eb',
                                        ...(selectedColorId === color.ID && {
                                            ['--tw-ring-color' as any]: color.primary_color
                                        })
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="w-12 h-12 rounded-lg shadow-sm"
                                            style={{ backgroundColor: color.primary_color }}
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{color.colors_name}</h3>
                                            <p className="text-xs text-gray-500">{color.primary_color}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center">
                                            <div
                                                className="w-full h-8 rounded mb-1"
                                                style={{ backgroundColor: color.secondary_color }}
                                            />
                                            <p className="text-[10px] text-gray-500">Secondary</p>
                                        </div>
                                        <div className="text-center">
                                            <div
                                                className="w-full h-8 rounded mb-1"
                                                style={{ backgroundColor: color.background_color }}
                                            />
                                            <p className="text-[10px] text-gray-500">Background</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsThemeModalOpen(false);
                                    setPortfolioToChangeColor(null);
                                    setSelectedColorId(null);
                                }}
                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveTheme}
                                disabled={!selectedColorId}
                                className="px-6 py-2.5 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: theme.primary }}
                            >
                                บันทึกสีธีม
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal (template selection -> naming) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 animate-in fade-in zoom-in duration-200 ${ previewTemplate ? 'max-w-6xl h-[90vh]' : 'max-w-5xl'}`}>
                    {previewTemplate ? (
                <div className="flex flex-col h-full">
                    {/* Header ของหน้า Preview */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{previewTemplate.template_name || previewTemplate.TemplateName}
                                <span className="text-xs font-normal text-gray-500 bg-gray-200 rounded-full ml-2 px-2 py-0.5">Preview Mode</span>
                            </h2>
                            <p className="text-sm text-gray-500">{previewTemplate.description || previewTemplate.Description}</p>
                        </div>
                        <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                    </div>

                    {/* Content ของหน้า Preview (แสดง Sections) */}
                    <div className="flex-1 overflow-y-auto pr-2 no-arrow">
                        {(() => {
                            // const sections = previewTemplate.template_sections || previewTemplate.TemplateSections || [];
                            const sections = (previewTemplate.template_section_links || [])
                                
                            if (sections.length === 0) return <div className="text-center py-10 text-gray-400">เทมเพลตนี้ยังไม่มีข้อมูลตัวอย่าง</div>;
                            
                            return (
                                <div className="space-y-6">
                                    {sections.sort((a:any, b:any) => (a.order_index||0) - (b.order_index||0)).map((link: any, idx: number) => {
                                        
                                        const section = link.templates_section 
                                        if (!section) return null;
                                        
                                        const layoutType = section.layout_type || "default";
                                        const rawBlocks = section.section_blocks || section.SectionBlocks || [];
                                        const blocks = rawBlocks.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                                        const renderBlockItem = (blockData: any) => {
                                            const templateBlock = blockData.templates_block || blockData.TemplatesBlock;
                                            if (!templateBlock) return null;

                                            const type = templateBlock.block_type; // 'image' or 'text'
                                            const content = templateBlock.default_content || {};
                                            const style = templateBlock.default_style || {};
                                            const isCircle = style.border_radius === "50%"; // เช็คว่าเป็นวงกลมไหมจาก JSON
                                                            // ไอคอนจำลอง
                                        if (type === 'image') {
                                            return (
                                                <div className={`bg-gray-200 flex items-center justify-center border-2 border-gray-300 overflow-hidden ${isCircle ? 'rounded-full aspect-square w-40 h-40 mx-auto' : 'rounded-lg w-full h-48'}`}>
                                                    {content.url ? (
                                                        <img src={content.url} alt="preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-4xl text-gray-400">🖼️</span>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (type === 'text') {
                                            return (
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full">
                                                    <div className="h-2 w-1/3 bg-gray-200 rounded mb-2"></div>
                                                    <div className="h-2 w-2/3 bg-gray-200 rounded mb-4"></div>
                                                    <p className="text-sm text-gray-600">
                                                        {content.text === "Your text here" ? "Text Content" : content.text}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return null;
                                    };

                                    // แยกส่วนการแสดงผลตาม Layout Type
                                    let layoutContent;
                                    // กรณี 1: Profile Left (รูปซ้าย ข้อความขวา)
                                    if (layoutType === 'profile_header_left') {
                                        const imgBlock = blocks.find((b: any) => (b.templates_block?.block_type === 'image'));
                                        const textBlocks = blocks.filter((b: any) => (b.templates_block?.block_type !== 'image'));

                                        layoutContent = (
                                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                                {/* ฝั่งซ้าย: รูป (30%) */}
                                                <div className="w-full md:w-1/4 flex justify-center">
                                                        {imgBlock ? renderBlockItem(imgBlock) : <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">No Image</div>}
                                                </div>
                                                {/* ฝั่งขวา: ข้อความ (70%) */}
                                                <div className="w-full md:w-3/4 space-y-3">
                                                    {textBlocks.map((b: any) => (
                                                        <div key={b.ID}>{renderBlockItem(b)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    } 
                                    // กรณี 2: Profile Right (ข้อความซ้าย รูปขวา)
                                    else if (layoutType === 'profile_header_right') {
                                        const imgBlock = blocks.find((b: any) => (b.templates_block?.block_type === 'image'));
                                        const textBlocks = blocks.filter((b: any) => (b.templates_block?.block_type !== 'image'));

                                        layoutContent = (
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                {/* ฝั่งซ้าย: ข้อความ (70%) */}
                                                <div className="w-full md:w-3/4 space-y-3">
                                                    {textBlocks.map((b: any) => (
                                                        <div key={b.ID}>{renderBlockItem(b)}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* ฝั่งขวา: รูป (30%) */}
                                                <div className="w-full md:w-1/4 flex justify-center">
                                                        {imgBlock ? renderBlockItem(imgBlock) : <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">No Image</div>}
                                                </div>
                                            </div>
                                        );
                                    }
                                    else if (layoutType === 'two_pictures_two_texts') {
                                        layoutContent = (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               {blocks.map((b:any) => (
                                                    <div key={b.ID} className="flex flex-col">
                                                        {renderBlockItem(b)}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    // กรณี 3: แบบอื่นๆ (เรียงลงมาตามปกติ)
                                    else {
                                        layoutContent = (
                                            <div className="space-y-3">
                                                {blocks.map((b:any) => (
                                                    <div key={b.ID} className="w-full">
                                                        {renderBlockItem(b)}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return (
                                            <div key={link.ID || idx} className="border-2 rounded-xl p-5 border-dashed border-gray-200 bg-gray-50">
                                                <div className="flex items-center mb-4 gap-2">
                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-bold flex-items-center justify-center">
                                                        section {idx + 1}
                                                    </span>
                                                    <h4 className="text-lg font-bold text-gray-800">{section.section_name || section.SectionName}</h4>
                                                </div>
                                                {blocks.length > 0 ? (
                                                    <div className="space-y-3">
                                
                                                        {layoutContent}
                                                    </div>
                                                ) : <div className="text-sm text-gray-400 italic">Empty Section</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Footer ของหน้า Preview (ปุ่มเลือก/ย้อนกลับ) */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button onClick={() => setPreviewTemplate(null)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">ย้อนกลับ</button>
                        <button
                            onClick={() => {
                                setSelectedTemplateForCreate(previewTemplate);
                                setPreviewTemplate(null);
                                setCreateStep('name');
                                setNewPortfolioName(`${previewTemplate.template_name || previewTemplate.TemplateName} - ใหม่`);
                            }}
                            className="px-6 py-2.5 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
                            style={{ backgroundColor: theme.primary }}
                        >
                            เลือกเทมเพลตนี้
                        </button>
                    </div>
                </div>
            ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">สร้างแฟ้มสะสมผลงานใหม่</h2>
                            {createStep === 'template' ? (
                                <div>
                                    <p className="text-sm text-gray-600 mb-4">เลือกเทมเพลตสำหรับแฟ้มของคุณ</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                                        {templates.length > 0 ? templates.map((t) => (
                                            <div key={t.ID} className="border rounded-lg p-4 flex flex-col justify-between hover:border-gray-400 transition">
                                                <div className="mb-4">
                                                    <h3 className="font-bold text-lg">{t.template_name || t.TemplateName}</h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{t.description || t.Description}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <button 
                                                        onClick={() => handlePreviewTemplateClick(t.ID)}
                                                        disabled={loadingPreview}
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1 disabled:opacity-50"
                                                        >
                                                        {loadingPreview ? (
                                                            <span>กำลังโหลด</span>
                                                        ) : (
                                                            <span>ดูตัวอย่าง</span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedTemplateForCreate(t); setCreateStep('name'); setNewPortfolioName(`${t.template_name || t.TemplateName} - ใหม่`); }}
                                                        className="flex-1 px-4 py-2 rounded-lg text-white"
                                                        style={{ backgroundColor: theme.primary }}
                                                    >
                                                        เลือก
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full text-center text-gray-500 py-8">ไม่พบเทมเพลต</div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">ยกเลิก</button>
                                    </div>
                                </div>
                            ) : (
                                //ส่วนตั้งชื่อPortfolio
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium">เทมเพลตที่เลือก</h3>
                                            <p className="text-sm text-gray-500">{selectedTemplateForCreate?.template_name || selectedTemplateForCreate?.TemplateName}</p>
                                        </div>
                                        <button onClick={() => setCreateStep('template')} className="text-sm text-gray-600 hover:underline">ย้อนกลับ</button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อแฟ้ม <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none transition"
                                            placeholder="เช่น แฟ้มผลงานปี 2025"
                                            value={newPortfolioName}
                                            onChange={(e) => setNewPortfolioName(e.target.value)}
                                            onKeyPress={(e) => { if (e.key === 'Enter') handleCreatePortfolio(); }}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="rounded-lg p-3" style={{ backgroundColor: theme.primaryLight, borderColor: theme.accent, borderWidth: '1px' }}>
                                        <p className="text-sm" style={{ color: theme.primaryDark }}>
                                            💡 <strong>คำแนะนำ:</strong> หลังจากสร้างแฟ้ม คุณจะสามารถเพิ่ม Sections และเลือกผลงาน/กิจกรรมเข้าไปได้
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => { setIsCreateModalOpen(false); setNewPortfolioName(''); setSelectedTemplateForCreate(null); }} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">ยกเลิก</button>
                                        <button
                                            onClick={handleCreatePortfolio}
                                            className="px-6 py-2.5 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
                                            style={{ backgroundColor: theme.primary }}
                                        >สร้างแฟ้ม</button>
                                    </div>
                                </div>
                            )}
                        </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Modal - Portfolio Detail */}
            {selectedPortfolio && (
                <div
                    className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPortfolio(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto flex flex-col no-arrow"
                        // onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {/* Header (use selected portfolio theme) */}
                        {
                            (() => {
                                // const selectedTheme = getPortfolioTheme(selectedPortfolio);
                                const sections = (selectedPortfolio.portfolio_sections || selectedPortfolio.PortfolioSections || [])
                                    .filter((s: any) => s.is_enabled !== false)
                                    .sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));

                                    if (sections.length === 0) {
                                        return (
                                            <div className="text-center py-20">
                                                <div className="text-6xl mb-4 grayscale opacity-30">🔭</div>
                                                <p className="text-xl text-gray-500">ยังไม่มีเนื้อหาในแฟ้มนี้</p>
                                            </div>
                                        );
                                    }

                                // return (
                                //     <div className="p-6 border-b flex items-start justify-between" style={{ background: `linear-gradient(to right, ${selectedTheme.primaryLight}, ${selectedTheme.primaryLight})` }}>
                                //         <div className="flex-1">
                                //             <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                //                 {selectedPortfolio.portfolio_name || selectedPortfolio.PortfolioName || 'ไม่มีชื่อ'}
                                //             </h2>
                                //             {selectedPortfolio.description && (
                                //                 <p className="text-gray-600 mb-3">{selectedPortfolio.description}</p>
                                //             )}
                                //             <div className="flex items-center gap-3">
                                //                 <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedPortfolio.status === 'active'
                                //                     ? 'bg-green-100 text-green-700'
                                //                     : 'bg-gray-100 text-gray-600'
                                //                     }`}>
                                //                     {selectedPortfolio.status === 'active' ? '✓ เผยแพร่' : '📝 แบบร่าง'}
                                //                 </span>
                                //                 <span className="text-sm text-gray-500">Portfolio ID: {selectedPortfolio.ID}</span>
                                //             </div>
                                //         </div>
                                //         <button
                                //             onClick={() => setSelectedPortfolio(null)}
                                //             className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
                                //         >
                                //             ×
                                //         </button>
                                //     </div>
                                // );
                                return (
                                    <div className="space-y-10 max-w-5xl mx-auto">
                                        {sections.map((section: any, idx: number) => (
                                            <div key={section.ID} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                
                                                {/* Header ของ Section */}
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                                                        {idx + 1}
                                                    </span>
                                                    <h3 className="font-bold text-gray-800 text-lg">
                                                        {section.section_title || "Untitled Section"}
                                                    </h3>
                                                </div>

                                                {/* เนื้อหาข้างใน (ต้องเรียกฟังก์ชันนี้!) */}
                                                <div className="p-6">
                                                    {renderSectionContent(section)} 
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()
                        }
                        

                        {/* Content - Sections */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {(() => {
                                const sections = (selectedPortfolio.portfolio_sections || selectedPortfolio.PortfolioSections || [])
                                    .filter((s: any) => s.is_enabled === true)
                                    .sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));

                                if (sections.length === 0) {
                                    return (
                                        <div className="text-center py-12">
                                            <div className="text-5xl mb-3">🔭</div>
                                            <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections ในแฟ้มนี้</p>
                                            <p className="text-gray-500 mb-6">เริ่มเพิ่ม Sections เพื่อแสดงผลงานและกิจกรรม</p>
                                            <button
                                                onClick={() => {
                                                    setSelectedPortfolio(null);
                                                    router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                                }}
                                                className="text-white px-6 py-3 rounded-lg font-medium"
                                                style={{ backgroundColor: selectedTheme.primary }}
                                            >
                                                ไปจัดการ Sections
                                            </button>
                                        </div>
                                    );
                                }

                                // return (
                                //     <div>
                                //         <div className="flex items-center justify-between mb-6">
                                //             <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                //                 <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: selectedTheme.primary }}>
                                //                     {sections.length}
                                //                 </span>
                                //                 Sections ทั้งหมด
                                //             </h3>
                                //             <button
                                //                 onClick={() => {
                                //                     setSelectedPortfolio(null);
                                //                     router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                //                 }}
                                //                 className="text-sm font-medium flex items-center gap-1"
                                //                 style={{ color: selectedTheme.primary }}
                                //             >
                                //                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                //                 </svg>
                                //                 จัดการ
                                //             </button>
                                //         </div>

                                //         <div className="space-y-6">
                                //             {sections.map((section: any, sectionIndex: number) => {
                                //                 const blocks = section.portfolio_blocks || section.PortfolioBlocks || [];

                                //                 return (
                                //                     <div
                                //                         key={section.ID}
                                //                         className="border-2 rounded-xl p-5 transition bg-white"
                                //                         style={{ borderColor: selectedTheme.primaryLight }}
                                //                     >
                                //                         {/* Section Header */}
                                //                         <div className="flex items-start justify-between mb-4">
                                //                             <div className="flex-1">
                                //                                 <div className="flex items-center gap-2 mb-2">
                                //                                     <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: selectedTheme.accent }}>
                                //                                         Section {sectionIndex + 1}
                                //                                     </span>
                                //                                     <h4 className="text-lg font-bold text-gray-900">
                                //                                         {section.section_title || section.SectionTitle || 'ไม่มีชื่อ'}
                                //                                     </h4>
                                //                                 </div>
                                //                                 <p className="text-sm text-gray-500">
                                //                                     {blocks.length} รายการ
                                //                                 </p>
                                //                             </div>
                                //                         </div>

                                //                         {/* Blocks Display */}
                                //                         {blocks.length > 0 ? (
                                //                             <div className="space-y-3">
                                //                                 {blocks.map((block: any, blockIndex: number) => {
                                //                                     const contents = parseBlockContent(block.content || block.Content);
                                //                                     if (!contents) return null;

                                //                                     const data = contents.data || {};
                                //                                     const images = extractImages(data, contents.type);

                                //                                     // Helper formats
                                //                                     const formatDate = (dateString: string) => {
                                //                                         if (!dateString) return "";
                                //                                         const date = new Date(dateString);
                                //                                         return date.toLocaleDateString("th-TH", {
                                //                                             year: "numeric",
                                //                                             month: "long",
                                //                                             day: "numeric",
                                //                                         });
                                //                                     };

                                //                                     let displayData: any = null;
                                //                                     if (contents.type === 'activity') {
                                //                                         displayData = {
                                //                                             type: 'activity',
                                //                                             title: data.activity_name,
                                //                                             institution: data.activity_detail?.institution || data.ActivityDetail?.Institution,
                                //                                             date: formatDate(data.activity_detail?.activity_at || data.ActivityDetail?.ActivityAt),
                                //                                             desc: data.activity_detail?.description || data.ActivityDetail?.Description,
                                //                                             typeName: data.activity_detail?.type_activity?.type_name || data.ActivityDetail?.TypeActivity?.TypeName,
                                //                                             levelName: data.activity_detail?.level_activity?.level_name || data.ActivityDetail?.LevelActivity?.LevelName,
                                //                                             rewardName: data.reward?.level_name || data.Reward?.LevelName
                                //                                         };
                                //                                     } else {
                                //                                         displayData = {
                                //                                             type: 'working',
                                //                                             title: data.working_name,
                                //                                             status: data.status,
                                //                                             typeName: data.working_detail?.type_working?.type_name || data.WorkingDetail?.TypeWorking?.TypeName,
                                //                                             date: formatDate(data.working_detail?.working_at || data.WorkingDetail?.WorkingAt),
                                //                                             desc: data.working_detail?.description || data.WorkingDetail?.Description,
                                //                                             links: data.working_detail?.links || data.WorkingDetail?.Links || []
                                //                                         };
                                //                                     }

                                //                                     return (
                                //                                         <div
                                //                                             key={block.ID}
                                //                                             className="border rounded-lg p-4 transition hover:shadow-md bg-white"
                                //                                             style={{ borderColor: selectedTheme.primaryLight }}
                                //                                         >
                                //                                             <div className="flex items-start gap-4">
                                //                                                 {/* Images Preview */}
                                //                                                 {images.length > 0 && (
                                //                                                     <div className="flex-shrink-0">
                                //                                                         <div
                                //                                                             className={`w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border border-gray-100 relative group ${images.length > 1 ? 'cursor-pointer' : ''}`}
                                //                                                             onClick={(e) => {
                                //                                                                 if (images.length > 1) {
                                //                                                                     e.stopPropagation();
                                //                                                                     setItemImageIndices(prev => {
                                //                                                                         const currentIndex = prev[block.ID] || 0;
                                //                                                                         return { ...prev, [block.ID]: (currentIndex + 1) % images.length };
                                //                                                                     });
                                //                                                                 }
                                //                                                             }}
                                //                                                         >
                                //                                                             <div
                                //                                                                 className="flex transition-transform duration-300 ease-in-out h-full"
                                //                                                                 style={{
                                //                                                                     transform: `translateX(-${(itemImageIndices[block.ID] || 0) * 100}%)`,
                                //                                                                     width: `${images.length * 100}%`
                                //                                                                 }}
                                //                                                             >
                                //                                                                 {images.map((img: any, idx: number) => (
                                //                                                                     <div key={idx} className="w-full h-full flex-shrink-0 relative">
                                //                                                                         <img
                                //                                                                             src={getImageUrl(img)}
                                //                                                                             alt={`Preview ${idx + 1}`}
                                //                                                                             className="w-full h-full object-cover"
                                //                                                                             onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                                //                                                                         />
                                //                                                                     </div>
                                //                                                                 ))}
                                //                                                             </div>

                                //                                                             {/* Expand Button Overlay */}
                                //                                                             <button
                                //                                                                 className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                //                                                                 onClick={(e) => {
                                //                                                                     e.stopPropagation();
                                //                                                                     setLightboxState({
                                //                                                                         isOpen: true,
                                //                                                                         images: images,
                                //                                                                         photoIndex: itemImageIndices[block.ID] || 0
                                //                                                                     });
                                //                                                                 }}
                                //                                                                 title="ดูรูปภาพขนาดใหญ่"
                                //                                                             >
                                //                                                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                //                                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                //                                                                 </svg>
                                //                                                             </button>

                                //                                                             {/* Optional: Indicator dots or overlays could go here if needed, but keeping it clean for now */}
                                //                                                         </div>
                                //                                                         {images.length > 1 && (
                                //                                                             <div className="text-xs text-gray-500 text-center mt-1 font-medium select-none">
                                //                                                                 {(itemImageIndices[block.ID] || 0) + 1} / {images.length} รูป
                                //                                                             </div>
                                //                                                         )}
                                //                                                     </div>
                                //                                                 )}

                                //                                                 {/* Content Info */}
                                //                                                 <div className="flex-1 min-w-0">
                                //                                                     <div className="flex items-center gap-2 mb-1">
                                //                                                         <h5 className="font-bold text-lg text-gray-900 truncate">
                                //                                                             {displayData.title || 'ไม่มีชื่อ'}
                                //                                                         </h5>
                                //                                                         {displayData.status && (
                                //                                                             <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${displayData.status === 'COMPLETED' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                //                                                                 displayData.status === 'INPROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                //                                                                 }`}>
                                //                                                                 {displayData.status}
                                //                                                             </span>
                                //                                                         )}
                                //                                                     </div>

                                //                                                     {/* Badges Row */}
                                //                                                     <div className="flex flex-wrap gap-2 mb-2">
                                //                                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${displayData.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                //                                                             {displayData.type}
                                //                                                         </span>
                                //                                                         {displayData.typeName && (
                                //                                                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                //                                                                 {displayData.typeName}
                                //                                                             </span>
                                //                                                         )}
                                //                                                         {displayData.levelName && (
                                //                                                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                                //                                                                 {displayData.levelName}
                                //                                                             </span>
                                //                                                         )}
                                //                                                         {displayData.rewardName && (
                                //                                                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                                //                                                                 🏆 {displayData.rewardName}
                                //                                                             </span>
                                //                                                         )}
                                //                                                     </div>

                                //                                                     {/* Details */}
                                //                                                     <div className="text-sm text-gray-600 space-y-1">
                                //                                                         {displayData.institution && (
                                //                                                             <div className="flex items-center gap-2">
                                //                                                                 <span className="text-gray-400">🏢</span>
                                //                                                                 <span>{displayData.institution}</span>
                                //                                                             </div>
                                //                                                         )}
                                //                                                         {displayData.date && (
                                //                                                             <div className="flex items-center gap-2">
                                //                                                                 <span className="text-gray-400">🗓</span>
                                //                                                                 <span>{displayData.date}</span>
                                //                                                             </div>
                                //                                                         )}
                                //                                                         {displayData.desc && (
                                //                                                             <p className="text-gray-500 mt-1 line-clamp-2 text-xs">
                                //                                                                 {displayData.desc}
                                //                                                             </p>
                                //                                                         )}
                                //                                                         {/* Links */}
                                //                                                         {displayData.links && displayData.links.length > 0 && (
                                //                                                             <div className="flex flex-wrap gap-2 mt-2">
                                //                                                                 {displayData.links.map((link: any, i: number) => (
                                //                                                                     <a
                                //                                                                         key={i}
                                //                                                                         href={link.working_link}
                                //                                                                         target="_blank"
                                //                                                                         rel="noopener noreferrer"
                                //                                                                         className="flex items-center gap-1 text-xs text-blue-500 hover:underline bg-blue-50 px-2 py-1 rounded"
                                //                                                                     >
                                //                                                                         🔗 Link {i + 1}
                                //                                                                     </a>
                                //                                                                 ))}
                                //                                                             </div>
                                //                                                         )}
                                //                                                     </div>
                                //                                                 </div>

                                //                                                 {/* Order Badge */}
                                //                                                 <div className="flex-shrink-0">
                                //                                                     <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold shadow-sm" style={{ border: `1px solid ${selectedTheme.primary}`, color: selectedTheme.primary }}>
                                //                                                         {blockIndex + 1}
                                //                                                     </span>
                                //                                                 </div>
                                //                                             </div>
                                //                                         </div>
                                //                                     );
                                //                                 })}
                                //                             </div>
                                //                         ) : (
                                //                             <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                //                                 <div className="text-3xl mb-2">🔭</div>
                                //                                 <p className="text-sm text-gray-500">ยังไม่มีข้อมูลใน Section นี้</p>
                                //                             </div>
                                //                         )}
                                //                     </div>
                                //                 );
                                //             })}
                                //         </div>
                                //     </div>
                                // );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                อัปเดตล่าสุด: {new Date(selectedPortfolio.updated_at || selectedPortfolio.UpdatedAt).toLocaleString('th-TH')}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedPortfolio(null)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                                >
                                    ปิด
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPortfolio(null);
                                        router.push(`/student/portfolio/section?portfolio_id=${selectedPortfolio.ID}`);
                                    }}
                                    className="px-6 py-2.5 rounded-lg text-white font-medium transition"
                                    style={{ backgroundColor: selectedTheme.primary }}
                                >
                                    จัดการเนื้อหา
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Lightbox Modal */}
            {lightboxState.isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
                    onClick={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 p-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxState(prev => ({ ...prev, isOpen: false }));
                        }}
                    >
                        ×
                    </button>

                    <div
                        className="relative w-full max-w-5xl max-h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {lightboxState.images.length > 1 && (
                            <button
                                className="absolute left-2 text-white p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition z-50 md:-left-16"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxState(prev => ({
                                        ...prev,
                                        photoIndex: (prev.photoIndex + prev.images.length - 1) % prev.images.length,
                                    }));
                                }}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        <div className="relative max-h-[85vh] max-w-full">
                            <img
                                src={getImageUrl(lightboxState.images[lightboxState.photoIndex])}
                                alt="Full size"
                                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                                onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                            />
                            {lightboxState.images.length > 0 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-1 rounded-full text-sm">
                                    {lightboxState.photoIndex + 1} / {lightboxState.images.length}
                                </div>
                            )}
                        </div>

                        {lightboxState.images.length > 1 && (
                            <button
                                className="absolute right-2 text-white p-3 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition z-50 md:-right-16"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxState(prev => ({
                                        ...prev,
                                        photoIndex: (prev.photoIndex + 1) % prev.images.length,
                                    }));
                                }}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}