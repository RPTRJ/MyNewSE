"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, User, Pin, Download, FileText, File, Loader2, Image as ImageIcon, Eye, X, AlignLeft, ArrowDownLeftIcon, ArrowLeftIcon } from 'lucide-react';
import AnnouncementService, { type Announcement, type Attachment } from '@/services/announcement';
import { useRouter, useParams } from 'next/navigation';

const AnnouncementDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnnouncementDetail();
    }
  }, [id]);

  const fetchAnnouncementDetail = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลประกาศ
      const data = await AnnouncementService.getAnnouncementById(Number(id));
      setAnnouncement(data); 
      
      // ดึงข้อมูล attachments
      try {
        const attachmentsData = await AnnouncementService.getAttachmentsByAnnouncementId(Number(id));
        console.log('Attachments data:', attachmentsData);
        setAttachments(attachmentsData);
      } catch (attachError) {
        console.log('No attachments found or error fetching attachments');
        setAttachments([]);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch announcement:', error);
      alert('ไม่สามารถโหลดข้อมูลประกาศได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAuthorName = () => {
    if (announcement?.user) {
      return `${announcement.user.first_name_th} ${announcement.user.last_name_th}`;
    }
    return 'Student';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FileText className="text-red-500" size={20} />;
    if (['xlsx', 'xls'].includes(extension || '')) return <File className="text-green-500" size={20} />;
    if (['doc', 'docx'].includes(extension || '')) return <File className="text-blue-500" size={20} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return <ImageIcon className="text-purple-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'PDF Document';
    if (['xlsx', 'xls'].includes(extension || '')) return 'Excel Spreadsheet';
    if (['doc', 'docx'].includes(extension || '')) return 'Word Document';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'Image';
    return 'File';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileUrl = (filePath: string) => {
    // ถ้า filePath มี http อยู่แล้วให้ใช้เลย
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // ถ้าไม่มี ให้เพิ่ม base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // ตรวจสอบว่า filePath ขึ้นต้นด้วย / หรือไม่
    const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    return `${baseUrl}${path}`;
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const fileUrl = getFileUrl(attachment.file_path);
      console.log('Downloading from:', fileUrl);
      
      // ใช้ fetch เพื่อดาวน์โหลดไฟล์
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleViewFile = (attachment: Attachment) => {
    const fileUrl = getFileUrl(attachment.file_path);
    console.log('Opening file:', fileUrl);
    window.open(fileUrl, '_blank');
  };

  const handleImageClick = (filePath: string) => {
    const imageUrl = getFileUrl(filePath);
    setPreviewImage(imageUrl);
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบประกาศ</h2>
          <p className="text-gray-600 mb-4">ประกาศที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่</p>
          <button 
            onClick={() => router.push('/student/announcements')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            กลับไปหน้าประกาศ
          </button>
        </div>
      </div>
    );
  }

  // แยกไฟล์ที่เป็นรูปภาพและไฟล์เอกสาร
  const imageAttachments = attachments.filter(att => isImageFile(att.file_name));
  const documentAttachments = attachments.filter(att => !isImageFile(att.file_name));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>
          <img 
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-4xl  px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-left gap-2 text-gray-600 hover:text-gray-900 mb-4 "
          >
            <ArrowLeftIcon size={20} />
            Back to Announcements
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full mb-3">
                  {announcement.cetagory?.cetagory_name || 'ทั่วไป'}
                </div>
                <span className="text-sm text-gray-500 ml-3">
                  Published on {formatDate(announcement.published_at || announcement.scheduled_publish_at)}
                </span>
              </div>
              {announcement.is_pinned && (
                <Pin size={20} className="text-orange-600" fill="currentColor" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {announcement.title}
            </h1>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="prose max-w-none">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>

            {/* Display Images if available */}
            {imageAttachments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">รูปภาพประกอบ</h3>
                <div className="grid grid-cols-2 gap-4">
                  {imageAttachments.map((attachment) => {
                    const imageUrl = getFileUrl(attachment.file_path);
                    return (
                      <div 
                        key={attachment.ID} 
                        className="rounded-lg overflow-hidden bg-gray-100 aspect-video relative group cursor-pointer"
                        onClick={() => handleImageClick(attachment.file_path)}
                      >
                        <img 
                          src={imageUrl}
                          alt={attachment.file_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image load error:', imageUrl);
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {documentAttachments.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ไฟล์เอกสาร</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentAttachments.map((attachment) => (
                  <div 
                    key={attachment.ID}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                          attachment.file_name.endsWith('.pdf') ? 'bg-red-50' :
                          attachment.file_name.endsWith('.xlsx') || attachment.file_name.endsWith('.xls') ? 'bg-green-50' :
                          'bg-blue-50'
                        }`}>
                          {getFileIcon(attachment.file_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {attachment.file_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(attachment.file_size)} - {getFileType(attachment.file_name)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button 
                          onClick={() => handleViewFile(attachment)}
                          className="p-2 rounded hover:bg-white group-hover:text-orange-600 transition-colors"
                          title="ดูไฟล์"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownload(attachment)}
                          className="p-2 rounded hover:bg-white group-hover:text-orange-600 transition-colors"
                          title="ดาวน์โหลด"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Attachments Message */}
          {attachments.length === 0 && (
            <div className="px-8 py-6 border-t border-gray-200">
              <p className="text-gray-500 text-center">ไม่มีไฟล์แนบ</p>
            </div>
          )}

          {/* Footer Info */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Posted by {getAuthorName()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Last updated: {formatDate(announcement.UpdatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;