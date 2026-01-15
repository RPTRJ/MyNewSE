import PageLayout from "@/src/components/layout/pagelayout";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    // ดึง user role จาก localStorage หรือ session
    const user = {
        name: "Teacher Name",
        role: "teacher"
    };

    return (
        <PageLayout userRole={user.role} userName={user.name}>
            {children}
        </PageLayout>
    );
}