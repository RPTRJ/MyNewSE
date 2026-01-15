import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldAlert,
  Calendar,
  Search,
  GraduationCap,
  BookOpenCheck,
  Trophy,
  BriefcaseBusiness,
  LayoutList,
  // ไม่ต้องใช้ LogOut ที่นี่ เพราะ LogOut มักจะเป็นปุ่มแยกต่างหาก
} from "lucide-react";
import React from 'react';

export type UserRole = "admin" | "teacher" | "student";

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export const menuItems: MenuItem[] = [
  {
    name: "หน้าหลัก",
    href: "/student/home",
    icon: LayoutDashboard,
    roles: ["student"],
  },
  {
    name: "หน้าหลัก",
    href: "/teacher",
    icon: LayoutDashboard,
    roles: ["teacher"],
  },
  {
    name: "ข้อมูลนักเรียน",
    href: "/teacher/students",
    icon: Users,
    roles: ["teacher"],
  },
  {
    name: "หน้าหลัก (Admin)",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    name: "โปรไฟล์ผู้ใช้",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "ค้นหาหลักสูตร",
    href: "/student/curricula",
    icon: Search,
    roles: ["student"],
  },
  {
    name: "จัดการหลักสูตร",
    href: "/admin/curricula",
    icon: Search,
    roles: ["admin"],
  },
  {
    name: "ข้อมูลการศึกษา",
    href: "/admin/education",
    icon: GraduationCap,
    roles: ["admin"],
  },
  {
    name: "คลังผลงาน",
    href: "/student/working", 
    icon: BriefcaseBusiness,
    roles: ["student"], // เฉพาะนักเรียน
  },
  {
    name: "คลังกิจกรรม",
    href: "/student/activity",
    icon: Trophy,
    roles: ["student"],
  },
  {
    name: "แฟ้มสะสมผลงาน",
    href: "/student/portfolio",
    icon: FileText,
    roles: ["student"],
  },
  {
    name: "ตรวจสอบ Portfolios",
    href: "/teacher/checkportfolio",
    icon: FileText,
    roles: ["teacher"],
  },
  {
    name: "กลุ่มวิชาและทักษะ",
    href: "/teacher/course-groups",
    icon: BookOpenCheck,
    roles: ["teacher"],
  },
  {
    name: "คำแนะนำหลักสูตร",
    href: "/teacher/curricula",
    icon: GraduationCap,
    roles: ["teacher"],
  },
  {
    name: "Template",
    href: "/admin/template",
    icon: LayoutList,
    roles: ["admin"],
  },
  {
    name: "ประกาศ/ข่าวสาร",
    href: "/student/announcements",
    icon: ShieldAlert,
    roles: ["student"],
  },
  {
    name: "ประชาสัมพันธ์ข่าวสาร",
    href: "/admin/announcements",
    icon: ShieldAlert,
    roles: ["admin"],
  },
  {
    name: "ประชาสัมพันธ์ข่าวสาร",
    href: "/teacher/announcements",
    icon: ShieldAlert,
    roles: ["teacher"],
  },
  {
    name: "ปฏิทิน",
    href: "/student/calendar",
    icon: Calendar,
    roles: ["student"],
  },
];