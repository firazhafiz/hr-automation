"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, ShieldCheck, ShieldAlert } from "lucide-react";
import { FormSubmission } from "@prisma/client";

const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getBadgeColor = (jenis: string) => {
  switch (jenis) {
    case "SP":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
    case "CUTI":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
    case "IJIN":
      return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

interface RekapTableProps {
  data: FormSubmission[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function RekapTable({ data, isLoading, onDelete, onView }: RekapTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-md animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-64">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Belum ada data rekap</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Silakan scan form baru untuk mulai menyimpan rekap data HR.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader className="bg-slate-50/80 sticky top-0 backdrop-blur-sm border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px] text-center font-semibold text-slate-600">No</TableHead>
            <TableHead className="min-w-[150px] font-semibold text-slate-600">Nama Karyawan</TableHead>
            <TableHead className="font-semibold text-slate-600">NIK</TableHead>
            <TableHead className="font-semibold text-slate-600">Jenis Form</TableHead>
            <TableHead className="font-semibold text-slate-600">Bagian / Dept</TableHead>
            <TableHead className="font-semibold text-slate-600">Tanggal Mulai</TableHead>
            <TableHead className="text-center font-semibold text-slate-600">Validasi TTD</TableHead>
            <TableHead className="font-semibold text-slate-600">Tgl Diinput</TableHead>
            <TableHead className="text-right font-semibold text-slate-600">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
              <TableCell className="text-center font-medium text-slate-500">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="font-medium text-slate-900">{row.nama_karyawan}</div>
                {!row.employee_matched && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase font-semibold">
                    Unregistered
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-600">{row.nik_karyawan || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getBadgeColor(row.jenis_form)}>
                  {row.jenis_form}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm text-slate-900">{row.bagian || "-"}</span>
                  <span className="text-xs text-slate-500">{row.departemen || "-"}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 tabular-nums">
                {formatDate(row.tanggal_mulai)}
              </TableCell>
              <TableCell className="text-center">
                {row.ttd_lengkap ? (
                  <div className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 py-1 px-2 rounded-full text-xs font-semibold mx-auto w-fit">
                    <ShieldCheck className="w-3.5 h-3.5" /> Lengkap
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-rose-600 bg-rose-50 py-1 px-2 rounded-full text-xs font-semibold mx-auto w-fit">
                    <ShieldAlert className="w-3.5 h-3.5" /> Invalid
                  </div>
                )}
              </TableCell>
              <TableCell className="text-slate-500 text-sm tabular-nums">
                {formatDate(row.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(row.id)} title="Lihat Detail">
                    <Eye className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(row.id)} title="Hapus">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
