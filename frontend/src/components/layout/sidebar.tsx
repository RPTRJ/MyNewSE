// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react"; // import แค่อันที่ใช้ใน UI
import { menuItems, type UserRole } from "./menu"; // Import ข้อมูลเข้ามา
import { menu } from "framer-motion/client";
import { useState } from "react";

interface SidebarProps {
  userRole: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function Sidebar({ userRole, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = userRole as UserRole;

  return (
    <aside 
    // className="flex h-screen w-64 flex-col  bg-white text-gray-900 shadow-md rounded-r-3xl"
    className={`flex h-screen flex-col bg-white text-gray-900 shadow-md  transition-all duration-200 ease-in-out ${
      isOpen ? "w-64" : "w-16"
    }  rounded-r-3xl overflow-hidden`}
    >

    {/* Header */}
      <div className={`flex h-16 items-center px-5 transition-all duration-200 ${
        isOpen ? "justify-between px-5" : "justify-center px-4"
      }`}>
        <h1
          className={`text-xl font-bold text-orange-500 transition-all duration-200 ${
            isOpen ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-5 overflow-hidden"
          }white-space-nowrap`}> 
            MyPortfolio
        </h1>
        {/* {isOpen && <h1 className="text-xl font-bold text-orange-500 ">MyPortfolio</h1>} */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-white transition-colors p-1 z-10"
        >
          <Menu className="h-6 w-6 text-gray-400" />
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

    </aside>
  );
}
