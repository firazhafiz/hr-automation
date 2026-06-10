"use client";

import { Search, Download, Filter, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

interface RekapFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  jenisForm: string;
  onJenisFormChange: (value: string) => void;
  departemen: string;
  onDepartemenChange: (value: string) => void;
  bulan: string;
  onBulanChange: (value: string) => void;
  onExport: () => void;
}

export function RekapFilters({
  search,
  onSearchChange,
  jenisForm,
  onJenisFormChange,
  departemen,
  onDepartemenChange,
  bulan,
  onBulanChange,
  onExport,
}: RekapFiltersProps) {
  const now = new Date();
  const yearOptions = Array.from(
    { length: 4 },
    (_, i) => now.getFullYear() - i,
  );

  return (
    <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
      {/* Row 1: Search + Export */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Cari nama atau NIK..."
            className="pl-9 h-10 bg-white border-slate-400 rounded-md text-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-10 px-3 sm:px-4 text-slate-600 border-slate-400 bg-white rounded-md font-medium shrink-0"
          onClick={onExport}
        >
          <Download className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline text-sm">Export</span>
        </Button>
      </div>

      {/* Row 2: Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Bulan filter */}
        <div className="relative flex items-center">
          <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            className="h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 appearance-none cursor-pointer"
            value={bulan}
            onChange={(e) => onBulanChange(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {yearOptions.map((year) =>
              MONTHS.map((m, mi) => {
                const val = `${year}-${String(mi + 1).padStart(2, "0")}`;
                return (
                  <option key={val} value={val}>
                    {m} {year}
                  </option>
                );
              }),
            )}
          </select>
        </div>

        {/* Jenis Form */}
        <div className="relative flex items-center">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            className="h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 appearance-none cursor-pointer"
            value={jenisForm}
            onChange={(e) => onJenisFormChange(e.target.value)}
          >
            <option value="SEMUA">Semua Form</option>
            <option value="SP">SP / PHK</option>
            <option value="CUTI">Cuti</option>
            <option value="IJIN">Ijin</option>
          </select>
        </div>

        {/* Departemen */}
        <select
          className="h-9 px-3 text-sm border border-slate-200 rounded-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 appearance-none cursor-pointer"
          value={departemen}
          onChange={(e) => onDepartemenChange(e.target.value)}
        >
          <option value="SEMUA">Semua Dept</option>
          <option value="Produksi">Produksi</option>
          <option value="Quality Control">Quality Control</option>
          <option value="PPIC">PPIC</option>
          <option value="Maintenance">Maintenance</option>
          <option value="HRPGA">HRPGA</option>
          <option value="Finance">Finance</option>
          <option value="Engineering">Engineering</option>
        </select>
      </div>
    </div>
  );
}
