"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  loginService,
  registerService,
  RegisterPayload,
} from "@/services/auth";
import { Lock, Mail, ArrowRight, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./login.module.css";

export default function AuthPage() {
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regData, setRegData] = useState({
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleMode = (mode: boolean) => {
    setError("");
    setSuccess("");
    setIsLoginMode(mode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await loginService(loginEmail, loginPassword);
      const user = res.user as any;
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(user));

      const needsOnboarding = !user?.profile_completed || !user?.pdpa_consent;

      if (user.type_id === 1) {
        if (needsOnboarding) {
          router.push("/student/onboarding");
        } else {
          router.push("/student");
        }
      } else if (user.type_id === 2) {
        router.push("/teacher");
      } else if (user.type_id === 3) {
        router.push("/admin");
      } else {
        setError("ไม่พบสิทธิ์การใช้งาน");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (regData.password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setIsLoading(false);
      return;
    }

    try {
      const payload: RegisterPayload = {
        email: regData.email.trim(),
        password: regData.password,
        type_id: 1, // Default to student
      };

      await registerService(payload);
      
      setSuccess("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      setIsLoginMode(true); 
      
      setRegData({ email: "", password: "" });
      setConfirmPassword("");

    } catch (err: any) {
      setError(err.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <div
          className={`relative hidden lg:flex lg:flex-[0_0_54%] overflow-hidden ${styles.leftPanel}`}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center ${styles.leftPanelBg}`}
          />
          <div className="absolute inset-0 bg-[#e66a0a]/78" />
          <div className="relative z-10 flex flex-col justify-center px-16 py-14 text-white drop-shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
            <p className="text-4xl font-semibold">Welcome to</p>
            <h1 className="mt-4 text-7xl font-black tracking-tight">SUTPORTFOLIO</h1>
            <p className="mt-8 text-xl leading-relaxed text-white/90 max-w-2xl">
              ระบบจัดการ Portfolio สำหรับนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี
            </p>
          </div>
        </div>
        <div className="relative w-full lg:w-[42%] flex items-center justify-center px-6 py-12 lg:px-12">
          <div
            className={`absolute top-0 left-0 w-full h-36 bg-gradient-to-r from-[#f97316] to-[#f97316] lg:hidden ${styles.mobileHeader}`}
          />
          <div className="w-full max-w-lg relative z-10">
            <div className="lg:hidden text-center mb-8 pt-12">
              <h3 className="text-2xl font-semibold text-gray-800">
                Welcome to <span className="text-[#e66a0a]">SUTPORTFOLIO</span>
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                ระบบจัดการ Portfolio สำหรับนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-orange-100 shadow-[0_18px_45px_rgba(0,0,0,0.1)] px-8 py-10">
              <AnimatePresence mode="wait" initial={false}>
                {isLoginMode ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับ</h2>
                      <p className="mt-2 text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
                    </div>

                    {success && (
                      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-center">
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                        {error}
                      </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLogin}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">อีเมล</label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                            <input
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                              placeholder="student@example.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">รหัสผ่าน</label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                            <input
                              type="password"
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                              placeholder="••••••••"
                            />
                          </div>
                          <div className="text-right mt-2">
                            <Link href="/forgot-password" className="text-sm text-[#e66a0a] hover:underline">
                              ลืมรหัสผ่าน?
                            </Link>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full items-center justify-center rounded-xl bg-[#f97316] px-4 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.3)] hover:bg-[#f86805] transition disabled:opacity-70"
                      >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                        {!isLoading && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                      </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                      ยังไม่มีบัญชีผู้ใช้ใหม่?{" "}
                      <button
                        type="button"
                        onClick={() => toggleMode(false)}
                        className="font-semibold text-[#e66a0a] hover:underline"
                      >
                        สมัครสมาชิกที่นี่
                      </button>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-800">สร้างบัญชีใหม่</h2>
                      <p className="mt-2 text-sm text-gray-500">ลงทะเบียนเพื่อเริ่มใช้งาน MySE Platform</p>
                    </div>

                    {error && (
                      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                        {error}
                      </div>
                    )}

                    <form className="space-y-5" onSubmit={handleRegister}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">อีเมล</label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                            <input
                              type="email"
                              required
                              value={regData.email}
                              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                              className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                              placeholder="student@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700">รหัสผ่าน</label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={regData.password}
                              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                              className="w-full h-12 rounded-xl border border-orange-100 bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-[#e66a0a] focus:ring-2 focus:ring-orange-100 transition"
                              placeholder="•••••••• (ขั้นต่ำ 6 ตัวอักษร)"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700">ยืนยันรหัสผ่าน</label>
                          <div className="relative mt-2">
                            <Check className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e66a0a]" />
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`w-full h-12 rounded-xl border bg-orange-50/40 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 transition ${
                                confirmPassword && regData.password !== confirmPassword
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                  : "border-orange-100 focus:border-[#e66a0a] focus:ring-orange-100"
                              }`}
                              placeholder="กรอกรหัสผ่านอีกครั้ง"
                            />
                          </div>
                          {confirmPassword && regData.password !== confirmPassword && (
                            <p className="mt-2 text-xs font-medium text-red-600">รหัสผ่านไม่ตรงกัน</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full items-center justify-center rounded-xl bg-[#16a34a] px-4 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(22,163,74,0.25)] hover:bg-[#0f9c42] transition disabled:opacity-70"
                      >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                      </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                      มีบัญชีอยู่แล้ว?{" "}
                      <button
                        type="button"
                        onClick={() => toggleMode(true)}
                        className="font-semibold text-[#e66a0a] hover:underline"
                      >
                        กลับไปเข้าสู่ระบบ
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
