import { useEffect, useState } from 'react';
// import { designService, ColorTheme, FontTheme } from '@/
import { designService } from '@/services/designPortfolio';
import { ColorTheme, FontTheme } from '@/src/interfaces/design';

// รับ props เป็น function เพื่อส่งค่าที่เลือกกลับไปที่หน้าหลัก
interface SidebarProps {
  onThemeSelect: (theme: ColorTheme) => void;
  onFontSelect: (font: FontTheme) => void;
}

export default function EditorSidebar({ onThemeSelect, onFontSelect }: SidebarProps) {
  const [colors, setColors] = useState<ColorTheme[]>([]);
  const [fonts, setFonts] = useState<FontTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลเมื่อ Component โหลด
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colorsData, fontsData] = await Promise.all([
          designService.getColors(),
          designService.getFonts()
        ]);
        setColors(colorsData);
        setFonts(fontsData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading tools...</div>;

  return (
    <aside className="bg-white h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="font-bold text-lg">Design Tools</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* --- Section: Colors --- */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">Color Themes</label>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((theme) => (
              <button
                key={theme.ID}
                onClick={() => onThemeSelect(theme)}
                className="group relative w-10 h-10 rounded-full border-2 border-transparent shadow-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
                style={{ backgroundColor: theme.primary_color }}
                title={theme.colors_name}
              >
                 {/* Tooltip เล็กๆ หรือ Checkmark เมื่อเลือก */}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* --- Section: Fonts --- */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">Typography</label>
          <div className="space-y-2">
            {fonts.map((font) => (
              <button
                key={font.ID}
                onClick={() => onFontSelect(font)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-all text-left"
              >
                <span className="text-sm text-gray-700">{font.font_name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Aa</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}