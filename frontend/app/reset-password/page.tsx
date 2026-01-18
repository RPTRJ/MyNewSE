"use client";

import { useState, useEffect, Suspense } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("ลิงค์ไม่ถูกต้องหรือหมดอายุแล้ว");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setIsSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">รีเซ็ตรหัสผ่านสำเร็จ!</h2>
          <p className="text-gray-600 mb-6">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
            <br />
            <span className="text-sm text-gray-500">กำลังนำคุณไปหน้าเข้าสู่ระบบ...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {token ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#e66a0a]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งรหัสผ่านใหม่</h1>
              <p className="text-gray-600">กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="reset-new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                  <input
                    id="reset-new-password"
                    name="reset-new-password"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                    placeholder="•••••••• (ขั้นต่ำ 6 ตัวอักษร)"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                  <input
                    id="reset-confirm-password"
                    name="reset-confirm-password"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full h-12 rounded-xl border bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 transition ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-orange-100 focus:border-[#e66a0a] focus:ring-orange-100"
                    }`}
                    placeholder="•••••••• (ยืนยันรหัสผ่าน)"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full bg-[#e66a0a] text-white py-3 rounded-xl font-semibold hover:bg-[#d45f09] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "กำลังรีเซ็ตรหัสผ่าน..." : "ยืนยันรหัสผ่านใหม่"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ลิงค์ไม่ถูกต้อง</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/forgot-password"
              className="inline-block bg-[#e66a0a] text-white px-6 py-3 rounded-xl hover:bg-[#d45f09] transition"
            >
              ขอลิงค์รีเซ็ตใหม่
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#e66a0a] hover:underline text-sm">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}