"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Loader2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DuplicateError {
  nik: string;
  nama: string;
  reason: string;
}

export function EmployeeImportModal({
  isOpen,
  onClose,
  onSuccess,
}: EmployeeImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data (headers and one example row)
    const wsData = [
      ["NIK", "Nama Lengkap", "Departemen", "Bagian"],
      ["123456", "Budi Santoso", "Produksi", "Stamping"],
    ];
    
    // Convert data to worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Karyawan");
    
    // Write the workbook and trigger download
    XLSX.writeFile(wb, "Template_Import_Karyawan.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDuplicates([]); // Reset any previous errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Silakan pilih file Excel terlebih dahulu");
      return;
    }

    setLoading(true);
    setDuplicates([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.duplicates) {
          setDuplicates(data.duplicates);
          toast.error("Terdapat data duplikat! Silakan periksa file Anda.");
        } else {
          toast.error(data.error || "Gagal mengimport data");
        }
        return;
      }

      toast.success(`${data.count} Karyawan berhasil diimport`);
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengimport data");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDuplicates([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Import Karyawan via Excel
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Tambahkan banyak karyawan sekaligus
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Step 1: Download Template */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">1. Unduh Template</h3>
            <p className="text-sm text-slate-500 mb-3">
              Gunakan template ini untuk memastikan format data sesuai.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full justify-start text-[#1767AF] border-[#1767AF]/20 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template Excel
            </Button>
          </div>

          {/* Step 2: Upload Data */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">2. Upload Data</h3>
            
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? "border-[#1767AF] bg-blue-50/50" : "border-slate-300 hover:bg-slate-50"}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileSpreadsheet className="w-8 h-8 text-[#1767AF] mb-2" />
                    <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="mb-1 text-sm text-slate-500">
                      <span className="font-semibold text-[#1767AF]">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-slate-500">.xlsx, .xls</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Duplicates Warning */}
          {duplicates.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Import Dibatalkan - Ditemukan Duplikat</h4>
                  <p className="text-xs text-red-600 mt-1 mb-3">
                    Beberapa karyawan dalam file Excel sudah terdaftar di sistem. Silakan perbaiki data berikut sebelum mencoba lagi:
                  </p>
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {duplicates.map((dup, idx) => (
                      <li key={idx} className="text-xs bg-white p-2 rounded border border-red-100 flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800">{dup.nama} ({dup.nik})</span>
                        <span className="text-red-600">{dup.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full! h-11"
            onClick={handleClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 rounded-full! h-11 bg-[#1767AF] hover:bg-[#1356A0] text-white"
            disabled={!file || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {loading ? "Memproses..." : "Import Karyawan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
