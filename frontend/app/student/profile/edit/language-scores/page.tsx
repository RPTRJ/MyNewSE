"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiLanguageScore,
  HttpError,
  ProfileResponse,
  fetchMyProfile,
  replaceLanguageScores,
} from "@/services/profile";
import { uploadFile } from "@/services/upload";

// Configuration for each test type
type TestTypeConfig = {
  label: string;
  scoreLabel?: string;
  scorePlaceholder?: string;
  scoreMin?: number;
  scoreMax?: number;
  scoreStep?: number;
  hasLevel?: boolean;
  levelLabel?: string;
  levelOptions?: string[];
  hasSatMath?: boolean;
  hasSubject?: boolean;
  subjectOptions?: string[];
  description?: string;
};

const testTypeConfigs: Record<string, TestTypeConfig> = {
  TOEFL: {
    label: "TOEFL",
    scoreLabel: "คะแนนรวม",
    scorePlaceholder: "กรอกคะแนน",
    scoreMin: 0,
    scoreMax: 677,
    scoreStep: 1,
    hasLevel: true,
    levelLabel: "ประเภทการสอบ",
    levelOptions: ["Paper-Based (PBT)", "Computer-Based (CBT)", "Internet-Based (iBT)"],
    description: "Test of English as a Foreign Language",
  },
  IELTS: {
    label: "IELTS",
    scoreLabel: "Overall Band Score",
    scorePlaceholder: "0.0-9.0",
    scoreMin: 0,
    scoreMax: 9,
    scoreStep: 0.5,
    description: "International English Language Testing System",
  },
  TOEIC: {
    label: "TOEIC",
    scoreLabel: "คะแนน Listening & Reading",
    scorePlaceholder: "10-990",
    scoreMin: 10,
    scoreMax: 990,
    scoreStep: 1,
    description: "Test of English for International Communication",
  },
  CEFR: {
    label: "CEFR",
    scoreLabel: "ระดับ",
    hasLevel: true,
    levelLabel: "ระดับ CEFR",
    levelOptions: ["A1 (Beginner)", "A2 (Elementary)", "B1 (Intermediate)", "B2 (Upper Intermediate)", "C1 (Advanced)", "C2 (Proficient)"],
    description: "Common European Framework of Reference for Languages",
  },
  SAT: {
    label: "SAT",
    scoreLabel: "English Score",
    scorePlaceholder: "200-800",
    scoreMin: 200,
    scoreMax: 800,
    scoreStep: 10,
    hasSatMath: true,
    description: "คะแนนแต่ละส่วน 200-800 คะแนน",
  },
  "อื่นๆ": {
    label: "อื่นๆ",
    scoreLabel: "คะแนน",
    scorePlaceholder: "กรอกคะแนน",
    hasLevel: true,
    levelLabel: "ชื่อการสอบ/ระดับ",
    description: "การสอบอื่นๆ ที่ไม่อยู่ในรายการ",
  },
};

type LanguageItem = {
  test_type: string;
  score?: string;
  test_level?: string;
  test_date?: string;
  cert_file_path?: string;
  cert_file?: File | null;
  sat_math?: string;
  subject?: string;
};

const emptyItem: LanguageItem = {
  test_type: "",
  score: "",
  test_level: "",
  test_date: "",
  cert_file_path: "",
  cert_file: null,
  sat_math: "",
  subject: "",
};

const toDateInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const languageTestTypes = Object.keys(testTypeConfigs);

