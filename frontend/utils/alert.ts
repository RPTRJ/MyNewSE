import Swal from "sweetalert2";

export const AlertSuccess = (title: string, text?: string) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#2563eb",
  });

export const AlertError = (title: string, text?: string) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#dc2626",
  });

export const AlertWarning = (title: string, text?: string) =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#f59e0b",
  });

export const AlertConfirm = (title: string, text?: string) =>
  Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#6b7280",
  });
