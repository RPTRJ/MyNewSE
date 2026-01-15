
export interface ColorTheme {
  ID: number;
  colors_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  hex_value: string; // สีตัวแทนสำหรับแสดงในปุ่ม
}

export interface FontTheme {
  ID: number;
  font_name: string;
  font_family: string; // ชื่อที่ใช้ใน CSS เช่น "Roboto, sans-serif"
  font_category: string;
  font_url: string;    // Link Google Fonts
}
