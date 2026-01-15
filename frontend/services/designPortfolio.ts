import { ColorTheme, FontTheme } from '@/src/interfaces/design';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const designService = {
  // 1. ฟังก์ชันดึงสี
  getColors: async (): Promise<ColorTheme[]> => {
    try {
      // ใช้ fetch แทน axios.get
      const res = await fetch(`${API_URL}/colors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // cache: 'no-store' // ใส่บรรทัดนี้ถ้าอยากให้ดึงข้อมูลใหม่สดๆ ทุกครั้ง (ไม่จำค่าเก่า)
      });

      if (!res.ok) {
        throw new Error('Failed to fetch colors');
      }

      const jsonData = await res.json();
      return jsonData.data; // เข้าถึง key "data" ตาม JSON ที่คุณให้มา

    } catch (error) {
      console.error("Error fetching colors:", error);
      return [];
    }
  },

  // 2. ฟังก์ชันดึงฟอนต์
  getFonts: async (): Promise<FontTheme[]> => {
    try {
      const res = await fetch(`${API_URL}/fonts`, {
         method: 'GET'
      });

      if (!res.ok) {
        throw new Error('Failed to fetch fonts');
      }

      const jsonData = await res.json();
      return jsonData.data;
    } catch (error) {
      console.error("Error fetching fonts:", error);
      return [];
    }
  }
};