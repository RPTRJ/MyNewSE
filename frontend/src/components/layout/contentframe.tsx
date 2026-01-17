"use client";

export default function ContentFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className=" rounded-lg shadow-lg bg-white h-full overflow-auto no-arrow">
            {children}
        </div>
    );
}
