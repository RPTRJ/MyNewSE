"use client";

import PageLayout from "@/src/components/layout/pagelayout";
import { useEffect, useState } from "react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const [userName, setUserName] = useState("Teacher");

    useEffect(() => {
        // ดึงข้อมูล user จาก localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                // ดึงชื่อภาษาไทยก่อน ถ้าไม่มีให้ใช้ภาษาอังกฤษ
                const name = userData.first_name_th || userData.first_name_en || userData.name || "Teacher";
                setUserName(name);
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
    }, []);

    return (
        <PageLayout userRole="teacher" userName={userName}>
            {children}
        </PageLayout>
    );
}