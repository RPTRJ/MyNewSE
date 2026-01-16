// PortfolioContent.tsx - Shared rendering logic for portfolio sections

import React from 'react';

// ===================== Helper Functions =====================

export const lightenColor = (hex: string, percent: number): string => {
  if (!hex) return '#ffffff';
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
};

export const formatDateTH = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export function parseBlockContent(content: any): any {
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

export function getImageUrl(image: any): string {
  return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || placeholderImage;
}

export function extractImages(data: any, type: 'activity' | 'working'): any[] {
  if (!data) return [];
  let images = [];
  if (type === 'activity') {
    images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
  } else {
    images = data.WorkingDetail?.Images || data.working_detail?.images || [];
  }
  return Array.isArray(images) ? images : [];
}

// ===================== Component Props =====================

interface ProfileSectionProps {
  user: {
    firstname: string;
    lastname: string;
    major: string;
    school: string;
    profile_image: string | null;
    gpa: string;
    academic_score: any;
  };
  isRight?: boolean;
}

interface BlockCardProps {
  block: any;
  activities: any[];
  workings: any[];
  imageIndices: { [key: string]: number };
  onNextImage: (blockId: string, totalImages: number, e: React.MouseEvent) => void;
  onPrevImage: (blockId: string, totalImages: number, e: React.MouseEvent) => void;
  sectionId: number;
  idx: number;
}

interface SectionContentProps {
  section: any;
  activities: any[];
  workings: any[];
  currentUser: any;
  imageIndices: { [key: string]: number };
  onNextImage: (blockId: string, totalImages: number, e: React.MouseEvent) => void;
  onPrevImage: (blockId: string, totalImages: number, e: React.MouseEvent) => void;
  filterByType?: 'activity' | 'working' | null;
}

// ===================== Profile Section Component =====================

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, isRight = false }) => {
  const gpax = user.academic_score?.gpax || user.gpa || "-";

  return (
    <div className={`flex flex-col items-center gap-6 p-6 bg-white border border-gray-100 rounded-xl shadow-sm h-full w-full 
                     ${isRight ? 'md:flex-row-reverse text-right' : 'md:flex-row text-left'}`}>
      <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
        <img
          src={user.profile_image || placeholderImage}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget as HTMLImageElement).src = placeholderImage}
        />
      </div>
      <div className={`flex-1 w-full space-y-3 ${isRight ? 'md:items-end' : 'md:items-start'}`}>
        <div className={`border-b pb-2 border-gray-100 ${isRight ? 'flex flex-col items-end' : ''}`}>
          <h3 className="text-2xl font-bold text-gray-800">
            {user.firstname} {user.lastname}
          </h3>
          <p className="text-blue-500 font-medium">
            {user.school || "Suranaree University of Technology"}
          </p>
        </div>
        <div className={`space-y-1 text-sm text-gray-600 ${isRight ? 'flex flex-col items-end' : ''}`}>
          <p><span className="font-bold text-gray-800">Major:</span> {user.major}</p>
          <p><span className="font-bold text-gray-800">GPAX:</span> <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{gpax}</span></p>

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
  );
};

