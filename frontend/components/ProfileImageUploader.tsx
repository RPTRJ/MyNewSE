"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { uploadFile, deleteFile } from "@/services/upload";
import { updateProfileImage } from "@/services/profile";

// =============================================================================
// Types & Interfaces
// =============================================================================

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageUpdated: (newUrl: string) => void;
  /** Hide the helper text below the image */
  hideHelperText?: boolean;
  /** Show orange gradient border around the image */
  showBorder?: boolean;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
}

interface ImageSize {
  width: number;
  height: number;
}

// =============================================================================
// Constants
// =============================================================================

/** The diameter of the circular crop area in pixels */
const CIRCLE_DIAMETER = 260;

/** Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Zoom range */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

/** Editor canvas size */
const EDITOR_SIZE = 300;
const EDITOR_CIRCLE_RADIUS = 130;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate the minimum scale required to cover the circle
 */
const getMinScale = (imageSize: ImageSize): number => {
  if (imageSize.width <= 0 || imageSize.height <= 0) return 0.5;
  return Math.max(CIRCLE_DIAMETER / imageSize.width, CIRCLE_DIAMETER / imageSize.height);
};

/**
 * Calculate the maximum allowed movement in each direction
 */
const getMaxMovement = (imageSize: ImageSize, scale: number) => {
  const scaledWidth = imageSize.width * scale;
  const scaledHeight = imageSize.height * scale;
  return {
    maxX: Math.max(0, (scaledWidth - CIRCLE_DIAMETER) / 2),
    maxY: Math.max(0, (scaledHeight - CIRCLE_DIAMETER) / 2),
  };
};

/**
 * Clamp position within allowed bounds
 */
const clampPosition = (x: number, y: number, imageSize: ImageSize, scale: number) => {
  const { maxX, maxY } = getMaxMovement(imageSize, scale);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
};

// =============================================================================
// Icons
// =============================================================================

const CameraIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
  </svg>
);

const ZoomInIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const DefaultAvatarIcon = () => (
  <svg className="h-full w-full text-gray-400 p-6" fill="currentColor" viewBox="0 0 24 24" aria-label="ไอคอนโปรไฟล์เริ่มต้น">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// =============================================================================
// Main Component
// =============================================================================

export function ProfileImageUploader({
  currentImageUrl,
  onImageUpdated,
  hideHelperText = false,
  showBorder = false,
}: ProfileImageUploaderProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [position, setPosition] = useState<ImagePosition>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 0, height: 0 });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  const hasImage = Boolean(currentImageUrl);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  // Handle drag events
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;
      const clamped = clampPosition(newX, newY, imageSize, position.scale);

      setPosition((prev) => ({ ...prev, ...clamped }));
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, dragStart, imageSize, position.scale]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setSelectedFileUrl(url);
    setPosition({ x: 0, y: 0, scale: 1 });
    setShowEditor(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const newSize = { width: img.naturalWidth, height: img.naturalHeight };
    setImageSize(newSize);

    // Set initial scale slightly larger than minimum
    const minScale = getMinScale(newSize);
    setPosition((prev) => ({ ...prev, scale: minScale * 1.2 }));
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setDragStart({
        x: clientX - position.x,
        y: clientY - position.y,
      });
    },
    [position.x, position.y]
  );

  const handleZoom = useCallback(
    (delta: number) => {
      setPosition((prev) => {
        const minScale = getMinScale(imageSize);
        const newScale = Math.max(minScale, Math.min(MAX_ZOOM, prev.scale + delta));
        const clamped = clampPosition(prev.x, prev.y, imageSize, newScale);

        return { scale: newScale, ...clamped };
      });
    },
    [imageSize]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      handleZoom(delta);
    },
    [handleZoom]
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    const minScale = getMinScale(imageSize);
    const clampedScale = Math.max(minScale, Math.min(MAX_ZOOM, newScale));

    setPosition((prev) => {
      const clamped = clampPosition(prev.x, prev.y, imageSize, clampedScale);
      return { scale: clampedScale, ...clamped };
    });
  };

  const handleReset = () => {
    const minScale = getMinScale(imageSize);
    setPosition({ x: 0, y: 0, scale: minScale * 1.2 });
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleCancel = () => {
    setShowEditor(false);
    setSelectedFile(null);
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
    }
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  // ---------------------------------------------------------------------------
  // Crop & Save
  // ---------------------------------------------------------------------------

  const cropImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current) {
        reject(new Error("Image not loaded"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }

      // Set output size
      canvas.width = CIRCLE_DIAMETER;
      canvas.height = CIRCLE_DIAMETER;

      // Create circular clip
      ctx.beginPath();
      ctx.arc(CIRCLE_DIAMETER / 2, CIRCLE_DIAMETER / 2, CIRCLE_DIAMETER / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate source coordinates
      const scaledWidth = imageSize.width * position.scale;
      const scaledHeight = imageSize.height * position.scale;
      const centerX = scaledWidth / 2 - position.x;
      const centerY = scaledHeight / 2 - position.y;
      const srcCenterX = centerX / position.scale;
      const srcCenterY = centerY / position.scale;
      const srcSize = CIRCLE_DIAMETER / position.scale;
      const srcX = srcCenterX - srcSize / 2;
      const srcY = srcCenterY - srcSize / 2;

      // Draw cropped image
      ctx.drawImage(
        imageRef.current,
        srcX,
        srcY,
        srcSize,
        srcSize,
        0,
        0,
        CIRCLE_DIAMETER,
        CIRCLE_DIAMETER
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        1.0
      );
    });
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Crop and upload new image
      const croppedBlob = await cropImage();
      const croppedFile = new File([croppedBlob], "profile.png", { type: "image/png" });
      const uploadedUrl = await uploadFile(croppedFile);

      console.log("Uploaded URL from server:", uploadedUrl);

      // Validate uploaded URL
      if (!uploadedUrl || uploadedUrl.trim() === "") {
        throw new Error("ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
      }

      // Convert relative URL to absolute URL if needed
      let fullUrl = uploadedUrl;
      if (uploadedUrl.startsWith("/")) {
        // Relative URL - convert to absolute using API base URL
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        fullUrl = `${apiBaseUrl}${uploadedUrl}`;
      }

      console.log("Full URL to send to backend:", fullUrl);

      // Update database
      const token = localStorage.getItem("token");
      if (!token) throw new Error("ไม่พบ token");

      await updateProfileImage(token, fullUrl);

      // Delete old image if exists (after successful upload)
      if (currentImageUrl) {
        try {
          await deleteFile(currentImageUrl);
        } catch {
          // Ignore delete errors - old file might not exist or already deleted
          console.warn("Could not delete old profile image");
        }
      }

      // Cleanup and notify parent (send the full URL, not relative)
      onImageUpdated(fullUrl);
      setShowEditor(false);
      setSelectedFile(null);
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
        setSelectedFileUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ");
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const sliderProgress = ((position.scale - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;
  const sliderBackground = `linear-gradient(to right, #f97316 0%, #f97316 ${sliderProgress}%, #e5e7eb ${sliderProgress}%, #e5e7eb 100%)`;

  const containerClassName = showBorder
    ? "p-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
    : "";

  const imageContainerClassName = hasImage
    ? `relative h-32 w-32 rounded-full overflow-hidden ${showBorder ? "bg-white" : "bg-white/20 backdrop-blur-sm border-4 border-white/50"}`
    : "relative h-32 w-32 rounded-full overflow-hidden bg-gray-100 border border-gray-300";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Profile Image Display */}
      <div className="flex flex-col items-center">
        <div className={`relative group ${containerClassName}`}>
          <div className={imageContainerClassName}>
            {currentImageUrl ? (
              <img src={currentImageUrl} alt="รูปโปรไฟล์" className="h-full w-full object-cover" />
            ) : (
              <DefaultAvatarIcon />
            )}

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleClick}
              role="button"
              aria-label="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClick();
              }}
            >
              <CameraIcon />
            </div>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="เปลี่ยนรูปโปรไฟล์"
            aria-label="เปลี่ยนรูปโปรไฟล์"
          >
            <EditIcon />
          </button>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="เลือกไฟล์รูปภาพ"
        />

        {/* Helper Text */}
        {!hideHelperText && (
          <p className="mt-3 text-xs text-gray-600 text-center">
            คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์
            <br />
            รองรับไฟล์ JPG, PNG (สูงสุด 5MB)
          </p>
        )}

        {/* Error Message */}
        {error && !showEditor && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* Image Editor Modal */}
      {showEditor && selectedFileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600">
              <h3 className="text-lg font-semibold text-white">ปรับตำแหน่งรูปภาพ</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="ปิด"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Editor Area */}
            <div className="p-5 bg-gray-50">
              {/* Image Canvas */}
              <div
                ref={editorRef}
                className="relative mx-auto rounded-xl cursor-move select-none border-2 border-gray-200 shadow-inner overflow-hidden"
                style={{ width: EDITOR_SIZE, height: EDITOR_SIZE, backgroundColor: "#f3f4f6" }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                onWheel={handleWheel}
              >
                {/* Preview Image */}
                <img
                  ref={imageRef}
                  src={selectedFileUrl}
                  alt="Preview"
                  onLoad={handleImageLoad}
                  className="absolute pointer-events-none"
                  style={{
                    width: imageSize.width * position.scale,
                    height: imageSize.height * position.scale,
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: "translate(-50%, -50%)",
                    maxWidth: "none",
                  }}
                  draggable={false}
                />

                {/* Circular Mask Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300" preserveAspectRatio="none">
                  <defs>
                    <mask id="circleMaskOrange">
                      <rect width="300" height="300" fill="white" />
                      <circle cx="150" cy="150" r={EDITOR_CIRCLE_RADIUS} fill="black" />
                    </mask>
                  </defs>
                  <rect width="300" height="300" fill="rgba(255, 255, 255, 0.7)" mask="url(#circleMaskOrange)" />
                  <circle cx="150" cy="150" r={EDITOR_CIRCLE_RADIUS} fill="none" stroke="#f97316" strokeWidth="3" />
                </svg>
              </div>

              {/* Helper Text */}
              <p className="text-center text-xs text-gray-500 mt-3">ลากรูปเพื่อปรับตำแหน่ง</p>

              {/* Zoom Controls */}
              <div className="flex items-center justify-center gap-3 mt-4 bg-white rounded-xl p-3 border border-gray-200">
                <button
                  type="button"
                  onClick={() => handleZoom(-ZOOM_STEP)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="ซูมออก"
                >
                  <ZoomOutIcon />
                </button>

                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.01"
                  value={position.scale}
                  onChange={handleSliderChange}
                  className="flex-1 max-w-32 h-2 rounded-full cursor-pointer accent-orange-500 appearance-none"
                  style={{ background: sliderBackground }}
                />

                <button
                  type="button"
                  onClick={() => handleZoom(ZOOM_STEP)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="ซูมเข้า"
                >
                  <ZoomInIcon />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm" role="alert">
                  {error}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={handleReset}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
              >
                รีเซ็ต
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="py-2.5 px-5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUploading}
                  className="py-2.5 px-5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  {isUploading ? (
                    <>
                      <SpinnerIcon />
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึก"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
