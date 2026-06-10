"use client";

import { useEffect, useState, useRef } from "react";
import { AlertCircle, RefreshCw, FileSearch, Cpu, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProcessingStateProps {
  imageSrc: string;
  onComplete: (data: any) => void;
}

const STEPS = [
  { icon: FileSearch, label: "Mengunggah gambar..." },
  { icon: Cpu,        label: "Mengekstrak teks via OCR..." },
  { icon: Cpu,        label: "Menganalisis form dengan Gemini AI..." },
  { icon: CheckCircle2, label: "Mencocokkan data karyawan..." },
];

export function ProcessingState({ imageSrc, onComplete }: ProcessingStateProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requestSent = useRef(false);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    if (requestSent.current) return;
    requestSent.current = true;

    const run = async () => {
      try {
        setProgress(10); setStepIdx(0);

        const file = dataURLtoFile(imageSrc, "form-scan.jpg");
        const formData = new FormData();
        formData.append("file", file);

        // Animate step progress
        const stepTimings = [0, 1000, 3500, 6000];
        stepTimings.forEach((t, i) => setTimeout(() => setStepIdx(i), t));

        const interval = setInterval(() => {
          setProgress(prev => prev < 85 ? prev + (prev < 40 ? 3 : 1) : prev);
        }, 200);

        const res = await fetch("/api/scan", { method: "POST", body: formData });
        clearInterval(interval);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal memproses gambar");
        }

        const result = await res.json();
        setProgress(100);
        setStepIdx(3);
        setTimeout(() => onComplete(result.data), 500);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memproses.");
        toast.error(err.message || "Gagal memproses form");
      }
    };

    run();
  }, [imageSrc, onComplete]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-up px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Proses Gagal</h3>
        <p className="text-sm text-slate-500 max-w-xs mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#1767AF] hover:bg-[#1356A0] text-white">
          <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  const CurrentIcon = STEPS[stepIdx]?.icon || Cpu;

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6 w-full animate-fade-up">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <CurrentIcon className="w-7 h-7 text-[#1767AF]" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#1767AF]/30 animate-ping" />
      </div>

      {/* Step labels */}
      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
              i < stepIdx ? "text-slate-400 line-through" : i === stepIdx ? "text-slate-800 font-semibold" : "text-slate-300"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
              i < stepIdx ? "bg-emerald-400" : i === stepIdx ? "bg-[#1767AF] animate-pulse" : "bg-slate-200"
            }`} />
            {step.label}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#1767AF] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">Estimasi 5–15 detik</p>
      </div>
    </div>
  );
}
