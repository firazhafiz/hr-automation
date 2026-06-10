"use client";

import { useState, useEffect, useCallback } from "react";
import { FormSubmission } from "@prisma/client";
import { RekapTable } from "@/components/submissions/RekapTable";
import { RekapCardList } from "@/components/submissions/RekapCardList";
import { RekapFilters } from "@/components/submissions/RekapFilters";
import { DetailPanel } from "@/components/submissions/DetailPanel";
import { DeleteDialog } from "@/components/submissions/DeleteDialog";
import { toast } from "sonner";
import { AlertTriangle, Calendar, FileCheck } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-md border border-slate-600 p-4 flex items-center gap-4 bg-slate-100/50">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── CSV Export helper ──────────────────────────────────────────────────────────
function exportToCSV(data: FormSubmission[], filename: string) {
  const formatDateCSV = (d: Date | string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const headers = [
    "No", "Nama Karyawan", "NIK", "Jenis Form",
    "Departemen", "Bagian", "Tanggal Mulai", "Tanggal Selesai",
    "Tanggal Surat", "Status TTD", "Keterangan/Alasan", "Tgl Input",
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
    row.jenis_form === "SP"
      ? (row.alasan || "")
      : (row.keterangan || ""),
    formatDateCSV(row.created_at),
  ]);

  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const csvContent = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM so Excel opens correctly
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [data, setData] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const defaultBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [search, setSearch] = useState("");
  const [jenisForm, setJenisForm] = useState("SEMUA");
  const [departemen, setDepartemen] = useState("SEMUA");
  const [bulan, setBulan] = useState(defaultBulan);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (jenisForm && jenisForm !== "SEMUA") params.append("jenis_form", jenisForm);
      if (departemen && departemen !== "SEMUA") params.append("departemen", departemen);
      if (bulan) params.append("bulan", bulan);

      const res = await fetch(`/api/submissions?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, jenisForm, departemen, bulan]);

  useEffect(() => {
    const t = setTimeout(fetchSubmissions, 300);
    return () => clearTimeout(t);
  }, [fetchSubmissions]);

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Data berhasil dihapus");
        fetchSubmissions();
      } else toast.error("Gagal menghapus data");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setSelectedId(null);
    }
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.warning("Tidak ada data untuk diekspor.");
      return;
    }

    // Build a descriptive filename based on active filters
    const parts = ["Rekap_HR"];
    if (jenisForm !== "SEMUA") parts.push(jenisForm);
    if (departemen !== "SEMUA") parts.push(departemen.replace(/\s+/g, "_"));
    if (bulan) {
      const [y, m] = bulan.split("-");
      parts.push(`${MONTHS[Number(m) - 1]}_${y}`);
    } else {
      parts.push("Semua_Bulan");
    }
    const filename = `${parts.join("_")}.csv`;

    exportToCSV(data, filename);
    toast.success(`Berhasil mengekspor ${data.length} data ke ${filename}`);
  };

  const selectedData = data.find((d) => d.id === selectedId) || null;

  const stats = {
    total: data.length,
    sp: data.filter((d) => d.jenis_form === "SP").length,
    cuti: data.filter((d) => d.jenis_form === "CUTI").length,
    ijin: data.filter((d) => d.jenis_form === "IJIN").length,
  };

  const [bulanYear, bulanMonth] = bulan
    ? bulan.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const bulanLabel = bulan ? `${MONTHS[bulanMonth - 1]} ${bulanYear}` : "Semua";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Rekap Form HR
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
            Data rekap SP, Cuti, dan Ijin — {bulanLabel}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Rekap" value={stats.total} icon={FileCheck} color="bg-slate-100 text-slate-600" />
        <StatCard label="Surat Peringatan" value={stats.sp} icon={AlertTriangle} color="bg-red-100 text-red-600" />
        <StatCard label="Cuti" value={stats.cuti} icon={Calendar} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Ijin" value={stats.ijin} icon={Calendar} color="bg-amber-100 text-amber-600" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <RekapFilters
          search={search}
          onSearchChange={setSearch}
          jenisForm={jenisForm}
          onJenisFormChange={setJenisForm}
          departemen={departemen}
          onDepartemenChange={setDepartemen}
          bulan={bulan}
          onBulanChange={setBulan}
          onExport={handleExport}
        />

        {/* Desktop Table */}
        <div className="hidden md:block flex-1">
          <RekapTable
            data={data}
            isLoading={isLoading}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden flex-1 bg-slate-50/50">
          <RekapCardList
            data={data}
            isLoading={isLoading}
            onView={handleView}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <DetailPanel
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedData}
      />
      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
