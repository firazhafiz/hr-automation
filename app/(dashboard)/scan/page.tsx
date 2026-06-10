"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanStepper } from "@/components/scan/ScanStepper";
import { ImageCapture } from "@/components/scan/ImageCapture";
import { ProcessingState } from "@/components/scan/ProcessingState";
import { ScanPreview } from "@/components/scan/ScanPreview";
import { toast } from "sonner";
import { Lightbulb, Camera, CheckCircle2, Info, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIPS = [
  {
    icon: Camera,
    title: "Pencahayaan Terang",
    desc: "Hindari bayangan di atas kertas. Gunakan cahaya dari atas.",
  },
  {
    icon: FileText,
    title: "Rata & Tidak Terlipat",
    desc: "Letakkan di permukaan datar agar teks tidak melengkung.",
  },
  {
    icon: CheckCircle2,
    title: "Full Frame",
    desc: "Seluruh isi tabel dan area TTD harus masuk dalam foto.",
  },
];

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCaptureComplete = (src: string) => {
    setImageSrc(src);
    setStep(2);
  };
  const handleProcessingComplete = (data: any) => {
    setParsedData(data);
    setStep(3);
  };
  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Data berhasil disimpan");
        router.push("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || err.message || "Gagal menyimpan data");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto lg:max-w-6xl animate-fade-up">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Scan Form Baru
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
          Upload atau foto form rekap HR untuk diekstrak otomatis
        </p>
      </div>

      <div
        className={`grid grid-cols-1 ${step < 3 ? "lg:grid-cols-3" : ""} gap-5 items-start`}
      >
        {/* ── Main Card ── */}
        <div className={`${step < 3 ? "lg:col-span-2" : ""}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Stepper */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <ScanStepper currentStep={step} />
            </div>

            {/* Step content */}
            <div className="p-5">
              {step === 1 && <ImageCapture onCapture={handleCaptureComplete} />}
              {step === 2 && imageSrc && (
                <ProcessingState
                  imageSrc={imageSrc}
                  onComplete={handleProcessingComplete}
                />
              )}
              {step === 3 && imageSrc && parsedData && (
                <ScanPreview
                  imageSrc={imageSrc}
                  initialData={parsedData}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Tips Sidebar (step 1 & 2 only, desktop only) ── */}
        {step < 3 && (
          <div className="hidden lg:block lg:col-span-1 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Panduan Scan
                </h2>
              </div>
              <div className="p-5 space-y-5">
                {TIPS.map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <tip.icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {tip.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tip.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-5 mb-5 p-3 rounded-xl bg-blue-50 border border-blue-100 flex gap-2 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Sistem mengenali form SP, Cuti, dan Ijin secara otomatis.
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center sm:text-left font-semibold text-slate-900">
              Batalkan Pemindaian?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center sm:text-left text-slate-500 mt-1">
              Yakin ingin membatalkan? Data yang belum disimpan akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 sm:space-x-3">
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-medium animate-none"
              onClick={() => {
                setShowCancelDialog(false);
                router.push("/dashboard");
              }}
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
