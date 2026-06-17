"use client";

import { useEffect } from "react";
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
import { useScanStore, ItemStatus } from "@/store/scan-store";

export function BatchProcessingState({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const {
    images,
    batchResults: results,
    currentIndex,
    isProcessing,
    isFinished,
    isRetrying,
    isCancelled,
    startProcessing,
    retryFailed,
    cancelProcessing,
  } = useScanStore();

  useEffect(() => {
    // Start processing as soon as this component mounts
    // The store will handle preventing duplicate runs
    startProcessing();
  }, [startProcessing]);

  const handleProceed = () => {
    onComplete();
  };

  const handleCancel = () => {
    cancelProcessing();
    onCancel();
  };

  const completedCount = results.filter(
    (r) => r.status === "success" || r.status === "error",
  ).length;
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const progress = Math.round((completedCount / images.length) * 100) || 0;

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
          {isFinished && !isRetrying
            ? "Pemrosesan Selesai"
            : "Memproses Dokumen..."}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {isProcessing || isRetrying
            ? `${currentIndex + 1} dari ${images.length}`
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
        {isFinished && !isProcessing && !isRetrying && errorCount > 0 && (
          <>
            <Button
              onClick={() => retryFailed()}
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

        {isFinished &&
          !isProcessing &&
          !isRetrying &&
          errorCount === 0 &&
          successCount > 0 && (
            <AutoProceed onProceed={handleProceed} />
          )}

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

        {isFinished && !isProcessing && !isRetrying && successCount === 0 && (
          <Button
            onClick={handleCancel}
            className="w-full rounded-full bg-[#1767AF] hover:bg-[#1356A0] text-white"
          >
            Kembali ke Upload
          </Button>
        )}
      </div>
    </div>
  );
}

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
