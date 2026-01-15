"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HttpError, ProfileResponse, fetchMyProfile, updatePersonalInfoOnly } from "@/services/profile";

const DOC_TYPE_OPTIONS = [
  { key: "citizen", label: "บัตรประชาชน", value: "ID Card", id: 1 },
  { key: "gcode", label: "G-Code", value: "G-Code", id: 2 },
  { key: "passport", label: "หนังสือเดินทาง", value: "Passport", id: 3 },
];

const docFieldMeta: Record<
  string,
  { label: string; placeholder: string; helper: string }
> = {
  citizen: {
    label: "เลขบัตรประชาชน",
    placeholder: "กรอกเลขบัตรประชาชน 13 หลัก",
    helper: "เลข 13 หลัก (ไม่มีขีด)",
  },
  gcode: {
    label: "หมายเลข G-Code",
    placeholder: "กรอก G-Code เช่น G1234567",
    helper: "ขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก",
  },
  passport: {
    label: "หมายเลขหนังสือเดินทาง",
    placeholder: "กรอกหมายเลขหนังสือเดินทาง",
    helper: "ตามหมายเลขบนหน้าหนังสือเดินทาง",
  },
  default: {
    label: "หมายเลขยืนยันตัวตน",
    placeholder: "กรอกเลขยืนยันตัวตน",
    helper: "เลข 13 หลัก (ไม่มีขีด) หรือรหัสตามเอกสารที่เลือก",
  },
};

const dateToInputValue = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const guessDocTypeKey = (idName?: string) => {
  if (!idName) return "citizen";
  const lowered = idName.toLowerCase();
  if (lowered.includes("passport")) return "passport";
  if (lowered.includes("g")) return "gcode";
  return "citizen";
};

export default function EditPersonalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  
  // Fixed language based on user's existing data - cannot be changed
  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  
  const [form, setForm] = useState({
    firstNameTh: "",
    lastNameTh: "",
    firstNameEn: "",
    lastNameEn: "",
    phone: "",
    birthday: "",
    idNumber: "",
    docTypeKey: "citizen",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyProfile(token)
      .then((data) => {
        setProfile(data);
        const user = data.user;
        
        // Determine language based on existing data - fixed, cannot change
        const isThai = Boolean(user.first_name_th || user.last_name_th);
        setNameLanguage(isThai ? "thai" : "english");
        
        setForm({
          firstNameTh: user.first_name_th || "",
          lastNameTh: user.last_name_th || "",
          firstNameEn: user.first_name_en || "",
          lastNameEn: user.last_name_en || "",
          phone: user.phone || "",
          birthday: dateToInputValue(user.birthday),
          idNumber: user.id_number || "",
          docTypeKey: guessDocTypeKey(user.user_id_type?.id_name),
        });
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const selectedDocType = useMemo(
    () => DOC_TYPE_OPTIONS.find((opt) => opt.key === form.docTypeKey) || DOC_TYPE_OPTIONS[0],
    [form.docTypeKey],
  );
  const docMeta = docFieldMeta[selectedDocType.key] || docFieldMeta.default;

  const isThaiChar = (v: string) => /^[\p{Script=Thai}\s'-]+$/u.test(v.trim());
  const isEngChar = (v: string) => /^[A-Za-z\s'-]+$/.test(v.trim());

  const validate = () => {
    if (nameLanguage === "thai") {
      const first = form.firstNameTh.trim();
      const last = form.lastNameTh.trim();
      if (!first || !last) {
        setError("กรุณากรอกชื่อและนามสกุล");
        return false;
      }
      if (!isThaiChar(first) || !isThaiChar(last)) {
        setError("กรุณากรอกชื่อ-นามสกุลเป็นภาษาไทยเท่านั้น");
        return false;
      }
    } else {
      const first = form.firstNameEn.trim();
      const last = form.lastNameEn.trim();
      if (!first || !last) {
        setError("Please enter first and last name");
        return false;
      }
      if (!isEngChar(first) || !isEngChar(last)) {
        setError("Please enter first and last name in English only");
        return false;
      }
    }
    
    if (!form.phone.trim()) {
      setError("กรุณากรอกหมายเลขโทรศัพท์");
      return false;
    }
    if (!form.birthday) {
      setError("กรุณาเลือกวันเกิด");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    try {
      await updatePersonalInfoOnly(token, {
        first_name_th: nameLanguage === "thai" ? form.firstNameTh : undefined,
        last_name_th: nameLanguage === "thai" ? form.lastNameTh : undefined,
        first_name_en: nameLanguage === "english" ? form.firstNameEn : undefined,
        last_name_en: nameLanguage === "english" ? form.lastNameEn : undefined,
        phone: form.phone,
        birthday: form.birthday,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
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
              <h1 className="text-xl sm:text-2xl font-bold text-white">แก้ไขข้อมูลส่วนตัว</h1>
              <p className="mt-1 text-orange-100 text-sm">อัปเดตข้อมูลพื้นฐานของคุณ</p>
            </div>
          </div>

          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Language Badge - Fixed, cannot change */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">ภาษาที่ใช้บันทึกชื่อ:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                nameLanguage === "thai" 
                  ? "bg-orange-100 text-orange-700 border border-orange-200" 
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}>
                {nameLanguage === "thai" ? "🇹🇭 ภาษาไทย" : "🇬🇧 English"}
              </span>
              <span className="text-xs text-gray-400">(ไม่สามารถเปลี่ยนได้)</span>
            </div>

            {/* Document Type - Read Only */}
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">เอกสารยืนยันตัวตน</h2>
                <p className="text-sm text-gray-500 mt-1">ข้อมูลนี้ไม่สามารถแก้ไขได้</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    className={`py-3 px-2 rounded-xl border-2 text-center text-sm font-medium ${
                      opt.key === form.docTypeKey
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-100 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {/* ID Number - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {docMeta.label}
                </label>
                <input
                  type="text"
                  value={form.idNumber}
                  disabled
                  className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder={docMeta.placeholder}
                />
                <p className="text-xs text-gray-400 mt-1">หมายเลขเอกสารไม่สามารถแก้ไขได้</p>
              </div>
            </div>

            {/* Name Section */}
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">ชื่อ-นามสกุล</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {nameLanguage === "thai" ? "กรอกเป็นภาษาไทย" : "Enter in English"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nameLanguage === "thai" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ (ไทย) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstNameTh}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstNameTh: e.target.value }))}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="กรอกชื่อเป็นภาษาไทย"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        นามสกุล (ไทย) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastNameTh}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastNameTh: e.target.value }))}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="กรอกนามสกุลเป็นภาษาไทย"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstNameEn}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstNameEn: e.target.value }))}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastNameEn}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastNameEn: e.target.value }))}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="Enter last name"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">ข้อมูลติดต่อ</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="0XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันเกิด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href="/student/profile"
                className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
