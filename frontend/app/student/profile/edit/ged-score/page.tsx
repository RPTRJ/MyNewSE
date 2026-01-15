"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError, ProfileResponse, fetchMyProfile, upsertGEDScore } from "@/services/profile";
import { uploadFile } from "@/services/upload";

export default function EditGEDScorePage() {
  const router = useRouter();
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
    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      return;
    }
    setCertFile(file);
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
        if (certFile.size > 10 * 1024 * 1024) {
          throw new Error("ขนาดไฟล์ต้องไม่เกิน 10MB");
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
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกคะแนน GED ได้");
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
                คะแนนรวม
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
                Reasoning (RLA)
              </label>
              <input
                id="ged_rla_score"
                type="number"
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                value={form.rla_score}
                onChange={(e) => setForm((prev) => ({ ...prev, rla_score: e.target.value }))}
                />
              </div>
              <div>
              <label htmlFor="ged_math_score" className="block text-sm font-medium text-gray-700 mb-2">
                Math
              </label>
              <input
                id="ged_math_score"
                type="number"
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                value={form.math_score}
                onChange={(e) => setForm((prev) => ({ ...prev, math_score: e.target.value }))}
                />
              </div>
              <div>
              <label htmlFor="ged_science_score" className="block text-sm font-medium text-gray-700 mb-2">
                Science
              </label>
              <input
                id="ged_science_score"
                type="number"
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                value={form.science_score}
                onChange={(e) => setForm((prev) => ({ ...prev, science_score: e.target.value }))}
                />
              </div>
              <div>
              <label htmlFor="ged_social_score" className="block text-sm font-medium text-gray-700 mb-2">
                Social Studies
              </label>
              <input
                id="ged_social_score"
                type="number"
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                value={form.social_score}
                onChange={(e) => setForm((prev) => ({ ...prev, social_score: e.target.value }))}
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
              <label htmlFor="ged_cert_file" className="block text-sm font-medium text-gray-700 mb-2">
                อัพโหลดไฟล์ใบรับรอง (PDF เท่านั้น)
              </label>
              <div className="mt-1">
                <input
                  id="ged_cert_file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleCertFileChange(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-900
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">รองรับเฉพาะไฟล์ PDF (ขนาดไม่เกิน 10MB)</p>
                {uploading && (
                  <div className="mt-2 flex items-center text-sm text-orange-600">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" aria-label="กำลังอัพโหลด">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    กำลังอัพโหลด...
                  </div>
                )}
                {certFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    เลือกไฟล์: {certFile.name}
                  </div>
                )}
                {!certFile && form.cert_file_path && (
                  <div className="mt-2 text-sm">
                    <a
                      href={form.cert_file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      ดูไฟล์ปัจจุบัน
                    </a>
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
