// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, } from "next/navigation";
import { Menu, User, LogOut, ChevronUp } from "lucide-react"; // import แค่อันที่ใช้ใน UI
import { menuItems, type UserRole } from "./menu"; // Import ข้อมูลเข้ามา
import { menu } from "framer-motion/client";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
  userRole: string;
  userName: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const profileLinkByRole: Record<string, string | undefined> = {
  student: "/student/profile",
  teacher: "/teacher/profile",
  admin:   "/admin/profile"

};
export default function Sidebar({userRole, userName, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentRole = userRole as UserRole;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const profileHref = profileLinkByRole[userRole];

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };
  

  return (
    <aside 
    // className="flex h-screen w-64 flex-col  bg-white text-gray-900 shadow-md rounded-r-3xl"
    className={`flex h-screen flex-col bg-white text-gray-900 shadow-md transition-all duration-200 ease-in-out ${
      isOpen ? "w-64 overflow-hidden" : "w-16 overflow-visible"
    } rounded-r-3xl`}
    >

    {/* Header */}
      <div className={`flex h-16 items-center px-5 transition-all duration-200 ${
        isOpen ? "justify-between px-5" : "justify-center px-4"
      }`}>
        <h1
          className={`text-2xl font-bold text-orange-500 transition-all duration-200 ${
            isOpen ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-5 overflow-hidden"
          }white-space-nowrap`}> 
            SUT Portfolio
        </h1>
        {/* {isOpen && <h1 className="text-xl font-bold text-orange-500 ">MyPortfolio</h1>} */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="rounded-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-white transition-colors p-1 z-10"
        >
          <Menu className="h-6 w-6 text-gray-400" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 px-3 py-4">
        {/* วนลูปจากตัวแปรที่ Import เข้ามาแทน */}
        {menuItems.map((item) => {
          // Logic ตรวจสอบสิทธิ์ยังคงอยู่ที่นี่ (หรือย้ายไปเป็น Utility function ก็ได้)
          if (!item.roles.includes(currentRole)) return null;
          //path home ของแต่ละ role
          const roleHomePaths = ["/admin", "/teacher", "/student"];
          // const isActive = pathname === item.href;
          const isActive = roleHomePaths.includes(item.href)
          ? pathname === item.href // ถ้าเป็นหน้าหลักของ Role ใดๆ ต้องตรงกันเป๊ะๆ
          : pathname.startsWith(item.href); // ถ้าเป็นเมนูอื่นๆ ให้เช็คแบบเริ่มต้นด้วย (Sub-path)


          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-3 text-lg font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:bg-orange-100 hover:text-orange-600"
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-orange-600"
                }`}
              />
              <span className={`ml-3 transition-all duration-200 ${
                isOpen 
                  ? "opacity-100 w-auto" 
                  : "opacity-0 w-0 overflow-hidden"}`}>
                    {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section at Bottom */}
      <div className="mt-auto border-t border-gray-200" ref={profileRef}>
        <div className="relative">
          {/* Profile Menu Popup */}
          {profileMenuOpen && (
            <div className={`absolute rounded-xl border border-orange-100 bg-white shadow-lg z-[60] ${
              isOpen 
                ? "bottom-full mb-2 left-3 right-3" 
                : "left-full ml-2 bottom-0 w-48"
            }`}>
              {profileHref && userRole === "student" && (
                <Link
                  href={profileHref}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50 rounded-t-xl"
                >
                  <User className="h-4 w-4 text-orange-600" />
                  ข้อมูลส่วนตัว
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-b-xl"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          )}

          {/* Profile Button */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-label={profileMenuOpen ? "Close profile menu" : "Open profile menu"}
            title={profileMenuOpen ? "Close profile menu" : "Open profile menu"}
            className={`flex w-full items-center gap-3 p-4 hover:bg-orange-50 transition-colors ${
              isOpen ? "justify-start" : "justify-center"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 flex-shrink-0">
              <User className="h-5 w-5 text-orange-600" aria-hidden="true" />
            </div>
            {isOpen && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
                  <div className="text-xs font-light text-orange-600 uppercase">{userRole}</div>
                </div>
                <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform ${
                  profileMenuOpen ? "rotate-180" : ""
                }`} />
              </>
            )}
          </button>
        </div>
      </div>

    </aside>
  );
}
