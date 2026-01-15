"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageLayout from "@/src/components/layout/pagelayout";
import NotificationSocket from "@/components/NotificationPoller";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type MeUser = {
  id: number;
  type_id: number;
  first_name_th?: string;
  first_name_en?: string;
  last_name_th?: string;
  last_name_en?: string;
  profile_completed?: boolean;
  pdpa_consent?: boolean;
};

type MeResponse = {
  data?: MeUser;
  error?: string;
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
      return;
    }

    const checkAccess = async () => {
      try {
        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: MeResponse = await res.json();

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const user = data.data;
        const isOnboardingPage = pathname?.startsWith("/student/onboarding");

        if (!user || user.type_id !== 1) {
          alert("No permission");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const completed = !!(user.profile_completed && user.pdpa_consent);
        localStorage.setItem("user", JSON.stringify(user));

        const name = user.first_name_th || user.first_name_en || "Student";
        setUserName(name);

        if (!completed && !isOnboardingPage) {
          router.replace("/student/onboarding");
          return;
        }

        if (completed && isOnboardingPage) {
          router.replace("/student/home");
          return;
        }

        if (completed && pathname === "/student") {
          router.replace("/student/home");
          return;
        }

        setReady(true);
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
      }
    };

    checkAccess();
  }, [router, pathname]);

  if (!ready) {
    return null;
  }

  // Onboarding page: render without sidebar/topbar
  if (pathname?.startsWith("/student/onboarding")) {
    return <div className="min-h-screen bg-[#f6f8fb] p-6">{children}</div>;
  }

  return (
    <PageLayout userRole="student" userName={userName}>
      <NotificationSocket />
      {children}
    </PageLayout>
  );
}