export default function EditLanguageScoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LanguageItem[]>([emptyItem]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((profile: ProfileResponse) => {
        if (profile.language_scores?.length) {
          setItems(
            profile.language_scores.map((score: ApiLanguageScore) => ({
              test_type: score.test_type || "",
              score: score.score || "",
              test_level: score.test_level || "",
              test_date: toDateInput(score.test_date),
              cert_file_path: score.cert_file_path || "",
              cert_file: null,
              sat_math:
                score.sat_math !== undefined && score.sat_math !== null ? String(score.sat_math) : "",
            })),
          );
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

  const handleChange = (index: number, key: keyof LanguageItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // ถ้ากำลังเปลี่ยน test_type ให้รีเซ็ตฟิลด์อื่นทั้งหมดสำหรับรายการนั้น
        if (key === "test_type") {
          return {
            ...emptyItem,
            test_type: value,
          };
        }

        return { ...item, [key]: value };
      })
    );
  };

  const handleFileChange = async (index: number, file: File | null) => {
    if (!file) {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, cert_file: null } : item))
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    // Validate file type (accept only PDF)
    if (file.type !== "application/pdf") {
      alert("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      return;
    }

    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cert_file: file } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return [{ ...emptyItem }];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    // Validate: at least one item must have a test_type
    const validItems = items.filter((item) => item.test_type.trim());
    if (!validItems.length) {
      setError("กรุณากรอกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload files first
      const uploadedItems = await Promise.all(
        validItems.map(async (item, index) => {
          if (item.cert_file) {
            setUploading(index);
            try {
              const uploadedUrl = await uploadFile(item.cert_file);
              setUploading(null);
              return {
                ...item,
                cert_file_path: uploadedUrl,
              };
            } catch (uploadError) {
              setUploading(null);
              throw new Error(`ไม่สามารถอัพโหลดไฟล์สำหรับ ${item.test_type} ได้`);
            }
          }
          return item;
        })
      );

      // Prepare payload
      const payload = {
        items: uploadedItems.map((item) => ({
          test_type: item.test_type.trim(),
          score: item.score?.trim() || "",
          test_level: item.test_level?.trim() || "",
          test_date: item.test_date ? new Date(item.test_date).toISOString() : undefined,
          cert_file_path: item.cert_file_path?.trim() || "",
          sat_math: item.sat_math?.trim() ? Number(item.sat_math) : undefined,
        })),
      };

      await replaceLanguageScores(token, payload);
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
      setUploading(null);
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
              <h1 className="text-xl sm:text-2xl font-bold text-white">แก้ไขคะแนนภาษา</h1>
              <p className="mt-1 text-orange-100 text-sm">คะแนนสอบภาษาต่างๆ ของคุณ</p>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50 relative">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      title="ลบรายการนี้"
                      aria-label={`ลบรายการที่ ${index + 1}`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test Type */}
                    <div>
                      <label htmlFor={`test-type-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภทการสอบ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`test-type-${index}`}
                        name={`test-type-${index}`}
                        value={item.test_type}
                        onChange={(e) => handleChange(index, "test_type", e.target.value)}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors bg-white"
                        required
                        aria-label={`ประเภทการสอบรายการที่ ${index + 1}`}
                      >
                        <option value="" className="text-gray-500">-- เลือกประเภทการสอบ --</option>
                        {languageTestTypes.map((type) => (
                          <option key={type} value={type} className="text-gray-900">
                            {testTypeConfigs[type]?.label || type}
                          </option>
                        ))}
                      </select>
                      {item.test_type && testTypeConfigs[item.test_type]?.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {testTypeConfigs[item.test_type].description}
                        </p>
                      )}
                    </div>

                    {/* Dynamic Fields based on Test Type */}
                    {item.test_type && (() => {
                      const config = testTypeConfigs[item.test_type];
                      if (!config) return null;

                      return (
                        <>
                          {/* Subject Selection for A-Level */}
                          {config.hasSubject && config.subjectOptions && (
                            <div>
                              <label htmlFor={`subject-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                วิชา <span className="text-red-500">*</span>
                              </label>
                              <select
                                id={`subject-${index}`}
                                name={`subject-${index}`}
                                value={item.test_level || ""}
                                onChange={(e) => handleChange(index, "test_level", e.target.value)}
                                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors bg-white"
                                required
                              >
                                <option value="">-- เลือกวิชา --</option>
                                {config.subjectOptions.map((subject) => (
                                  <option key={subject} value={subject}>{subject}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Level Selection for TGAT/TPAT */}
                          {config.hasLevel && config.levelOptions && (
                            <div>
                              <label htmlFor={`level-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                {config.levelLabel} <span className="text-red-500">*</span>
                              </label>
                              <select
                                id={`level-${index}`}
                                name={`level-${index}`}
                                value={item.test_level || ""}
                                onChange={(e) => handleChange(index, "test_level", e.target.value)}
                                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors bg-white"
                                required
                              >
                                <option value="">-- เลือก{config.levelLabel} --</option>
                                {config.levelOptions.map((level) => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Free text Level for "อื่นๆ" */}
                          {config.hasLevel && !config.levelOptions && (
                            <div>
                              <label htmlFor={`level-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                {config.levelLabel || "ระดับ"}
                              </label>
                              <input
                                id={`level-${index}`}
                                name={`level-${index}`}
                                type="text"
                                value={item.test_level || ""}
                                onChange={(e) => handleChange(index, "test_level", e.target.value)}
                                placeholder="เช่น B2, Advanced"
                                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                              />
                            </div>
                          )}

                          {/* Score Field - Not shown for CEFR */}
                          {config.scoreLabel && item.test_type !== "CEFR" && (
                            <div>
                              <label htmlFor={`score-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                {config.scoreLabel || "คะแนน"} <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={`score-${index}`}
                                name={`score-${index}`}
                                type="number"
                                value={item.score || ""}
                                onChange={(e) => handleChange(index, "score", e.target.value)}
                                placeholder={config.scorePlaceholder || "กรอกคะแนน"}
                                min={config.scoreMin}
                                max={config.scoreMax}
                                step={config.scoreStep || 1}
                                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                                required
                              />
                              {config.scoreMin !== undefined && config.scoreMax !== undefined && (
                                <p className="mt-1 text-xs text-gray-500">
                                  เกณฑ์คะแนน: {config.scoreMin} - {config.scoreMax}
                                </p>
                              )}
                            </div>
                          )}

                          {/* SAT Math Score */}
                          {config.hasSatMath && (
                            <div>
                              <label htmlFor={`sat-math-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                                Math Score <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={`sat-math-${index}`}
                                name={`sat-math-${index}`}
                                type="number"
                                value={item.sat_math || ""}
                                onChange={(e) => handleChange(index, "sat_math", e.target.value)}
                                placeholder="200-800"
                                min={200}
                                max={800}
                                step={10}
                                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                                required
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                เกณฑ์คะแนน: 200 - 800
                              </p>
                            </div>
                          )}

                          {/* Test Date */}
                          <div>
                            <label htmlFor={`test-date-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                              วันที่สอบ
                            </label>
                            <input
                              id={`test-date-${index}`}
                              name={`test-date-${index}`}
                              type="date"
                              value={item.test_date || ""}
                              onChange={(e) => handleChange(index, "test_date", e.target.value)}
                              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-0 text-gray-900 transition-colors"
                            />
                          </div>

                          {/* File Upload */}
                          <div className="md:col-span-2">
                            <label htmlFor={`cert-file-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                              อัพโหลดไฟล์ผลคะแนน (PDF เท่านั้น)
                            </label>
                            <div className="mt-1">
                              <input
                                id={`cert-file-${index}`}
                                name={`cert-file-${index}`}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-900
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-lg file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-orange-50 file:text-orange-700
                                  hover:file:bg-orange-100
                                  cursor-pointer"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                รองรับเฉพาะไฟล์ PDF (ขนาดไม่เกิน 5MB)
                              </p>
                              {uploading === index && (
                                <div className="mt-2 flex items-center text-sm text-orange-600">
                                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  กำลังอัพโหลด...
                                </div>
                              )}
                              {item.cert_file && (
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  เลือกไฟล์: {item.cert_file.name}
                                </div>
                              )}
                              {item.cert_file_path && !item.cert_file && (
                                <div className="mt-2 text-sm">
                                  <a
                                    href={item.cert_file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-500 hover:underline inline-flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    ดูไฟล์ปัจจุบัน
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Placeholder when no test type selected */}
                    {!item.test_type && (
                      <div className="md:col-span-2 text-center py-4 text-gray-500 bg-gray-100 rounded-xl">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">กรุณาเลือกประเภทการสอบก่อน</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                aria-label="เพิ่มรายการคะแนนภาษา"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                เพิ่มรายการ
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/student/profile")}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || uploading !== null}
                className="flex-1 py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : uploading !== null ? "กำลังอัพโหลด..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
