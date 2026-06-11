"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  Upload,
  RefreshCcw,
  Check,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [mode, setMode] = useState<"options" | "camera" | "preview">("options");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) {
      setImageSrc(src);
      setMode("preview");
    }
  }, []);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processFile(file);
  };

  const reset = () => {
    setImageSrc(null);
    setMode("options");
  };

  // ── Preview ──────────────────────────────────────────
  if (mode === "preview" && imageSrc) {
    return (
      <div className="flex flex-col gap-4 w-full animate-fade-up">
        <div className="w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm max-h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          <button
            onClick={reset}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-full"
            onClick={reset}
          >
            Foto Ulang
          </Button>
          <Button
            className="flex-1 h-12 rounded-full bg-[#1767AF] hover:bg-[#1356A0] text-white"
            onClick={() => imageSrc && onCapture(imageSrc)}
          >
            Gunakan Foto
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white/60 flex items-center justify-center focus:outline-none active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-lg" />
            </button>
          </div>
          <button
            onClick={reset}
            className="absolute top-4 left-4 text-white/80 hover:text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-lg transition-colors"
          >
            ✕ Batal
          </button>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Pastikan seluruh form terlihat jelas dalam frame
        </p>
      </div>
    );
  }

  // ── Options ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full animate-fade-up">
      {/* Camera Button */}
      <button
        onClick={() => setMode("camera")}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#1767AF]/40 hover:bg-blue-50/30 transition-all active:scale-[0.98] group text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-[#1767AF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1767AF]/20 transition-colors">
          <Camera className="w-6 h-6 text-[#1767AF]" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            Foto via Kamera
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan kamera untuk foto form secara langsung
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
            Drag & drop atau klik — JPG, PNG, WEBP
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
    </div>
  );
}
