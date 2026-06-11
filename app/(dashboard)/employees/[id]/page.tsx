"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState<string>("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const paramsStr = bulan ? `?bulan=${bulan}` : "";
      const res = await fetch(`/api/employees/${id}${paramsStr}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setEmployee(data.employee);
      setSubmissions(data.submissions);
      setSummary(data.summary);
    } catch {
      toast.error("Gagal memuat data karyawan");
      router.push("/employees");
    } finally {
      setLoading(false);
    }
  }, [id, bulan, router]);

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

  if (loading) {
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
        Kembali ke Data Karyawan
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start sm:self-center"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header + Filter */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Riwayat Rekap</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {submissions.length}
            </span>
          </div>

          {/* Month filter */}
          <div className="flex items-center gap-2">
            <select
              className="h-9 px-3 text-sm border border-slate-200 rounded-md text-slate-700 focus:outline-none"
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
          </div>
        </div>

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">Belum ada rekap</p>
            <p className="text-sm text-slate-400 mt-1">
              {bulan
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
      <EmployeeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        employee={employee}
        onSuccess={fetchData}
      />
    </div>
  );
}