// ===================== Block Card Component =====================

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  activities,
  workings,
  imageIndices,
  onNextImage,
  onPrevImage,
  sectionId,
  idx
}) => {
  const c = parseBlockContent(block.content);
  if (c?.type === 'profile') return null;

  let itemData = null;
  if (c?.type === 'activity') itemData = activities.find((a: any) => a.ID == c.data_id);
  else if (c?.type === 'working') itemData = workings.find((w: any) => w.ID == c.data_id);

  const finalData = itemData || c?.data;
  if (!finalData) return null;

  const images = extractImages(finalData, c.type);
  const uniqueKey = block.ID ? block.ID.toString() : `${sectionId}-${idx}`;
  const currentIndex = imageIndices[uniqueKey] || 0;
  const currentImageSrc = images.length > 0 ? getImageUrl(images[currentIndex]) : placeholderImage;

  const date = finalData.activity_detail?.activity_at || finalData.working_detail?.working_at || finalData.activity_date || finalData.working_date || finalData.date;
  const location = finalData.activity_detail?.institution || finalData.location;
  const award = finalData.reward?.level_name || finalData.award || finalData.award_name;
  const level = finalData.activity_detail?.level_activity?.level_name || finalData.level;
  const category = finalData.activity_detail?.type_activity?.type_name || finalData.working_detail?.type_working?.type_name || finalData.category;
  const description = finalData.activity_detail?.description || finalData.working_detail?.description || "-";

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative">
      <div className="h-64 w-full bg-gray-100 relative overflow-hidden group">
        <img src={currentImageSrc} alt="" className="w-full h-full object-cover transition-all duration-500" />
        <span className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded font-bold uppercase z-10 ${c.type === 'activity' ? 'bbg-[#FF6414] text-white' : 'bg-[#FF6414]/80 text-white'}`}>
          {c.type}
        </span>
        {images.length > 1 && (
          <>
            <button onClick={(e) => onPrevImage(uniqueKey, images.length, e)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button onClick={(e) => onNextImage(uniqueKey, images.length, e)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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
          {level && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium">
              {level}
            </span>
          )}
          {category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#FF6414]/10 border border-[#FF6414]/20 text-[#FF6414] text-xs font-medium`}>
              {category}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-1.5">
          {award && (
            <div className="flex items-center gap-2 text-xs text-yellow-700 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.637 6.637 0 002.545 5.123c.388.263.803.493 1.237.682 1.327.58 2.793 1.032 4.302 1.309.37.068.732.14.962.387.246.265.485.642.485 1.139v3.016a29.89 29.89 0 00-6.02 1.365.75.75 0 00-.462.685c.178 1.956 1.48 3.518 3.212 4.295.66.295 1.396.447 2.164.447h2.09c.768 0 1.503-.152 2.164-.447 1.732-.777 3.034-2.339 3.212-4.295a.75.75 0 00-.462-.685 29.89 29.89 0 00-6.02-1.365v-3.016c0-.497.24-.874.485-1.139.23-.247.592-.32.962-.387 1.509-.277 2.975-.729 4.302-1.309.434-.189.849-.419 1.237-.682a6.637 6.637 0 002.545-5.123.75.75 0 00-.584-.859 13.926 13.926 0 00-3.071-.543v-.858a.75.75 0 00-.75-.75h-11.25a.75.75 0 00-.75.75z" clipRule="evenodd" />
              </svg>
              <span>{award}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#FF6414]">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-gray-600">{formatDateTH(date)}</span>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-500">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.003.002.001.003.001a.75.75 0 01-.01-.001zM10 12.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-600 line-clamp-1">{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== Section Content Component =====================

export const SectionContent: React.FC<SectionContentProps> = ({
  section,
  activities,
  workings,
  currentUser,
  imageIndices,
  onNextImage,
  onPrevImage,
  filterByType = null
}) => {
  const blocks = section.portfolio_blocks || [];
  const isProfileLayout = section.section_title?.toLowerCase().includes('profile') ||
    (section as any).layout_type === 'profile_header_left';

  if (isProfileLayout && currentUser) {
    const isRight = section.section_title?.toLowerCase().includes('right') ||
      (section as any).layout_type === 'profile_header_right';
    return <ProfileSection user={currentUser} isRight={isRight} />;
  }

  // Filter blocks by type if specified
  let filteredBlocks = blocks;
  if (filterByType) {
    filteredBlocks = blocks.filter((block: any) => {
      const c = parseBlockContent(block.content);
      return c?.type === filterByType;
    });
  }

  if (filteredBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-2xl mb-2">📭</div>
        <div className="text-sm">ยังไม่มีเนื้อหาในส่วนนี้</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredBlocks.map((block: any, idx: number) => (
        <BlockCard
          key={block.ID || idx}
          block={block}
          activities={activities}
          workings={workings}
          imageIndices={imageIndices}
          onNextImage={onNextImage}
          onPrevImage={onPrevImage}
          sectionId={section.ID}
          idx={idx}
        />
      ))}
    </div>
  );
};