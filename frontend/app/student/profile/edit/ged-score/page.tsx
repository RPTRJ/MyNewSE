"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HttpError, ProfileResponse, fetchMyProfile, upsertGEDScore } from "@/services/profile";
import { uploadFile } from "@/services/upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EditGEDScorePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    total_score: "",
    rla_score: "",
    math_score: "",
    science_score: "",
    social_score: "",
    cert_file_path: "",
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((profile: ProfileResponse) => {
        const ged = profile.ged_score;
        if (ged) {
          setForm({
            total_score: ged.total_score !== undefined && ged.total_score !== null ? String(ged.total_score) : "",
            rla_score: ged.rla_score !== undefined && ged.rla_score !== null ? String(ged.rla_score) : "",
            math_score: ged.math_score !== undefined && ged.math_score !== null ? String(ged.math_score) : "",
            science_score:
              ged.science_score !== undefined && ged.science_score !== null ? String(ged.science_score) : "",
            social_score: ged.social_score !== undefined && ged.social_score !== null ? String(ged.social_score) : "",
            cert_file_path: ged.cert_file_path || "",
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const parseNumber = (value: string) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const handleCertFileChange = (file: File | null) => {
    if (!file) {
      setCertFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`ขนาดไฟล์ต้องไม่เกิน 5MB (ไฟล์ที่เลือก: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setCertFile(file);
    toast.success(`เลือกไฟล์: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setCertFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let certPath = form.cert_file_path.trim() || undefined;

      if (certFile) {
        if (certFile.size > MAX_FILE_SIZE) {
          throw new Error(`ขนาดไฟล์ต้องไม่เกิน 5MB (ไฟล์ที่เลือก: ${(certFile.size / 1024 / 1024).toFixed(2)}MB)`);
        }
        if (certFile.type !== "application/pdf") {
          throw new Error("รองรับเฉพาะไฟล์ PDF เท่านั้น");
        }
        setUploading(true);
        certPath = await uploadFile(certFile);
        setUploading(false);
      }

      await upsertGEDScore(token, {
        total_score: parseNumber(form.total_score),
        rla_score: parseNumber(form.rla_score),
        math_score: parseNumber(form.math_score),
        science_score: parseNumber(form.science_score),
        social_score: parseNumber(form.social_score),
        cert_file_path: certPath,
      });
      toast.success("บันทึกข้อมูลสำเร็จ");
      router.replace("/student/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนน GED ได้";
      setError(message);
      toast.error(message);
      setUploading(false);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">แก้ไขคะแนน GED</h1>
              <p className="mt-1 text-orange-100 text-sm">คะแนนสอบ GED ของคุณ</p>
            </div>
          </div>

          {error ? (
            <div className="mx-6 mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          ) : null}

          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
            {/* Score Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">คะแนนสอบ</h2>
                <p className="text-sm text-gray-500 mt-1">กรอกคะแนนแต่ละวิชา</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ged_total_score" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      คะแนนรวม
                    </span>
                  </label>
                  <input
                    id="ged_total_score"
                    type="number"
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                    value={form.total_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, total_score: e.target.value }))}
                    placeholder="เช่น 660"
                  />
                </div>
                <div>
                  <label htmlFor="ged_rla_score" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Reasoning (RLA)
                    </span>
                  </label>
                  <input
                    id="ged_rla_score"
                    type="number"
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                    value={form.rla_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, rla_score: e.target.value }))}
                    placeholder="คะแนน RLA"
                  />
                </div>
                <div>
                  <label htmlFor="ged_math_score" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Math
                    </span>
                  </label>
                  <input
                    id="ged_math_score"
                    type="number"
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                    value={form.math_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, math_score: e.target.value }))}
                    placeholder="คะแนน Math"
                  />
                </div>
                <div>
                  <label htmlFor="ged_science_score" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Science
                    </span>
                  </label>
                  <input
                    id="ged_science_score"
                    type="number"
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                    value={form.science_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, science_score: e.target.value }))}
                    placeholder="คะแนน Science"
                  />
                </div>
                <div>
                  <label htmlFor="ged_social_score" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Social Studies
                    </span>
                  </label>
                  <input
                    id="ged_social_score"
                    type="number"
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                    value={form.social_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, social_score: e.target.value }))}
                    placeholder="คะแนน Social"
                  />
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">เอกสารประกอบ</h2>
                <p className="text-sm text-gray-500 mt-1">อัพโหลดใบรับรองผลคะแนน</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัพโหลดไฟล์ใบรับรอง (PDF เท่านั้น)
                </label>
                
                {/* Custom File Upload */}
                <div className="space-y-3">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    id="ged_cert_file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleCertFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    title="เลือกไฟล์ใบรับรอง GED"
                    aria-label="เลือกไฟล์ใบรับรอง GED"
                  />
                  
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 text-gray-600 hover:text-orange-600 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    เลือกไฟล์
                  </button>
                  
                  <p className="text-xs text-gray-500">รองรับเฉพาะไฟล์ PDF (ขนาดไม่เกิน 5MB)</p>

                  {/* Uploading state */}
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-4 py-3 rounded-xl">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังอัพโหลด...
                    </div>
                  )}

                  {/* New file selected */}
                  {certFile && !uploading && (
                    <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{certFile.name}</span>
                        <span className="text-xs text-green-600">({(certFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="ลบไฟล์"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Existing file link */}
                  {!certFile && form.cert_file_path && (
                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl">
                      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">มีไฟล์อัพโหลดแล้ว</p>
                        <a
                          href={form.cert_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          คลิกเพื่อดูใบรับรอง GED
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/student/profile")}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : uploading ? "กำลังอัพโหลด..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}