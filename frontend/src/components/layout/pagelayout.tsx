"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./sidebar"; // Import แบบ relative file path
import Topbar from "./topbar";
import ContentFrame from "./contentframe";
import Link from "next/link";


interface PageLayoutProps {
  children: ReactNode;
  userRole: string;
  userName: string;
}

export default function PageLayout({ children, userRole, userName, }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarWrapperClass = sidebarOpen
    ? "fixed top-0 left-0 h-screen w-64 z-40 transition-all duration-200"
    : "fixed top-0 left-0 h-screen w-16 z-40 transition-all duration-200";

  const mainClass = `${sidebarOpen ? "ml-64" : "ml-16"} p-4 transition-all duration-200  h-[calc(100vh-0rem)] `;
  return (

    <div className="min-h-screen bg-orange-50 relative">
      {/* Sidebar fixed ทางซ้าย */}
      <div className={sidebarWrapperClass}>
        <Sidebar userRole={userRole} userName={userName} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* Main content: มี margin-left เท่ากับความกว้าง sidebar และ padding-top เท่าความสูง topbar */}
      <main className={mainClass} >
        <ContentFrame>
        {children}
        </ContentFrame>
      </main>
    </div>
  );
}
