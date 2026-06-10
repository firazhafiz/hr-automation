"use client";

import { Badge } from "@/components/ui/badge";
import { FormSubmission } from "@prisma/client";
import { ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";

const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const getBadgeColor = (jenis: string) => {
  if (jenis === "SP") return "bg-red-100 text-red-700 border-red-200";
  if (jenis === "CUTI") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

interface RekapCardListProps {
  data: FormSubmission[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RekapCardList({ data, isLoading, onView, onDelete }: RekapCardListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
        <p className="font-medium">Tidak ada rekap ditemukan</p>
        <p className="text-sm text-slate-400 mt-1">Coba ubah filter bulan atau kata kunci</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {data.map((row) => (
        <div
          key={row.id}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex"
        >
          {/* TTD Status strip */}
          <div className={`w-1.5 shrink-0 ${row.ttd_lengkap ? "bg-emerald-400" : "bg-rose-400"}`} />

          {/* Content — tappable */}
          <div
            className="flex-1 min-w-0 p-4 cursor-pointer active:bg-slate-50 transition-colors"
            onClick={() => onView(row.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={`text-[11px] px-2 py-0 leading-5 ${getBadgeColor(row.jenis_form)}`}>
                    {row.jenis_form}
                  </Badge>
                  {row.ttd_lengkap
                    ? <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium"><ShieldCheck className="w-3 h-3" /> Valid</span>
                    : <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500 font-medium"><ShieldAlert className="w-3 h-3" /> TTD Kurang</span>
                  }
                </div>
                <p className="font-semibold text-slate-900 text-sm truncate">{row.nama_karyawan}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {row.bagian || row.departemen || "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500 tabular-nums">{formatDate(row.tanggal_mulai)}</p>
              </div>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDelete(row.id)}
            className="shrink-0 flex items-center justify-center w-12 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
