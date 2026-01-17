import { useEffect, useState } from 'react';
// import { designService, ColorTheme, FontTheme } from '@/
import { designService } from '@/services/designPortfolio';
import { ColorTheme, FontTheme } from '@/src/interfaces/design';

// รับ props เป็น function เพื่อส่งค่าที่เลือกกลับไปที่หน้าหลัก
interface SidebarProps {
  onThemeSelect: (theme: ColorTheme) => void;
  onFontSelect: (font: FontTheme) => void;
  currentFont?: FontTheme | null;
  currentTheme?: ColorTheme | null;
}

export default function EditorSidebar({ onThemeSelect, onFontSelect, currentFont, currentTheme }: SidebarProps) {
  const [colors, setColors] = useState<ColorTheme[]>([]);
  const [fonts, setFonts] = useState<FontTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState<FontTheme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme | null>(null);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);

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

  // อัปเดต selectedFont เมื่อ currentFont เปลี่ยน
  useEffect(() => {
    if (currentFont) {
      setSelectedFont(currentFont);
    }
  }, [currentFont]);

  // อัปเดต selectedTheme เมื่อ currentTheme เปลี่ยน
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  const handleFontSelect = (font: FontTheme) => {
    setSelectedFont(font);
    setFontDropdownOpen(false);
    onFontSelect(font);
  };

  const handleThemeSelect = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    onThemeSelect(theme);
  };

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
                onClick={() => handleThemeSelect(theme)}
                className={`group relative w-10 h-10 rounded-full border-2 shadow-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all ${
                  selectedTheme?.ID === theme.ID ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'
                }`}
                style={{ backgroundColor: theme.primary_color }}
                title={theme.colors_name}
              >
                {/* Checkmark เมื่อเลือก */}
                {selectedTheme?.ID === theme.ID && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* --- Section: Fonts --- */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">Typography</label>
          <div className="relative">
            {/* Dropdown Button */}
            <button
              onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span 
                  className="text-sm font-medium text-gray-800"
                  style={{ fontFamily: selectedFont?.font_family || 'inherit' }}
                >
                  {selectedFont?.font_name || 'เลือกฟอนต์'}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {fontDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {fonts.map((font) => (
                  <button
                    key={font.ID}
                    onClick={() => handleFontSelect(font)}
                    className={`w-full flex items-center justify-between p-3 hover:bg-orange-50 transition-all text-left border-b border-gray-50 last:border-b-0 ${
                      selectedFont?.ID === font.ID ? 'bg-orange-50' : ''
                    }`}
                  >
                    <span 
                      className="text-sm text-gray-700"
                      style={{ fontFamily: font.font_family || 'inherit' }}
                    >
                      {font.font_name}
                    </span>
                    {selectedFont?.ID === font.ID && (
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}