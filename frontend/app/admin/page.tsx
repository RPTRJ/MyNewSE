"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (user.type_id !== 3) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setIsAuthorized(true);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div style={{ padding: '50px' }}>
      
      <h1>ยินดีต้อนรับ: เข้ามาหน้านี้ด้วยสิทธิ์ "แอดมิน" (Admin)</h1>
      <p>เนื้อหาสำหรับผู้ดูแลระบบเท่านั้น...</p>
    </div>
  );
}
