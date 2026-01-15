"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

interface TopbarProps {
  userRole: string;
  userName: string;
}

const profileLinkByRole: Record<string, string | undefined> = {
  student: "/student/profile",
};

export default function Topbar({ userRole, userName }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const profileHref = profileLinkByRole[userRole];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  return (
    <header className="flex h-20 items-center justify-between px-4 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center justify-between bg-white px-6 shadow-md rounded-3xl mt-2 ">
        <div className="text-lg font-semibold text-orange-700">Application</div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs font-light text-orange-600 uppercase">{userRole}</div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200">
                <User className="h-5 w-5" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-orange-100 bg-white shadow-lg">
                {profileHref && (
                  <Link
                    href={profileHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50"
                  >
                    <User className="h-4 w-4 text-orange-600" />
                    ข้อมูลส่วนตัว
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
