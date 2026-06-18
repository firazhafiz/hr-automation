"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  FileText,
  Edit2,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/submissions/DeleteDialog";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import { toast } from "sonner";
import { FormSubmission } from "@prisma/client";

interface Employee {
  id: string;
  nik: string;
  nama: string;
  bagian: string | null;
  departemen: string | null;
  is_active: boolean;
  created_at: string;
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
function exportToCSV(data: FormSubmission[], filename: string) {
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
    "Nama Karyawan",
    "NIK",
    "Jenis Form",
    "Departemen",
    "Bagian",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Tanggal Surat",
    "Status TTD",
    "Keterangan/Alasan",
    "Tgl Input",
  ];

  const rows = data.map((row, i) => [
    i + 1,
    row.nama_karyawan || "",
    row.nik_karyawan || "",
    row.jenis_form || "",
    row.departemen || "",
    row.bagian || "",
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

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [summary, setSummary] = useState<Summary>({
    sp: 0,
    cuti: 0,
    ijin: 0,
    total: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [bulan, setBulan] = useState<string>("");
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [jenisForm, setJenisForm] = useState<string>("SEMUA");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteEmployeeOpen, setIsDeleteEmployeeOpen] = useState(false);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(
    async () => {
      if (!id) return;
      
      const isFirstLoad = !hasLoadedRef.current;
      if (isFirstLoad) {
        setInitialLoading(true);
      } else {
        setListLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (bulan) params.append("bulan", bulan);
        else if (tahun) params.append("tahun", tahun.toString());
        if (jenisForm) params.append("jenisForm", jenisForm);

        const res = await fetch(`/api/employees/${id}?${params.toString()}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/employees");
            toast.error("Karyawan tidak ditemukan");
            return;
          }
          throw new Error("Failed to fetch");
        }

        const json = await res.json();
        setEmployee(json.employee);
        setSubmissions(json.submissions);
        setSummary(json.summary);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data");
      } finally {
        if (isFirstLoad) {
          setInitialLoading(false);
          hasLoadedRef.current = true;
        } else {
          setListLoading(false);
        }
      }
    },
    [id, bulan, jenisForm, tahun, router],
  );

  // Load whenever dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Rekap berhasil dihapus");
        fetchData();
      } else toast.error("Gagal menghapus rekap");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!id) return;
    setIsDeletingEmployee(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Karyawan berhasil dihapus");
        router.push("/employees");
      } else {
        toast.error("Gagal menghapus karyawan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeletingEmployee(false);
      setIsDeleteEmployeeOpen(false);
    }
  };

  const handleExport = () => {
    if (submissions.length === 0) {
      toast.warning("Tidak ada data rekap untuk diekspor.");
      return;
    }

    const parts = [employee?.nama?.replace(/\s+/g, "_") || "Karyawan"];
    if (jenisForm !== "SEMUA") parts.push(jenisForm);
    if (bulan) {
      const [y, m] = bulan.split("-");
      parts.push(`${MONTHS[Number(m) - 1]}_${y}`);
    } else {
      parts.push(`Tahun_${tahun}`);
    }
    const filename = `${parts.join("_")}.csv`;

    exportToCSV(submissions, filename);
    toast.success(`Berhasil mengekspor ${submissions.length} data ke ${filename}`);
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
        : "bg-blue-100 text-blue-700";

  const now = new Date();
  const currentYear = now.getFullYear();

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#1767AF] animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-up space-y-6">
      {/* Back Nav */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Kembali
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 ${avatarBg}`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {employee.nama}
            </h1>
            <p className="font-mono text-sm text-slate-400 mt-0.5">
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="cursor-pointer "
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5 " /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteEmployeeOpen(true)}
              className="cursor-pointer "
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
          <div className="py-4 px-6 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.sp}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
              SP
            </p>
          </div>
          <div className="py-4 px-6 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {summary.cuti}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
              Cuti
            </p>
          </div>
          <div className="py-4 px-6 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.ijin}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
              Ijin
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Section */}
      <div className="bg-white rounded-2xl border border-slate-3 overflow-hidden">
        {/* Header + Filter */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Riwayat Rekap</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {submissions.length}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Tahun filter */}
            <select
              className="h-9 px-3 text-sm border border-slate-200 rounded-md text-slate-700 focus:outline-none bg-white cursor-pointer"
              value={tahun}
              onChange={(e) => {
                const newTahun = Number(e.target.value);
                setTahun(newTahun);
                if (bulan) {
                  const [_, m] = bulan.split("-");
                  setBulan(`${newTahun}-${m}`);
                }
              }}
            >
              {Array.from({ length: currentYear - 2026 + 2 }, (_, i) => 2026 + i).map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>

            {/* Month filter */}
            <select
              className="h-9 px-3 text-sm border border-slate-200 rounded-md text-slate-700 focus:outline-none bg-white cursor-pointer"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              {MONTHS.map((m, mi) => {
                const val = `${tahun}-${String(mi + 1).padStart(2, "0")}`;
                return (
                  <option key={val} value={val}>
                    {m}
                  </option>
                );
              })}
            </select>

            {/* Jenis Form selector */}
            <select
              className="h-9 px-3 text-sm border border-slate-200 rounded-md text-slate-700 focus:outline-none bg-white cursor-pointer"
              value={jenisForm}
              onChange={(e) => setJenisForm(e.target.value)}
            >
              <option value="SEMUA">Semua Form</option>
              <option value="SP">SP / PHK</option>
              <option value="CUTI">Cuti</option>
              <option value="IJIN">Izin</option>
            </select>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-9 px-3 shrink-0 text-slate-600 bg-white"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export
            </Button>
          </div>
        </div>

        {/* Submissions list */}
        {listLoading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="px-5 sm:px-6 py-4 flex items-center gap-4 animate-pulse"
              >
                <div className="w-1 h-12 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-4 w-14 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  <div className="h-3 w-1/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">Belum ada rekap</p>
            <p className="text-sm text-slate-400 mt-1">
              {bulan || jenisForm !== "SEMUA"
                ? "Tidak ada data pada periode ini"
                : "Karyawan ini belum pernah mengajukan form"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group"
              >
                {/* TTD Status strip */}
                <div
                  className={`w-1 h-12 rounded-full shrink-0 ${sub.ttd_lengkap ? "bg-emerald-400" : "bg-rose-400"}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[11px] px-2 py-0 ${getBadge(sub.jenis_form)}`}
                    >
                      {sub.jenis_form}
                    </Badge>
                    {sub.ttd_lengkap ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <ShieldCheck className="w-3 h-3" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-500">
                        <ShieldAlert className="w-3 h-3" /> TTD Kurang
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-1 font-medium line-clamp-1">
                    {sub.jenis_form === "SP"
                      ? sub.alasan || "Tanpa keterangan alasan"
                      : sub.keterangan || "Tanpa keterangan"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sub.jenis_form === "SP"
                      ? `Tgl Surat: ${formatDate(sub.tanggal_surat)}`
                      : formatDate(sub.tanggal_mulai) +
                        (sub.tanggal_selesai
                          ? ` — ${formatDate(sub.tanggal_selesai)}`
                          : "")}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setDeleteId(sub.id)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
      <DeleteDialog
        isOpen={isDeleteEmployeeOpen}
        onClose={() => setIsDeleteEmployeeOpen(false)}
        onConfirm={handleDeleteEmployee}
        isLoading={isDeletingEmployee}
        title="Hapus Karyawan?"
        description="Tindakan ini tidak dapat dibatalkan. Karyawan beserta seluruh data rekapnya akan ditandai sebagai dihapus di dalam sistem."
      />
      <EmployeeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        employee={employee}
        onSuccess={fetchData}
      />
    </div>
  );
}
