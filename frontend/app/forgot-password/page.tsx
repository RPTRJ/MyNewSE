"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        //Handle rate limiting (429)
        if (response.status === 429) {
          throw new Error("คุณส่งคำขอบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง");
        }
        
        //Handle other rate limit errors
        if (data.error?.includes("too many")) {
          throw new Error("คุณส่งคำขอรีเซ็ตรหัสผ่านหลายครั้งเกินไป กรุณารอ 15 นาที");
        }
        
        throw new Error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
};

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ตรวจสอบอีเมลของคุณ</h2>
          <p className="text-gray-600 mb-6">
            หากอีเมลที่ระบุมีอยู่ในระบบ เราได้ส่งลิงค์รีเซ็ตรหัสผ่านไปแล้ว
            <br />
            <span className="text-sm text-gray-500">(กรุณาตรวจสอบทั้งในกล่องจดหมายหลักและ Spam)</span>
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#e66a0a] text-white px-6 py-3 rounded-xl hover:bg-[#d45f09] transition"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#e66a0a] transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">ลืมรหัสผ่าน?</h1>
        <p className="text-gray-600 mb-6">
          กรอกอีเมลที่คุณใช้ลงทะเบียน เราจะส่งลิงค์สำหรับรีเซ็ตรหัสผ่านให้
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                placeholder="student@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#e66a0a] text-white py-3 rounded-xl font-semibold hover:bg-[#d45f09] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "กำลังส่ง..." : "ส่งลิงค์รีเซ็ตรหัสผ่าน"}
          </button>
        </form>
      </div>
    </div>
  );
}