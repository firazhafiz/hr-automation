"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Building2, Briefcase, AlignLeft, ShieldCheck, Check, X, User, Hash, FileText } from "lucide-react";
import { FormSubmission } from "@prisma/client";

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: FormSubmission | null;
}

const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getBadgeStyle = (jenis: string) => {
  switch (jenis) {
    case "SP": return { bg: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" };
    case "CUTI": return { bg: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    case "IJIN": return { bg: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
    default: return { bg: "bg-slate-100 text-slate-800 border-slate-200", dot: "bg-slate-400" };
  }
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-medium text-slate-900 break-words">{value || "-"}</span>
      </div>
    </div>
  );
}

export function DetailPanel({ isOpen, onClose, data }: DetailPanelProps) {
  if (!data) return null;

  const isSP = data.jenis_form === "SP";
  const badgeStyle = getBadgeStyle(data.jenis_form);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0" showCloseButton={false}>
        {/* ── Header ─────────────────────────── */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold text-slate-900 leading-tight">Detail Form HR</SheetTitle>
                <Badge variant="outline" className={`shrink-0 text-xs font-bold ${badgeStyle.bg}`}>
                  {data.jenis_form}
                </Badge>
              </div>
              <SheetDescription className="text-xs text-slate-400">
                Diinput pada {formatDate(data.created_at)}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">

          {/* ── Status TTD ─────────────────────── */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Status Tanda Tangan
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${data.ttd_lengkap ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {data.ttd_lengkap ? "✓ LENGKAP" : "✗ TIDAK LENGKAP"}
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
              {[
                { signed: data.ttd_personalia, label: "Personalia" },
                { signed: data.ttd_atasan, label: isSP ? "Manager" : "Spv/Manager" },
                { signed: data.ttd_pemohon, label: isSP ? "Supervisor" : "Pemohon" },
              ].map((slot, i) => (
                <div key={i} className="flex flex-col items-center py-3 px-2 text-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${slot.signed ? "bg-emerald-100" : "bg-slate-100"}`}>
                    {slot.signed
                      ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                      : <X className="w-3.5 h-3.5 text-slate-400" />
                    }
                  </div>
                  <span className="text-xs font-medium text-slate-600 truncate w-full">{slot.label}</span>
                  <span className={`text-[10px] font-bold uppercase mt-0.5 ${slot.signed ? "text-emerald-600" : "text-slate-400"}`}>
                    {slot.signed ? "Signed" : "Empty"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Informasi Karyawan ─────────────── */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Karyawan</h4>
            </div>
            <div className="bg-white px-4">
              <InfoRow icon={User} label="Nama Karyawan" value={data.nama_karyawan || "-"} />
              <InfoRow icon={Hash} label="NIK" value={data.nik_karyawan || "Tidak Ditemukan"} />
              <InfoRow icon={Building2} label="Departemen" value={data.departemen || "-"} />
              <InfoRow icon={Briefcase} label="Bagian" value={data.bagian || "-"} />
            </div>
          </div>

          {/* ── Detail Form ────────────────────── */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Detail {isSP ? "Peringatan" : "Pengajuan"}
              </h4>
            </div>
            <div className="bg-white px-4">
              {/* Cuti/Ijin: Tgl Mulai & Selesai */}
              {!isSP && (
                <>
                  <InfoRow icon={CalendarDays} label="Tanggal Mulai" value={formatDate(data.tanggal_mulai)} />
                  <InfoRow icon={CalendarDays} label="Tanggal Selesai" value={formatDate(data.tanggal_selesai)} />
                </>
              )}
              {/* SP: hanya Tanggal Surat */}
              <InfoRow icon={FileText} label="Tanggal Surat / Form" value={formatDate(data.tanggal_surat)} />

              {/* Keterangan / Alasan */}
              <div className="py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <AlignLeft className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isSP ? "Alasan Pelanggaran" : "Keterangan"}
                  </span>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed ml-11">
                  {isSP ? (data.alasan || "Tidak ada rincian pelanggaran.") : (data.keterangan || "Tidak ada keterangan.")}
                </p>
              </div>
            </div>
          </div>

          {/* ── Dokumen Asli ─────────────────── */}
          {data.image_url && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumen Asli</h4>
              </div>
              <div className="bg-white p-3">
                <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.image_url} alt="Dokumen Form" className="w-full h-auto object-contain max-h-[500px]" />
                </div>
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
