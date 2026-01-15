import PageLayout from "@/src/components/layout/pagelayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // ดึง user role จาก localStorage หรือ session
    const user = {
        name: "Admin Name",
        role: "admin"
    };
    return (
        <PageLayout userRole={user.role} userName={user.name}>
            {children}
        </PageLayout>
    );
}