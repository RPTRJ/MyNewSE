"use client";

// สำหรับแสดง Profile User (ดึงข้อมูล User มาแสดง)
export const ProfileBlock = ({ user }: { user: any }) => {
    // สมมติถ้าไม่มีรูป ให้ใช้ Placeholder
    const profileImg = user?.profile_image || "https://via.placeholder.com/150"; 
    const name = user ? `${user.firstname} ${user.lastname}` : "Loading...";
    const position = user?.position || "Student";
    const bio = user?.bio || "ยังไม่มีข้อมูลสังเขป";
    return (
        <div className="flex flex-row items-center gap-6 p-6 bg-white h-full w-full">
            {/* รูปวงกลมด้านซ้าย */}
            <div className="w-28 h-28 flex-shrink-0 rounded-full overflow-hidden border-4 border-orange-100 shadow-sm">
                <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            </div>
            
            {/* ข้อความด้านขวา */}
            <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-gray-800">{name}</h3>
                <p className="text-orange-500 font-medium text-sm mb-2">{position}</p>
                <div className="h-1 w-10 bg-gray-200 mb-2"></div>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                    {bio}
                </p>
            </div>
        </div>
    );
};

// สำหรับแสดง Activity/Working (Showcase)
export const ShowcaseBlock = ({ data, type }: { data: any, type: string }) => {
    // ดึงรูปแรกมาโชว์
    const images = type === 'activity' 
        ? (data?.ActivityDetail?.Images || data?.activity_detail?.images || []) 
        : (data?.WorkingDetail?.Images || data?.working_detail?.images || []);
    
    const coverImage = images.length > 0 ? (images[0].file_path || images[0].image_url) : "/placeholder.jpg";
    const title = type === 'activity' ? data.activity_name : data.working_name;
    const desc = type === 'activity' ? data.activity_detail?.description : data.working_detail?.description;

    return (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col">
            <div className="h-32 w-full bg-gray-200 relative">
                 <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                 <span className="absolute top-1 right-1 bg-white/80 backdrop-blur px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider text-gray-600">
                    {type}
                 </span>
            </div>
            <div className="p-3 flex-1 flex flex-col text-left">
                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{title}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2">{desc || "-"}</p>
            </div>
        </div>
    );
};