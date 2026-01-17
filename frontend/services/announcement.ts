// services/announcement.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==================== Interfaces ====================

export interface User {
  ID: number;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  profile_image_url?: string;
}

// ---------- Announcement ----------

export interface Announcement {
  attachments: number;
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  title: string;
  content: string;
  is_pinned: boolean;
  scheduled_publish_at: string;
  published_at?: string;
  expires_at?: string | null;
  send_notification: boolean;

  cetagory?: {
    ID: number;
    cetagory_name: string;
  };

  user?: User;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  is_pinned: boolean;
  scheduled_publish_at: string;
  expires_at?: string | null;
  send_notification: boolean;
  cetagory_id: number;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  is_pinned?: boolean;
  scheduled_publish_at?: string;
  expires_at?: string | null;
  send_notification?: boolean;
  cetagory_id?: number;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

// ---------- Category ----------

export interface Cetagory {
  ID?: number;
  cetagory_name: string;
}

// ---------- Attachment ----------

export interface Attachment {
  ID?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at?: string;

  announcement_id: number;
  cetagory_id?: number;

  announcement?: Announcement;
  cetagory?: Cetagory;
}

// ---------- Admin Log ----------

export interface AdminLog {
  ID?: number;
  action_type: string;
  action_at?: string;

  user_id?: number;           
  announcement_id?: number;   

  user?: User;
  announcement?: Announcement;
}

// ---------- Notification ----------

export interface Notification {
  ID?: number;
  notification_title: string;
  notification_type: string;
  notification_message: string;

  is_read: boolean;
  read_at?: string;
  sent_at?: string;

  announcement_id: number;

  user?: User;
  announcement?: Announcement;
}

// ==================== Service ====================

class AnnouncementService {
  deleteAttachment(attachmentId: number) {
    return fetch(`${API_URL}/attachments/${attachmentId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    }).then(res => {
      if (!res.ok) throw new Error("Failed to delete attachment");
      return res.json();
    });
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // ===================== Announcement =====================

  async createAnnouncement(
    data: CreateAnnouncementPayload
  ): Promise<Announcement> {
    const response = await fetch(`${API_URL}/admin/announcements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create announcement: ${errorText}`);
    }

    return response.json();
  }

  async getAdminAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${API_URL}/admin/announcements`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    return response.json();
  }

  async getStudentAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${API_URL}/student/announcements`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch student announcements");
    }

    return response.json();
  }

  async getTeacherAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${API_URL}/teacher/announcements`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch teacher announcements");
    }

    return response.json();
  }

  async getAnnouncementById(id: number): Promise<Announcement> {
    const response = await fetch(`${API_URL}/announcements/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcement');
    }

    return response.json();
  }

  async updateAnnouncement(
    id: number,
    data: UpdateAnnouncementPayload
  ): Promise<Announcement> {
    const response = await fetch(`${API_URL}/admin/announcements/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update announcement: ${errorText}`);
    }

    return response.json();
  }

  async deleteAnnouncement(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete announcement');
    }
  }

  // ===================== Category =====================

  async createCategory(data: Cetagory): Promise<Cetagory> {
    const response = await fetch(`${API_URL}/cetagories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create category');
    }

    return response.json();
  }

  async getCategories(): Promise<Cetagory[]> {
    const response = await fetch(`${API_URL}/cetagories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  // ===================== Attachment =====================

  async createAttachment(data: {
    file_name: string;
    file_path: string;
    announcement_id: number;
    cetagory_id: number;
  }) {
    const response = await fetch(`${API_URL}/attachments`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return response.json();
  }

  
  async getAttachmentsByAnnouncementId(announcementId: number): Promise<Attachment[]> {
    const response = await fetch(`${API_URL}/attachments/announcement/${announcementId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attachments');
    }

    return response.json();
  }

  // ===================== Admin Log =====================

  async createAdminLog(data: Omit<AdminLog, 'user_id'>): Promise<AdminLog> {
    const response = await fetch(`${API_URL}/admin_logs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create admin log');
    }

    return response.json();
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    const response = await fetch(`${API_URL}/admin_logs`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin logs');
    }

    return response.json();
  }

  // ===================== Notification =====================

async createNotificationForStudents(data: {
  notification_title: string;
  notification_message: string;
  notification_type: string;
  announcement_id: number;
  is_read : boolean;
}) {
  const response = await fetch(`${API_URL}/notification/students`, {
    method: "POST",
    headers: this.getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Create notification error:", err);
    throw new Error(err);
  }

  return response.json();
}
async getMyNotifications(): Promise<Notification[]> {
  const response = await fetch(`${API_URL}/notification`, {
    method: "GET",
    headers: this.getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  const data = await response.json();

  // 🔥 map ชื่อ field จาก backend → frontend
  return data.map((n:any) => ({
    ID: n.ID,
    notification_title: n.Notification_Title,
    notification_message: n.Notification_Message,
    notification_type: n.Notification_Type,
    is_read: n.Is_Read,
    sent_at: n.Sent_At,
    announcement_id: n.AnnouncementID,
  }));
}




  // ===================== File Upload =====================

  async uploadFile(
  file: File,
  announcementId?: number
): Promise<{ file_path: string; file_name: string }> {
  const formData = new FormData();
  formData.append("file", file);

  if (announcementId) {
    formData.append("announcement_id", announcementId.toString());
  }

  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();

 
  return {
    file_path: data.file_path || data.path || data.url,
    file_name: file.name,
  };
}

}

export default new AnnouncementService();