"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { ScanStepper } from "@/components/scan/ScanStepper";
import { ImageCapture, ImageFile } from "@/components/scan/ImageCapture";
import { BatchProcessingState } from "@/components/scan/ProcessingState";
import { ScanPreview } from "@/components/scan/ScanPreview";
import { useScanStore } from "@/store/scan-store";
import { toast } from "sonner";
import {
  Lightbulb,
  Camera,
  CheckCircle2,
  Info,
  FileText,
  Activity,
} from "lucide-react";
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

function QuotaIndicator({ quota }: { quota: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!quota || quota.remaining > 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const resetTime = new Date(quota.nextResetUTC).getTime();
      const distance = resetTime - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [quota]);

  if (!quota) return null;

  const isLimitReached = quota.remaining === 0;

  return (
    <div
      className={`pt-3 text-sm max-w-sm ${isLimitReached ? " text-red-700" : " text-[#1767AF]"}`}
    >
      <div className="flex gap-2 items-center">
        <Activity className="w-4 h-4 shrink-0" />
        <span className="font-semibold">
          Kuota Scan Harian {quota.used} / {quota.limit}
        </span>
      </div>
      {isLimitReached && (
        <div className="font-medium mt-1">
          Batas harian tercapai. Quota akan direset (tengah malam Waktu Pasifik)
          dalam: <br />
          <span className="font-bold tabular-nums text-red-600 text-base">
            {timeLeft}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const {
    step,
    setStep,
    images,
    setImages,
    batchResults,
    resetScan,
  } = useScanStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [quota, setQuota] = useState<{
    used: number;
    limit: number;
    remaining: number;
    nextResetUTC: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/scan/quota")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuota(data.quota);
        }
      })
      .catch(console.error);
  }, []);

  const handleCaptureComplete = (capturedImages: ImageFile[]) => {
    setImages(capturedImages);
    setStep(2);
  };



  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleSubmitAll = async (itemsToSave: any[]) => {
    if (itemsToSave.length === 0) {
      toast.error("Tidak ada dokumen yang dipilih untuk disimpan");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    // We submit them sequentially to the existing single-submission API
    // Or we could create a batch API, but this is simpler for now
    try {
      for (const item of itemsToSave) {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (res.ok) {
          successCount++;
        }
      }

      if (successCount === itemsToSave.length) {
        toast.success(`${successCount} dokumen berhasil disimpan`);
        resetScan();
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} dari ${itemsToSave.length} dokumen berhasil disimpan`,
        );
        resetScan();
      } else {
        toast.error("Gagal menyimpan semua dokumen");
      }

      // Invalidate SWR submissions cache so dashboard shows fresh data
      globalMutate(
        (key: string) => typeof key === "string" && key.startsWith("/api/submissions"),
        undefined,
        { revalidate: true },
      );
      router.push("/dashboard");
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
          Upload atau foto form rekap HR untuk diekstrak otomatis (Maks 4)
        </p>
        <QuotaIndicator quota={quota} />
      </div>

      <div
        className={`grid grid-cols-1 ${step < 3 ? "lg:grid-cols-3" : ""} gap-5 items-start`}
      >
        {/* ── Main Card ── */}
        <div className={`${step < 3 ? "lg:col-span-2" : ""}`}>
          <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
            {/* Stepper */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <ScanStepper currentStep={step} />
            </div>

            {/* Step content */}
            <div className="p-5">
              {step === 1 && <ImageCapture onCapture={handleCaptureComplete} />}
              {step === 2 && images.length > 0 && (
                <BatchProcessingState
                  onComplete={() => setStep(3)}
                  onCancel={handleCancel}
                />
              )}
              {step === 3 && batchResults.length > 0 && (
                <ScanPreview
                  results={batchResults}
                  onSubmitAll={handleSubmitAll}
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
            <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
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
                Sistem mengenali form SP, Cuti, dan Ijin secara otomatis. Anda
                dapat memindai hingga 4 dokumen sekaligus.
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
                resetScan();
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
