"use client";

import { useState } from "react";
import {
  Check,
  X,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SkipForward,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BatchResultItem } from "@/store/scan-store";

interface BatchScanPreviewProps {
  results: BatchResultItem[];
  onSubmitAll: (items: any[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ScanPreview({
  results,
  onSubmitAll,
  onCancel,
  isSubmitting,
}: BatchScanPreviewProps) {
  // Filter to only successfully parsed items
  const successItems = results.filter((r) => r.status === "success" && r.data);
  const failedItems = results.filter((r) => r.status === "error");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [editedDataMap, setEditedDataMap] = useState<Record<number, any>>(
    () => {
      const map: Record<number, any> = {};
      successItems.forEach((item, idx) => {
        map[idx] = { ...item.data };
      });
      return map;
    },
  );
  const [skippedSet, setSkippedSet] = useState<Set<number>>(new Set());
  const [imgExpanded, setImgExpanded] = useState(false);

  const totalSuccess = successItems.length;
  const currentItem = successItems[currentIdx];
  const formData = editedDataMap[currentIdx] || {};
  const isSkipped = skippedSet.has(currentIdx);

  const handleChange = (field: string, value: string) => {
    setEditedDataMap((prev) => ({
      ...prev,
      [currentIdx]: { ...prev[currentIdx], [field]: value },
    }));
  };

  const getFieldClass = (fieldName: string) => {
    const score = formData.confidence?.[fieldName];
    if (score === undefined) return "";
    if (score < 0.5)
      return "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100";
    if (score < 0.85)
      return "border-amber-300 bg-amber-50/50 focus:border-amber-400 focus:ring-amber-100";
    return "";
  };

  const toggleSkip = () => {
    setSkippedSet((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) {
        next.delete(currentIdx);
      } else {
        next.add(currentIdx);
      }
      return next;
    });
  };

  const handleSubmitAll = () => {
    const itemsToSave = Object.entries(editedDataMap)
      .filter(([idx]) => !skippedSet.has(Number(idx)))
      .map(([idx, data]) => {
        const originalItem = successItems[Number(idx)];
        return {
          ...data,
          raw_ocr_text: originalItem.data.raw_ocr_text,
          tanda_tangan: originalItem.data.tanda_tangan,
          semua_ttd_lengkap: originalItem.data.semua_ttd_lengkap,
          image_url: originalItem.data.image_url,
        };
      });
    onSubmitAll(itemsToSave);
  };

  const saveableCount = totalSuccess - skippedSet.size;
  const hasLowConfidence = Object.values(formData.confidence || {}).some(
    (s: any) => s < 0.85,
  );
  
  // Periksa apakah ada dokumen yang akan disimpan namun TTD-nya belum lengkap
  const hasIncompleteTtdToSave = Object.entries(editedDataMap)
    .filter(([idx]) => !skippedSet.has(Number(idx)))
    .some(([idx]) => {
      const originalItem = successItems[Number(idx)];
      return originalItem.data.semua_ttd_lengkap !== true;
    });

  const isSP = formData.jenis_form === "SP";
  const ttd = currentItem?.data?.tanda_tangan || {};
  const isTtdComplete = currentItem?.data?.semua_ttd_lengkap === true;

  if (totalSuccess === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-up px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <XCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Semua Dokumen Gagal Diproses
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mb-6">
          {failedItems.length} dokumen gagal. Pastikan gambar cukup terang dan
          form terlihat jelas.
        </p>
        <Button
          onClick={onCancel}
          className="bg-[#1767AF] hover:bg-[#1356A0] text-white"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-up">
      {/* ── Document Navigator ─────────────────────── */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          className="h-8 px-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Dot navigator */}
          <div className="flex items-center gap-1.5">
            {successItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIdx
                    ? "bg-[#1767AF] scale-125"
                    : skippedSet.has(idx)
                      ? "bg-slate-300"
                      : "bg-[#1767AF]/30 hover:bg-[#1767AF]/50"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-700 ml-2">
            {currentIdx + 1} / {totalSuccess}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === totalSuccess - 1}
          onClick={() =>
            setCurrentIdx((i) => Math.min(totalSuccess - 1, i + 1))
          }
          className="h-8 px-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Failed items summary (if any) */}
      {failedItems.length > 0 && (
        <div className="flex gap-3 items-start p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>{failedItems.length} dokumen gagal</strong> dan tidak
            ditampilkan. Hanya {totalSuccess} dokumen berhasil yang bisa
            disimpan.
          </p>
        </div>
      )}

      {/* Skip badge */}
      {isSkipped && (
        <div className="flex gap-3 items-center p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm">
          <SkipForward className="w-4 h-4 shrink-0" />
          <p>
            Dokumen ini akan <strong>dilewati</strong> saat menyimpan.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSkip}
            className="ml-auto text-[#1767AF] h-7 text-xs"
          >
            Batalkan Skip
          </Button>
        </div>
      )}

      {/* ── Image (collapsible on mobile) ────────────── */}
      <div className="rounded-md border border-slate-400 overflow-hidden bg-slate-100">
        <button
          onClick={() => setImgExpanded(!imgExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 text-sm font-medium text-slate-700 md:hidden"
        >
          <span>Gambar Form Original</span>
          {imgExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {/* Always show on desktop, toggle on mobile */}
        <div className={`${imgExpanded ? "block" : "hidden"} md:block`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem?.imageFile.src}
            alt="Form"
            className="w-full max-h-[60vh] md:max-h-none object-contain"
          />
        </div>
      </div>

      {/* ── Alerts ──────────────────────────────────── */}
      {!formData.employee_matched && (
        <div className="flex gap-3 items-start p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Karyawan Tidak Ditemukan:</strong> NIK/Nama hasil scan tidak
            ada di database. Data disimpan secara manual.
          </p>
        </div>
      )}
      {!isTtdComplete && (
        <div className="flex gap-3 items-start p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>TTD Tidak Lengkap:</strong> Form tidak dapat disimpan.
            Pastikan ke-3 area tanda tangan terisi.
          </p>
        </div>
      )}
      {hasLowConfidence && (
        <div className="flex gap-3 items-start p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Beberapa field ditandai kuning/merah — AI kurang yakin. Periksa
            dengan gambar di atas.
          </p>
        </div>
      )}

      {/* ── TTD Status ──────────────────────────────── */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" /> Tanda Tangan
          </h3>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isTtdComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {isTtdComplete ? "LENGKAP" : "BELUM LENGKAP"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[ttd.slot_1, ttd.slot_2, ttd.slot_3].map((slot: any, i: number) => (
            <div
              key={i}
              className={`rounded-md border p-2.5 text-center text-xs ${
                slot?.signed
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <p className="font-semibold truncate">{slot?.label || "-"}</p>
              <p
                className={`text-[10px] mt-1 font-bold uppercase ${
                  slot?.signed ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {slot?.signed ? "✓ Signed" : "✗ Empty"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form Fields ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Data Form</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Jenis Form */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jenis Form
            </Label>
            <div className="flex gap-2">
              {["CUTI", "IJIN", "SP"].map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleChange("jenis_form", j)}
                  className={`flex-1 h-9 rounded-full text-sm font-semibold border transition-all ${
                    formData.jenis_form === j
                      ? j === "SP"
                        ? "bg-red-100 border-red-300 text-red-700"
                        : j === "CUTI"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-amber-100 border-amber-300 text-amber-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* NIK + Nama */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="nik"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                NIK
              </Label>
              <Input
                id="nik"
                value={formData.nik || ""}
                onChange={(e) => handleChange("nik", e.target.value)}
                className={`h-10 ${getFieldClass("nik")}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="nama"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                required
                value={formData.nama || ""}
                onChange={(e) => handleChange("nama", e.target.value)}
                className={`h-10 ${getFieldClass("nama")}`}
              />
            </div>
          </div>

          {/* Dept + Bagian */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Departemen
              </Label>
              <Input
                value={formData.departemen || ""}
                onChange={(e) => handleChange("departemen", e.target.value)}
                className={`h-10 ${getFieldClass("departemen")}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bagian
              </Label>
              <Input
                value={formData.bagian || ""}
                onChange={(e) => handleChange("bagian", e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Tanggal: Cuti/Ijin → Mulai + Selesai | SP → hanya Tgl Surat */}
          {!isSP ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tgl Mulai Cuti/Ijin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    required
                    value={formData.tanggal_mulai || ""}
                    onChange={(e) =>
                      handleChange("tanggal_mulai", e.target.value)
                    }
                    className={`h-10 ${getFieldClass("tanggal_mulai")}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tgl Selesai Cuti/Ijin
                  </Label>
                  <Input
                    type="date"
                    value={formData.tanggal_selesai || ""}
                    onChange={(e) =>
                      handleChange("tanggal_selesai", e.target.value)
                    }
                    className={`h-10 ${getFieldClass("tanggal_selesai")}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tgl Surat (Pembuatan)
                  </Label>
                  <Input
                    type="date"
                    value={formData.tanggal_surat || ""}
                    onChange={(e) =>
                      handleChange("tanggal_surat", e.target.value)
                    }
                    className={`h-10 ${getFieldClass("tanggal_surat")}`}
                  />
                </div>
              </div>
            </>
          ) : (
            /* SP: hanya Tanggal Surat */
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tgl Surat (Pembuatan) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  value={formData.tanggal_surat || ""}
                  onChange={(e) =>
                    handleChange("tanggal_surat", e.target.value)
                  }
                  className={`h-10 ${getFieldClass("tanggal_surat")}`}
                />
              </div>
            </div>
          )}

          {/* Keterangan / Alasan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isSP ? "Alasan Pelanggaran" : "Keterangan"}
            </Label>
            <Textarea
              rows={3}
              value={isSP ? formData.alasan || "" : formData.keterangan || ""}
              onChange={(e) =>
                handleChange(isSP ? "alasan" : "keterangan", e.target.value)
              }
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Submit Footer ─────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 rounded-b-2xl">
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full text-sm"
            onClick={toggleSkip}
          >
            <SkipForward className="w-4 h-4 mr-1.5" />
            {isSkipped ? "Batalkan Skip" : "Skip Dokumen Ini"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full text-sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
        
        {hasIncompleteTtdToSave && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
            Ada dokumen dengan TTD tidak lengkap. Silakan lewati (skip) dokumen tersebut agar bisa menyimpan sisanya.
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmitAll}
          disabled={isSubmitting || saveableCount === 0 || hasIncompleteTtdToSave}
          className="w-full h-12 rounded-full bg-[#1767AF] hover:bg-[#1356A0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Semua ({saveableCount} dokumen)
            </>
          )}
        </Button>
      </div>

      {/* ── Full-screen overlay saat menyimpan ─────── */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="bg-white rounded-md border border-slate-100 p-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#1767AF] animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 text-base">
                Menyimpan {saveableCount} Dokumen...
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Harap tunggu sebentar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
