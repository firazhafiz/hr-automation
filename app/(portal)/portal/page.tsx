"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Loader2,
  Download,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FormSubmission } from "@prisma/client";
import { ChangePasswordModal } from "@/components/portal/ChangePasswordModal";

interface Employee {
  id: string;
  nik: string;
  nama: string;
  bagian: string | null;
  departemen: string | null;
}

interface Summary {
  sp: number;
  cuti: number;
  ijin: number;
  total: number;
}

const formatDate = (d: string | Date | null) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getBadge = (jenis: string) => {
  if (jenis === "SP") return "bg-red-100 text-red-700 border-red-200";
  if (jenis === "CUTI")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// ── CSV Export helper ──────────────────────────────────────────────────────────
function exportToCSV(
  data: FormSubmission[],
  employee: Employee,
  bulanLabel: string,
) {
  const formatDateCSV = (d: Date | string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const headers = [
    "No",
    "Jenis Form",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Tanggal Surat",
    "Status TTD",
    "Keterangan/Alasan",
    "Tgl Input",
  ];

  const rows = data.map((row, i) => [
    i + 1,
    row.jenis_form || "",
    formatDateCSV(row.tanggal_mulai),
    formatDateCSV(row.tanggal_selesai),
    formatDateCSV(row.tanggal_surat),
    row.ttd_lengkap ? "Lengkap" : "Tidak Lengkap",
    row.jenis_form === "SP" ? row.alasan || "" : row.keterangan || "",
    formatDateCSV(row.created_at),
  ]);

  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const csvContent = [headers, ...rows]
    .map((r) => r.map(escape).join(","))
    .join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM so Excel opens correctly
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const filename = `Riwayat_${employee.nama.replace(/\s+/g, "_")}_${bulanLabel.replace(/\s+/g, "_")}.csv`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PortalPage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [summary, setSummary] = useState<Summary>({
    sp: 0,
    cuti: 0,
    ijin: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState<string>("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const paramsStr = bulan ? `?bulan=${bulan}` : "";
      const res = await fetch(`/api/portal/profile${paramsStr}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Not found or unauthorized");
      const data = await res.json();
      setEmployee(data.employee);
      setSubmissions(data.submissions);
      setSummary(data.summary);
    } catch {
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }, [bulan]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!employee || submissions.length === 0) {
      toast.warning("Tidak ada data untuk diekspor.");
      return;
    }
    const year = new Date().getFullYear();
    const bulanLabel = bulan
      ? `${MONTHS[Number(bulan.split("-")[1]) - 1]}_${year}`
      : `Semua_Bulan_${year}`;
    exportToCSV(submissions, employee, bulanLabel);
    toast.success(`Berhasil mengekspor riwayat`);
  };

  const initials =
    employee?.nama
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  const avatarBg =
    summary.sp >= 3
      ? "bg-red-100 text-red-700"
      : summary.sp >= 1
        ? "bg-amber-100 text-amber-700"
        : "bg-[#1767AF]/10 text-[#1767AF]";

  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#1767AF] animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 ${avatarBg}`}
          >
            {initials}
          </div> */}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {employee.nama}
            </h1>
            <p className="font-mono text-md text-slate-400 mt-0.5">
              {employee.nik}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {employee.departemen && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {employee.departemen}
                </span>
              )}
              {employee.bagian && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {employee.bagian}
                </span>
              )}
            </div>
            <div className="mt-4 flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 rounded-full text-slate-600 border-slate-200"
                onClick={() => setShowPasswordModal(true)}
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                Ubah Password
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
          <div className="py-4 px-6 text-center bg-slate-50">
            <div className="flex flex-col justify-center items-center">
              <p className="text-xs font-medium text-slate-500">SP</p>
              <p className="text-2xl font-bold text-red-600">{summary.sp}</p>
            </div>
          </div>
          <div className="py-4 px-6 text-center bg-slate-50">
            <div className="flex flex-col justify-center items-center">
              <p className="text-xs font-medium text-slate-500">Cuti</p>
              <p className="text-2xl font-bold text-emerald-600">
                {summary.cuti}
              </p>
            </div>
          </div>
          <div className="py-4 px-6 text-center bg-slate-50">
            <div className="flex flex-col justify-center items-center">
              <p className="text-xs font-medium text-slate-500">Izin</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.ijin}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header + Filter */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-800">Riwayat Saya</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {submissions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              className="h-9 px-3 text-sm border border-slate-200 rounded-md text-slate-700 focus:outline-none flex-1 sm:flex-none"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
            >
              <option value="">Semua ({currentYear})</option>
              {MONTHS.map((m, mi) => {
                const val = `${currentYear}-${String(mi + 1).padStart(2, "0")}`;
                return (
                  <option key={val} value={val}>
                    {m} {currentYear}
                  </option>
                );
              })}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 text-slate-600 border-slate-200"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">Belum ada riwayat</p>
            <p className="text-sm text-slate-400 mt-1">
              {bulan
                ? "Tidak ada data pada periode bulan ini"
                : `Belum ada riwayat form di tahun ${currentYear}`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="px-5 sm:px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* TTD Status strip */}
                <div
                  className={`w-1 h-12 rounded-full shrink-0 mt-1 ${sub.ttd_lengkap ? "bg-emerald-400" : "bg-rose-400"}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] px-2 py-0 ${getBadge(sub.jenis_form)}`}
                    >
                      {sub.jenis_form}
                    </Badge>
                    {sub.ttd_lengkap ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" /> TTD Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                        <ShieldAlert className="w-3 h-3" /> TTD Belum Lengkap
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-medium line-clamp-2 leading-relaxed">
                    {sub.jenis_form === "SP"
                      ? sub.alasan || "Tanpa keterangan alasan pelanggaran"
                      : sub.keterangan || "Tanpa keterangan"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {sub.jenis_form === "SP"
                        ? "Tgl Surat:"
                        : "Tgl Pelaksanaan:"}
                    </span>
                    <span className="font-medium text-slate-500">
                      {sub.jenis_form === "SP"
                        ? formatDate(sub.tanggal_surat)
                        : formatDate(sub.tanggal_mulai) +
                          (sub.tanggal_selesai
                            ? ` — ${formatDate(sub.tanggal_selesai)}`
                            : "")}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
