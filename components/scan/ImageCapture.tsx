"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, X, Plus, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ImageFile {
  id: string;
  src: string; // base64 data URL
  name: string;
}

interface ImageCaptureProps {
  onCapture: (images: ImageFile[]) => void;
}

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [mode, setMode] = useState<"options" | "camera">("options");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () =>
    `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const handleCameraCapture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) {
      if (images.length >= MAX_FILES) {
        toast.error(`Maksimal ${MAX_FILES} gambar`);
        return;
      }
      setImages((prev) => [
        ...prev,
        { id: generateId(), src, name: `camera_${prev.length + 1}.jpg` },
      ]);
      setMode("options");
    }
  }, [images.length]);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = MAX_FILES - images.length;

    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_FILES} gambar`);
      return;
    }

    const validFiles = fileArray
      .filter((f) => {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name} bukan file gambar`);
          return false;
        }
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`${f.name} melebihi batas 10MB`);
          return false;
        }
        return true;
      })
      .slice(0, remaining);

    if (fileArray.length > remaining) {
      toast.warning(
        `Hanya ${remaining} gambar lagi yang bisa ditambahkan (maks ${MAX_FILES})`,
      );
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => {
          if (prev.length >= MAX_FILES) return prev;
          return [
            ...prev,
            { id: generateId(), src: reader.result as string, name: file.name },
          ];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    // Reset input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleProceed = () => {
    if (images.length === 0) {
      toast.error("Pilih minimal 1 gambar");
      return;
    }
    onCapture(images);
  };

  // ── Camera ────────────────────────────────────────────
  if (mode === "camera") {
    return (
      <div className="flex flex-col gap-4 w-full animate-fade-up">
        <div className="w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden relative shadow-lg max-h-[70vh]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
          {/* Viewfinder */}
          <div className="absolute inset-5 border-2 border-white/30 rounded-xl pointer-events-none">
            <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-xl" />
            <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-xl" />
            <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-xl" />
            <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-white rounded-br-xl" />
          </div>
          {/* Shutter */}
          <div className="absolute bottom-5 left-0 w-full flex justify-center">
            <button
              onClick={handleCameraCapture}
              className="w-16 h-16 rounded-full border-4 border-white/60 flex items-center justify-center focus:outline-none active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-lg" />
            </button>
          </div>
          <button
            onClick={() => setMode("options")}
            className="absolute top-4 left-4 text-white/80 hover:text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-lg transition-colors"
          >
            ✕ Kembali
          </button>
          {/* Counter badge */}
          {images.length > 0 && (
            <div className="absolute top-4 right-4 bg-[#1767AF] text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {images.length}/{MAX_FILES}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 text-center">
          Pastikan seluruh form terlihat jelas dalam frame
        </p>
      </div>
    );
  }

  // ── Options (with thumbnail preview if images exist) ───
  return (
    <div className="flex flex-col gap-4 w-full animate-fade-up">
      {/* Thumbnail Grid Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-[#1767AF]" />
              <span className="text-sm font-semibold text-slate-800">
                Dokumen Terpilih
              </span>
            </div>
            <span className="text-xs font-bold text-[#1767AF] bg-blue-50 px-2.5 py-1 rounded-full">
              {images.length}/{MAX_FILES}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative group aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 hover:border-[#1767AF]/40 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`Dokumen ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Index badge */}
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {idx + 1}
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Add more button (if under limit) */}
            {images.length < MAX_FILES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 hover:border-[#1767AF]/40 hover:bg-blue-50/30 transition-all"
              >
                <Plus className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium">
                  Tambah
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Camera Button */}
      <button
        onClick={() => setMode("camera")}
        className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-[#1767AF]/40 hover:bg-blue-50/30 transition-all active:scale-[0.98] group text-left"
      >
        <div className="w-12 h-12 rounded-lg bg-[#1767AF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1767AF]/20 transition-colors">
          <Camera className="w-6 h-6 text-[#1767AF]" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            Foto via Kamera
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Ambil foto form satu per satu via kamera
          </p>
        </div>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-slate-200" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          atau
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${
          dragging
            ? "border-[#1767AF] bg-blue-50 scale-[1.01]"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center">
          <Upload className="w-5 h-5 text-slate-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm text-slate-700">
            {dragging ? "Lepaskan untuk upload" : "Upload File Gambar"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag & drop atau klik — JPG, PNG, WEBP (maks {MAX_FILES} file)
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Proceed button (when images selected) */}
      {images.length > 0 && (
        <Button
          onClick={handleProceed}
          className="w-full h-12 rounded-full bg-[#1767AF] hover:bg-[#1356A0] text-white text-sm cursor-pointer font-semibold"
        >
          Proses {images.length} Dokumen
        </Button>
      )}
    </div>
  );
}
