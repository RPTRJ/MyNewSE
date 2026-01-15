"use client";

export default function ContentFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className=" mt-10 rounded-lg shadow-lg bg-white h-full overflow-auto no-arrow">
            {children}
        </div>
    );
}
