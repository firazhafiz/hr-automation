"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  CreditCard,
  Building2,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Employee {
  id?: string;
  nik: string;
  nama: string;
  bagian: string | null;
  departemen: string | null;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null; // null = mode tambah
  onSuccess: () => void;
}

const DEPT_OPTIONS = [
  "Produksi",
  "Quality Control",
  "PPIC",
  "Maintenance",
  "HRPGA",
  "Finance",
  "Logistik",
  "Engineering",
];

export function EmployeeModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EmployeeModalProps) {
  const isEdit = !!employee?.id;
  const [form, setForm] = useState({
    nik: "",
    nama: "",
    bagian: "",
    departemen: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        nik: employee.nik || "",
        nama: employee.nama || "",
        bagian: employee.bagian || "",
        departemen: employee.departemen || "",
      });
    } else {
      setForm({ nik: "", nama: "", bagian: "", departemen: "" });
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/employees/${employee!.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan data");
        return;
      }

      toast.success(
        isEdit
          ? "Data karyawan berhasil diperbarui"
          : "Karyawan baru berhasil ditambahkan",
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? "Perbarui data karyawan" : "Masukkan data karyawan"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="nik"
              className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> NIK{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nik"
              required
              placeholder="cth. 1701p0037"
              value={form.nik}
              onChange={(e) => handleChange("nik", e.target.value)}
              disabled={isEdit}
              className="h-10"
            />
            {isEdit && (
              <p className="text-xs text-slate-400">NIK tidak dapat diubah</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="nama"
              className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-400" /> Nama Lengkap{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nama"
              required
              placeholder="cth. Budi Santoso"
              value={form.nama}
              onChange={(e) => handleChange("nama", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="departemen"
                className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Departemen
              </Label>
              <Input
                id="departemen"
                list="dept-list"
                placeholder="cth. Produksi"
                value={form.departemen}
                onChange={(e) => handleChange("departemen", e.target.value)}
                className="h-10"
              />
              <datalist id="dept-list">
                {DEPT_OPTIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="bagian"
                className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Bagian
              </Label>
              <Input
                id="bagian"
                placeholder="cth. Stamping"
                value={form.bagian}
                onChange={(e) => handleChange("bagian", e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full! flex-1 h-11"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-full! flex-1 h-11 bg-[#1767AF] hover:bg-[#1356A0] text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {loading
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Karyawan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
