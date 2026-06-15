"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  X,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageFile } from "./ImageCapture";

export type ItemStatus = "pending" | "processing" | "success" | "error";

export interface BatchResultItem {
  imageFile: ImageFile;
  status: ItemStatus;
  data?: any;
  error?: string;
}

interface BatchProcessingStateProps {
  images: ImageFile[];
  onComplete: (results: BatchResultItem[]) => void;
  onCancel: () => void;
}

export function BatchProcessingState({
  images,
  onComplete,
  onCancel,
}: BatchProcessingStateProps) {
  const [results, setResults] = useState<BatchResultItem[]>(() =>
    images.map((img) => ({ imageFile: img, status: "pending" as ItemStatus }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const requestSent = useRef(false);
  const cancelledRef = useRef(false);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const updateResult = useCallback(
    (index: number, update: Partial<BatchResultItem>) => {
      setResults((prev) =>
        prev.map((r, i) => (i === index ? { ...r, ...update } : r))
      );
    },
    []
  );

  /** Process a single document by index */
  const processOne = useCallback(
    async (index: number): Promise<BatchResultItem> => {
      const img = images[index];
      try {
        const file = dataURLtoFile(img.src, img.name);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/scan", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          // Provide user-friendly error messages
          let errorMsg = err.error || "Gagal memproses gambar";
          if (errorMsg.includes("503") || errorMsg.includes("Service Unavailable") || errorMsg.includes("high demand")) {
            errorMsg = "Server AI sedang sibuk. Coba lagi sebentar.";
          } else if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
            errorMsg = "Batas permintaan API tercapai. Tunggu sebentar.";
          } else if (errorMsg.includes("400")) {
            errorMsg = "File gambar tidak valid atau rusak.";
          }
          throw new Error(errorMsg);
        }

        const result = await res.json();
        return { imageFile: img, status: "success", data: result.data };
      } catch (err: any) {
        const errorMsg = err.message || "Terjadi kesalahan tidak diketahui";
        return { imageFile: img, status: "error", error: errorMsg };
      }
    },
    [images]
  );

  /** Process all documents sequentially */
  useEffect(() => {
    if (requestSent.current) return;
    requestSent.current = true;

    const processAll = async () => {
      for (let i = 0; i < images.length; i++) {
        if (cancelledRef.current) break;

        setCurrentIndex(i);
        updateResult(i, { status: "processing", error: undefined });

        const result = await processOne(i);
        updateResult(i, result);

        if (result.status === "error") {
          toast.error(`Dokumen ${i + 1}: ${result.error}`);
        }

        // Small delay between requests to reduce chance of 503/429
        if (i < images.length - 1 && !cancelledRef.current) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!cancelledRef.current) {
        setIsFinished(true);
      }
    };

    processAll();
  }, [images, updateResult, processOne]);

  /** Retry all failed documents */
  const handleRetryFailed = useCallback(async () => {
    setIsRetrying(true);

    const failedIndices = results
      .map((r, i) => (r.status === "error" ? i : -1))
      .filter((i) => i >= 0);

    for (const idx of failedIndices) {
      setCurrentIndex(idx);
      updateResult(idx, { status: "processing", error: undefined });

      const result = await processOne(idx);
      updateResult(idx, result);

      if (result.status === "error") {
        toast.error(`Dokumen ${idx + 1}: ${result.error}`);
      }

      // Delay between retries
      if (idx !== failedIndices[failedIndices.length - 1]) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setIsRetrying(false);
    // Re-check if we should auto-continue
    setResults((prev) => {
      const updated = [...prev];
      return updated;
    });
  }, [results, processOne, updateResult]);

  /** Proceed to review with current results */
  const handleProceed = useCallback(() => {
    const successCount = results.filter((r) => r.status === "success").length;
    if (successCount > 0) {
      toast.success(`${successCount}/${images.length} dokumen berhasil diproses`);
    }
    onComplete(results);
  }, [results, images.length, onComplete]);

  const handleCancel = () => {
    cancelledRef.current = true;
    setIsCancelled(true);
    onCancel();
  };

  const completedCount = results.filter(
    (r) => r.status === "success" || r.status === "error"
  ).length;
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const isProcessing = results.some((r) => r.status === "processing");
  const progress = Math.round((completedCount / images.length) * 100);

  const statusIcon = (status: ItemStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-[#1767AF] animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-300" />;
    }
  };

  const statusLabel = (status: ItemStatus) => {
    switch (status) {
      case "success":
        return "Berhasil";
      case "error":
        return "Gagal";
      case "processing":
        return "Sedang diproses...";
      default:
        return "Menunggu";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 gap-5 w-full animate-fade-up">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-base font-bold text-slate-900">
          {isFinished && !isRetrying ? "Pemrosesan Selesai" : "Memproses Dokumen..."}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {isProcessing || isRetrying
            ? `Memproses dokumen ${currentIndex + 1} dari ${images.length}`
            : `Selesai — ${successCount} berhasil, ${errorCount} gagal`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">Progress</span>
          <span className="text-xs font-bold text-[#1767AF]">
            {completedCount}/{images.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#1767AF] h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Item List */}
      <div className="w-full max-w-sm space-y-1.5 max-h-[40vh] overflow-y-auto">
        {results.map((item, idx) => (
          <div
            key={item.imageFile.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
              item.status === "processing"
                ? "bg-blue-50/50 border-[#1767AF]/20"
                : item.status === "success"
                ? "bg-emerald-50/50 border-emerald-100"
                : item.status === "error"
                ? "bg-red-50/50 border-red-100"
                : "bg-white border-slate-100"
            }`}
          >
            {/* Thumbnail */}
            <div className="w-8 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageFile.src}
                alt={`Dok ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                Dokumen {idx + 1}
              </p>
              <p
                className={`text-xs ${item.status !== "success" ? "line-clamp-2" : "truncate"} ${
                  item.status === "success"
                    ? "text-emerald-600"
                    : item.status === "error"
                    ? "text-red-500 font-medium leading-snug"
                    : item.status === "processing"
                    ? "text-[#1767AF]"
                    : "text-slate-400"
                }`}
              >
                {item.status === "success" && item.data
                  ? `${item.data.jenis_form} — ${item.data.nama || "Nama tidak terdeteksi"}`
                  : item.error
                  ? item.error
                  : statusLabel(item.status)}
              </p>
            </div>

            {/* Status Icon */}
            {statusIcon(item.status)}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {/* Show Retry + Continue when finished with errors */}
        {isFinished && !isProcessing && !isRetrying && errorCount > 0 && (
          <>
            <Button
              onClick={handleRetryFailed}
              className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Ulang {errorCount} Dokumen Gagal
            </Button>
            {successCount > 0 && (
              <Button
                onClick={handleProceed}
                variant="outline"
                className="w-full rounded-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Lanjutkan dengan {successCount} Dokumen Berhasil
              </Button>
            )}
          </>
        )}

        {/* Auto-proceed when all success */}
        {isFinished && !isProcessing && !isRetrying && errorCount === 0 && successCount > 0 && (
          // Auto-proceed after small delay
          <AutoProceed onProceed={handleProceed} />
        )}

        {/* Cancel while processing */}
        {(isProcessing || isRetrying) && !isCancelled && (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full rounded-full text-sm"
          >
            <X className="w-4 h-4 mr-1.5" />
            Batalkan
          </Button>
        )}

        {/* Cancel when finished */}
        {isFinished && !isProcessing && !isRetrying && successCount === 0 && (
          <Button
            onClick={onCancel}
            className="w-full rounded-full bg-[#1767AF] hover:bg-[#1356A0] text-white"
          >
            Kembali ke Upload
          </Button>
        )}
      </div>
    </div>
  );
}

/** Auto-proceed component with a brief visible delay */
function AutoProceed({ onProceed }: { onProceed: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onProceed, 800);
    return () => clearTimeout(timer);
  }, [onProceed]);

  return (
    <p className="text-xs text-slate-400 text-center animate-pulse">
      Melanjutkan ke review...
    </p>
  );
}
